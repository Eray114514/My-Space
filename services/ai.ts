import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const env = (import.meta as any).env;

// --- Clients ---

// 1. Google Gemini
const geminiClient = new GoogleGenAI({ apiKey: env.VITE_GOOGLE_API_KEY });

// 2. DeepSeek Official
// 使用 placeholder 防止在没有 key 时初始化报错，实际调用时会检查
const deepseekClient = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: env.VITE_DEEPSEEK_API_KEY || 'sk-placeholder', 
  dangerouslyAllowBrowser: true
});

// 3. OpenRouter (New)
const openRouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.VITE_OPENROUTER_API_KEY || 'sk-placeholder',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
    "X-Title": "Eray Space",
  }
});

// --- Models Configuration ---

export const AI_MODELS = {
  // DeepSeek Official
  'deepseek-chat': { 
    provider: 'deepseek', 
    modelId: 'deepseek-chat', 
    name: 'DeepSeek 默认', 
    shortName: '默认',
    description: 'V3 模型，速度快，性价比高。' 
  },
  'deepseek-reasoner': { 
    provider: 'deepseek', 
    modelId: 'deepseek-reasoner', 
    name: 'DeepSeek 思考', 
    shortName: '思考',
    description: 'R1 推理模型，擅长复杂逻辑和代码。' 
  },
  
  // Google
  'gemini-flash': { 
    provider: 'gemini', 
    modelId: 'gemini-3-flash-preview', 
    name: 'Gemini Flash', 
    shortName: 'Flash',
    description: 'Google 最新模型，响应极快。' 
  },

  // OpenRouter (Free Tier)
  'openrouter-r1': { 
    provider: 'openrouter', 
    modelId: 'tngtech/deepseek-r1t2-chimera:free', 
    name: 'DeepSeek R1 (Free)', 
    shortName: 'R1 Free',
    description: 'OpenRouter 免费版 R1。' 
  },
  'openrouter-v3': { 
    provider: 'openrouter', 
    modelId: 'nex-agi/deepseek-v3.1-nex-n1:free', 
    name: 'DeepSeek V3.1 (Free)', 
    shortName: 'V3.1 Free',
    description: 'OpenRouter 免费版 V3.1。' 
  }
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

// Helper to execute request based on model key
const executeAIRequest = async (modelKey: AIModelKey, systemPrompt: string, userPrompt: string, temperature: number = 0.7, streamCallback?: (text: string) => void): Promise<string> => {
  const config = AI_MODELS[modelKey];
  if (!config) throw new Error(`Unknown model key: ${modelKey}`);

  // 1. Gemini Handling
  if (config.provider === 'gemini') {
    if (!env.VITE_GOOGLE_API_KEY) throw new Error("请在 .env 设置 VITE_GOOGLE_API_KEY");
    
    // Streaming
    if (streamCallback) {
        const response = await geminiClient.models.generateContentStream({
            model: config.modelId,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature }
        });
        let fullText = '';
        for await (const chunk of response) {
            if (chunk.text) {
                streamCallback(chunk.text);
                fullText += chunk.text;
            }
        }
        return fullText;
    } 
    // Non-streaming
    else {
        const response = await geminiClient.models.generateContent({
            model: config.modelId,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature }
        });
        return response.text || '';
    }
  }

  // 2. OpenAI Compatible Handling (DeepSeek & OpenRouter)
  let client: OpenAI;
  let apiKey = '';
  
  if (config.provider === 'deepseek') {
      apiKey = env.VITE_DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error("请在 .env 设置 VITE_DEEPSEEK_API_KEY");
      client = deepseekClient;
  } else {
      apiKey = env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("请在 .env 设置 VITE_OPENROUTER_API_KEY");
      client = openRouterClient;
  }

  const options: any = {
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
      ],
      model: config.modelId,
      stream: !!streamCallback,
  };

  // 推理模型 (R1/Reasoner) 不支持 temperature 参数，必须过滤掉
  const isReasoningModel = config.modelId.includes('reasoner') || config.modelId.includes('r1');
  if (!isReasoningModel) {
      options.temperature = temperature;
  }

  try {
      if (streamCallback) {
          const stream = await client.chat.completions.create(options) as any;
          let fullText = '';
          for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                  streamCallback(content);
                  fullText += content;
              }
          }
          return fullText;
      } else {
          const response = await client.chat.completions.create(options);
          return response.choices[0]?.message?.content || '';
      }
  } catch (error: any) {
      console.error("AI Request Failed:", error);
      throw new Error(error?.message || "AI Request Failed");
  }
};

export const AIService = {
  
  /**
   * Generates summary (Streaming supported)
   */
  generateSummaryStream: async (content: string, modelKey: AIModelKey, onChunk: (text: string) => void) => {
    const systemInstruction = "你是一个专业的个人博客编辑助手。请根据用户提供的 Markdown 文章内容，生成一段简洁、优雅、有吸引力的中文摘要（Summary）。要求：\n1. 字数控制在 60-120 字之间。\n2. 语气平和、知性、高级，符合个人博客的调性。\n3. 直接输出摘要内容，不要包含“好的”、“这是摘要”等任何开场白或结束语。";
    await executeAIRequest(modelKey, systemInstruction, content, 1.0, onChunk);
  },

  /**
   * Generates tags
   */
  generateTags: async (title: string, content: string, existingTags: string[], modelKey: AIModelKey): Promise<string[]> => {
    const isAdding = existingTags.length > 0;
    const count = isAdding ? 1 : 2;
    
    const systemInstruction = `你是一个专业的博客标签生成器。
    请根据文章标题和内容，生成 ${count} 个最相关的技术或主题标签。
    ${isAdding ? `现有标签为：${JSON.stringify(existingTags)}，请不要重复。` : ''}
    标签应简洁精准（例如："React", "Web Design", "Life"）。
    必须只返回一个纯 JSON 字符串数组，例如：["Tag1", "Tag2"]。
    不要返回任何 markdown 格式，不要有任何解释文字。`;
    
    const userPrompt = `标题：${title}\n内容摘要：${content.substring(0, 500)}`;

    try {
        let responseText = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.5);
        
        // Cleanup response
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        // 尝试提取 JSON 数组
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        }
        
        const tags = JSON.parse(responseText);
        return Array.isArray(tags) ? tags.map(String) : [];
    } catch (e) {
        console.error("AI Tag Generation Failed", e);
        return [];
    }
  },

  /**
   * Recommend Icon
   */
  recommendIcon: async (title: string, description: string, availableIcons: string[], modelKey: AIModelKey): Promise<string | null> => {
    const iconsString = availableIcons.join(',');
    const systemInstruction = `你是一个UI设计师。请从我提供的【图标列表】中，严格选择一个最能代表用户项目名称和描述的图标名称。
    【图标列表】：${iconsString}
    重要规则：只输出列表中的某一个单词。严禁编造。严禁输出标点符号。`;

    const userPrompt = `项目名称：${title}\n描述：${description}`;

    try {
        let result = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.1);
        const words = result.trim().split(/\s+/);
        const lastWord = words[words.length - 1].replace(/['"`.]/g, '');
        return lastWord;
    } catch (e) {
        console.error("Recommend Icon Failed", e);
        return null;
    }
  },

  /**
   * Generate SVG Icon
   * 独立的模型选择，通常使用 reasoning 模型效果最好
   */
  generateSVGIcon: async (title: string, description: string, modelKey: AIModelKey): Promise<string> => {
      const systemInstruction = `你是一个 SVG 代码生成器。请根据项目描述，生成一个现代、简约、Outline 风格的 SVG 图标代码。
      
      技术约束：
      1. 必须包含 viewBox="0 0 24 24"。
      2. 必须设置 stroke="currentColor", fill="none", stroke-width="2", stroke-linecap="round", stroke-linejoin="round"。
      3. 仅返回 <svg>...</svg> 标签及其内容。
      4. 严禁包含 <?xml ...?> 声明或 <!DOCTYPE ...>。
      5. 严禁使用 markdown 代码块标记。不要有任何文字解释。
      6. 确保代码是有效的 SVG，可以直接嵌入 HTML。`;
      
      const userPrompt = `项目名称：${title}\n描述：${description}\n设计要求：抽象、极简、高科技感。`;

      try {
        // Reasoning models works best here
        let svg = await executeAIRequest(modelKey, systemInstruction, userPrompt, 0.7);
        
        // Cleanup Markdown
        if (svg.includes('```xml')) svg = svg.replace(/```xml/g, '').replace(/```/g, '');
        if (svg.includes('```svg')) svg = svg.replace(/```svg/g, '').replace(/```/g, '');
        if (svg.includes('```')) svg = svg.replace(/```/g, '');
        
        svg = svg.trim();
        
        // Extract <svg>...</svg>
        const svgStart = svg.indexOf('<svg');
        const svgEnd = svg.lastIndexOf('</svg>');
        
        if (svgStart !== -1 && svgEnd !== -1) {
            svg = svg.substring(svgStart, svgEnd + 6);
        } else if (!svg.startsWith('<svg') && (svg.includes('path') || svg.includes('circle') || svg.includes('rect'))) {
             // Fallback if only path is returned
             svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
        }
        
        return svg;
    } catch (e) {
        console.error("Generate SVG Failed", e);
        return '';
    }
  }
};
