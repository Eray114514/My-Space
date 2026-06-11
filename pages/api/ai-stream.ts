import OpenAI from "openai";
import { OpenRouter } from "@openrouter/sdk";

export const config = {
    runtime: 'edge'
};

const isKeyValid = (key: string | undefined): boolean => {
    return !!key && key.trim() !== '' && key.trim().toLowerCase() !== 'none';
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const { action, args } = await req.json();

    let systemPrompt = "";
    let messages: Record<string, any>[] = [];
    let modelKey = "";
    let temperature = 0.7;
    let enableThinking = false; // Only enable for chat

    if (action === 'generateSummaryStream') {
        const [content, mk] = args;
        modelKey = mk;
        systemPrompt = "你是一个专业的个人博客编辑助手。请根据用户提供的 Markdown 文章内容，生成一段简洁、优雅、有吸引力的中文摘要（Summary）。要求：\n1. 字数控制在 60-120 字之间。\n2. 语气平和、知性、高级，符合个人博客的调性。\n3. 直接输出摘要内容，不要包含「好的」「这是摘要」等任何开场白或结束语。";
        messages = [{ role: "user", content }];
        temperature = 1.0;
        enableThinking = false;
    } else if (action === 'chatStream') {
        const [msgs, mk] = args;
        modelKey = mk;
        systemPrompt = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";
        messages = msgs;
        enableThinking = true; // Only chat enables thinking
    } else {
        return new Response('Unknown action', { status: 400 });
    }

    // Parse modelKey: format is "provider:modelId"
    let provider = '';
    let modelId = '';
    if (modelKey.includes(':')) {
        const parts = modelKey.split(':');
        provider = parts[0];
        modelId = parts.slice(1).join(':');
    } else {
        return new Response(`Invalid model key format: ${modelKey}. Expected "provider:modelId"`, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                if (provider === 'openrouter') {
                    const key = process.env.OPENROUTER_API_KEY;
                    if (!isKeyValid(key)) throw new Error("OpenRouter API Key not configured");
                    const openrouter = new OpenRouter({ apiKey: key });

                    const openAiMessages = [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({ role: m.role as "user"|"assistant"|"system", content: m.content }))
                    ];

                    const options: any = {
                        messages: openAiMessages,
                        model: modelId,
                        stream: true,
                    };

                    if (!enableThinking) {
                        options.temperature = temperature;
                    }

                    // Only enable reasoning for chat
                    if (enableThinking) {
                        options.reasoning = { enabled: true, effort: 'high' };
                    }

                    const stream = (await openrouter.chat.send({ chatRequest: options })) as unknown as AsyncIterable<any>;
                    let reasoningBuffer = '';
                    let contentBuffer = '';
                    for await (const chunk of stream) {
                        const delta = chunk.choices?.[0]?.delta;
                        const reasoning = delta?.reasoning || '';
                        const content = delta?.content || '';

                        if (reasoning) {
                            reasoningBuffer += reasoning;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', reasoning: reasoningBuffer })}\n\n`));
                        }
                        if (content) {
                            contentBuffer += content;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: contentBuffer, reasoning: reasoningBuffer })}\n\n`));
                        }
                    }
                } else {
                    let client: OpenAI | null = null;
                    if (provider === 'deepseek') {
                        const key = process.env.DEEPSEEK_API_KEY;
                        if (!isKeyValid(key)) throw new Error("DeepSeek API Key not configured");
                        client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: key });
                    }

                    if (!client) throw new Error(`Unknown provider: ${provider}`);

                    const openAiMessages = [
                        { role: "system", content: systemPrompt },
                        ...messages.map(m => ({ role: m.role as "user"|"assistant"|"system", content: m.content }))
                    ];

                    const options: any = {
                        messages: openAiMessages,
                        model: modelId,
                        stream: true,
                    };

                    if (!enableThinking) {
                        options.temperature = temperature;
                    }

                    // Only enable thinking for chat
                    if (enableThinking) {
                        options.extra_body = { thinking: { type: 'enabled' } };
                        const isReasoningModel = modelId.includes('reasoner') || modelId.includes('r1') || modelId.includes('pro');
                        if (isReasoningModel) {
                            options.reasoning_effort = 'high';
                        }
                    }

                    const res = (await client.chat.completions.create(options)) as unknown as AsyncIterable<any>;
                    let reasoningBuffer = '';
                    let contentBuffer = '';
                    for await (const chunk of res) {
                        const delta = chunk.choices[0]?.delta;
                        const reasoning = delta?.reasoning_content || '';
                        const content = delta?.content || '';

                        if (reasoning) {
                            reasoningBuffer += reasoning;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', reasoning: reasoningBuffer })}\n\n`));
                        }
                        if (content) {
                            contentBuffer += content;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: contentBuffer, reasoning: reasoningBuffer })}\n\n`));
                        }
                    }
                }
            } catch (e: unknown) {
                console.error("Stream error:", e);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: `\n\n[Error: ${e instanceof Error ? e.message : 'Unknown error'}]`, reasoning: '' })}\n\n`));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
    });
}
