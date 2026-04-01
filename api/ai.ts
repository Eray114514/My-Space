import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

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

const executeAIRequest = async (modelKey: string, systemPrompt: string, userPrompt: string, temperature: number = 0.7): Promise<string> => {
    const config = (ALL_POTENTIAL_MODELS as any)[modelKey];
    if (!config) throw new Error(`Model ${modelKey} is not supported.`);

    if (config.provider === 'gemini') {
        const key = process.env.GEMINI_API_KEY;
        if (!isKeyValid(key)) throw new Error("Gemini API Key not configured");
        const geminiClient = new GoogleGenAI({ apiKey: key });
        const response = await geminiClient.models.generateContent({
            model: config.modelId,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature }
        });
        return response.text || '';
    }

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

    const options: any = {
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: config.modelId,
    };

    const isReasoningModel = config.modelId.includes('reasoner') || config.modelId.includes('r1');
    if (!isReasoningModel) {
        options.temperature = temperature;
    }

    const response = await client.chat.completions.create(options);
    return response.choices[0]?.message?.content || '';
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { action, args } = req.body;

    try {
        let data;
        if (action === 'generateTags') {
            const [title, content, existingTags, modelKey] = args;
            const isAdding = existingTags.length > 0;
            const count = isAdding ? 1 : 2;
            const systemInstruction = `你是一个专业的博客标签生成器。请根据文章标题和内容，生成 ${count} 个最相关的技术或主题标签。${isAdding ? `现有标签为：${JSON.stringify(existingTags)}，请不要重复。` : ''}必须只返回一个纯 JSON 字符串数组，例如：["Tag1", "Tag2"]。不要返回任何 markdown 格式，不要有任何解释文字。`;
            const userPrompt = `标题：${title}\n内容摘要：${content.substring(0, 500)}`;
            let responseText = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.5);
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = responseText.match(/\[.*\]/s);
            if (jsonMatch) responseText = jsonMatch[0];
            data = Array.isArray(JSON.parse(responseText)) ? JSON.parse(responseText).map(String) : [];
        } else if (action === 'recommendIcon') {
            const [title, description, availableIcons, modelKey] = args;
            const iconsString = availableIcons.join(',');
            const systemInstruction = `你是一个UI设计师。请从我提供的【图标列表】中，严格选择一个最能代表用户项目名称和描述的图标名称。\n【图标列表】：${iconsString}\n重要规则：只输出列表中的某一个单词。严禁编造。严禁输出标点符号。`;
            const userPrompt = `项目名称：${title}\n描述：${description}`;
            let result = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.1);
            const words = result.trim().split(/\s+/);
            data = words[words.length - 1].replace(/['"`.]/g, '');
        } else if (action === 'generateSVGIcon') {
            const [title, description, modelKey] = args;
            const systemInstruction = `你是一个 SVG 代码生成器。请根据项目描述，生成一个现代、简约、Outline 风格的 SVG 图标代码。\n技术约束：\n1. 必须包含 viewBox="0 0 24 24"。\n2. 必须设置 stroke="currentColor", fill="none", stroke-width="2", stroke-linecap="round", stroke-linejoin="round"。\n3. 仅返回 <svg>...</svg> 标签及其内容。\n4. 严禁包含 <?xml ...?> 声明或 <!DOCTYPE ...>。\n5. 严禁使用 markdown 代码块标记。不要有任何文字解释。\n6. 确保代码是有效的 SVG，可以直接嵌入 HTML。`;
            const userPrompt = `项目名称：${title}\n描述：${description}\n设计要求：抽象、极简、高科技感。`;
            let svg = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.7);
            if (svg.includes('```xml')) svg = svg.replace(/```xml/g, '').replace(/```/g, '');
            if (svg.includes('```svg')) svg = svg.replace(/```svg/g, '').replace(/```/g, '');
            if (svg.includes('```')) svg = svg.replace(/```/g, '');
            svg = svg.trim();
            const svgStart = svg.indexOf('<svg');
            const svgEnd = svg.lastIndexOf('</svg>');
            if (svgStart !== -1 && svgEnd !== -1) {
                svg = svg.substring(svgStart, svgEnd + 6);
            } else if (!svg.startsWith('<svg') && (svg.includes('path') || svg.includes('circle') || svg.includes('rect'))) {
                svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
            }
            data = svg;
        } else {
            return res.status(400).json({ error: `Unknown action ${action}` });
        }
        return res.json({ data });
    } catch (e: any) {
        console.error(`AI API Error [${action}]:`, e);
        return res.status(500).json({ error: e.message });
    }
}
