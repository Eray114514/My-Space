import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export const config = {
    runtime: 'edge'
};

const isKeyValid = (key: string | undefined): boolean => {
    return !!key && key.trim() !== '' && key.trim().toLowerCase() !== 'none';
};

const ALL_POTENTIAL_MODELS = {
  'deepseek-chat': { provider: 'deepseek', modelId: 'deepseek-chat' },
  'deepseek-reasoner': { provider: 'deepseek', modelId: 'deepseek-reasoner' },
  'gemini-flash': { provider: 'gemini', modelId: 'gemini-3-flash-preview' },
  'openrouter-r1': { provider: 'openrouter', modelId: 'tngtech/deepseek-r1t2-chimera:free' },
  'openrouter-v3': { provider: 'openrouter', modelId: 'nex-agi/deepseek-v3.1-nex-n1:free' }
} as const;

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const { action, args } = await req.json();

    let systemPrompt = "";
    let messages: any[] = [];
    let modelKey = "";
    let temperature = 0.7;

    if (action === 'generateSummaryStream') {
        const [content, mk] = args;
        modelKey = mk;
        systemPrompt = "你是一个专业的个人博客编辑助手。请根据用户提供的 Markdown 文章内容，生成一段简洁、优雅、有吸引力的中文摘要（Summary）。要求：\n1. 字数控制在 60-120 字之间。\n2. 语气平和、知性、高级，符合个人博客的调性。\n3. 直接输出摘要内容，不要包含“好的”、“这是摘要”等任何开场白或结束语。";
        messages = [{ role: "user", content }];
        temperature = 1.0;
    } else if (action === 'chatStream') {
        const [msgs, mk] = args;
        modelKey = mk;
        systemPrompt = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";
        messages = msgs;
    } else {
        return new Response('Unknown action', { status: 400 });
    }

    const config = (ALL_POTENTIAL_MODELS as any)[modelKey];
    if (!config) return new Response(`Model ${modelKey} not supported`, { status: 400 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                if (config.provider === 'gemini') {
                    const key = process.env.GEMINI_API_KEY;
                    if (!isKeyValid(key)) throw new Error("Gemini API Key not configured");
                    const geminiClient = new GoogleGenAI({ apiKey: key });

                    const geminiContent = messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));

                    const response = await geminiClient.models.generateContentStream({
                        model: config.modelId,
                        contents: geminiContent,
                        config: { systemInstruction: systemPrompt, temperature }
                    });

                    for await (const chunk of response) {
                        if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
                    }
                } else {
                    let client: OpenAI | null = null;
                    if (config.provider === 'deepseek') {
                        const key = process.env.DEEPSEEK_API_KEY;
                        if (!isKeyValid(key)) throw new Error("DeepSeek API Key not configured");
                        client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: key });
                    } else {
                        const key = process.env.OPENROUTER_API_KEY;
                        if (!isKeyValid(key)) throw new Error("OpenRouter API Key not configured");
                        client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: key });
                    }

                    const openAiMessages = [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({ role: m.role as "user"|"assistant"|"system", content: m.content }))
                    ];

                    const options: any = {
                        messages: openAiMessages,
                        model: config.modelId,
                        stream: true,
                    };

                    const isReasoningModel = config.modelId.includes('reasoner') || config.modelId.includes('r1');
                    if (!isReasoningModel) {
                        options.temperature = temperature;
                    }

                    const res = await client.chat.completions.create(options) as any;
                    for await (const chunk of res) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            } catch (e: any) {
                controller.enqueue(encoder.encode(`\n\n[Error: ${e.message}]`));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
