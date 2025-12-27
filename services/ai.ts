import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Fix: In Vite, use import.meta.env instead of process.env
// Please ensure VITE_GOOGLE_API_KEY and VITE_DEEPSEEK_API_KEY are set in your .env file
const env = (import.meta as any).env;

// Initialize Gemini
const geminiClient = new GoogleGenAI({ apiKey: env.VITE_GOOGLE_API_KEY });

// Initialize DeepSeek
const deepseekClient = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: env.VITE_DEEPSEEK_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export type AIProvider = 'gemini' | 'deepseek';

export const AIService = {
  /**
   * Generates a blog post summary using the selected provider in streaming mode.
   * @param content The full article content
   * @param provider The AI provider to use ('gemini' or 'deepseek')
   * @param onChunk Callback function to receive stream chunks
   */
  generateSummaryStream: async (content: string, provider: AIProvider, onChunk: (text: string) => void) => {

    const systemInstruction = "你是一个专业的个人博客编辑助手。请根据用户提供的 Markdown 文章内容，生成一段简洁、优雅、有吸引力的中文摘要（Summary）。要求：\n1. 字数控制在 60-120 字之间。\n2. 语气平和、知性、高级，符合个人博客的调性。\n3. 直接输出摘要内容，不要包含“好的”、“这是摘要”等任何开场白或结束语。";

    try {
      if (provider === 'gemini') {
        if (!env.VITE_GOOGLE_API_KEY) {
          throw new Error("请先在 .env 文件中配置 VITE_GOOGLE_API_KEY");
        }
        const response = await geminiClient.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents: content,
          config: {
            systemInstruction: systemInstruction,
            temperature: 1.3,
          },
        });

        for await (const chunk of response) {
          if (chunk.text) {
            onChunk(chunk.text);
          }
        }
      } else if (provider === 'deepseek') {
        if (!deepseekClient.apiKey) {
          throw new Error("请先在 .env 文件中配置 VITE_DEEPSEEK_API_KEY");
        }

        const stream = await deepseekClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: content }
          ],
          model: "deepseek-chat",
          stream: true,
          temperature: 1.3,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        }
      }
    } catch (error) {
      console.error(`${provider} API Error:`, error);
      throw error;
    }
  },

  /**
   * Generates tags for the article.
   * @param title Article Title
   * @param content Article Content
   * @param existingTags Current tags to avoid duplicates
   * @param provider AI Provider
   */
  generateTags: async (title: string, content: string, existingTags: string[], provider: AIProvider): Promise<string[]> => {
    const isAdding = existingTags.length > 0;
    const count = isAdding ? 1 : 2;

    // 严格的系统指令，要求只返回 JSON 数组
    const systemInstruction = `你是一个专业的博客标签生成器。
    请根据文章标题和内容，生成 ${count} 个最相关的技术或主题标签。
    ${isAdding ? `现有标签为：${JSON.stringify(existingTags)}，请不要重复。` : ''}
    标签应简洁精准（例如："React", "Web Design", "Life"）。
    必须只返回一个纯 JSON 字符串数组，例如：["Tag1", "Tag2"]。
    不要返回任何 markdown 格式（如 \`\`\`json），不要有任何解释文字。`;

    const userPrompt = `标题：${title}\n内容摘要：${content.substring(0, 500)}`;

    let responseText = '';

    try {
      if (provider === 'gemini') {
        const response = await geminiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userPrompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        responseText = response.text || '[]';
      } else {
        const response = await deepseekClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "deepseek-chat",
          temperature: 0.7,
        });
        responseText = response.choices[0]?.message?.content || '[]';
      }

      // 清理可能存在的 markdown 标记
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const tags = JSON.parse(responseText);
        if (Array.isArray(tags)) {
          return tags.map(t => String(t));
        }
      } catch (e) {
        console.error("Failed to parse AI tags response", responseText);
      }
      return [];

    } catch (e) {
      console.error("AI Tag Generation Failed", e);
      return [];
    }
  },

  /**
   * Recommend an icon from the list based on project info
   */
  recommendIcon: async (title: string, description: string, availableIcons: string[], provider: AIProvider): Promise<string | null> => {
    // 将数组转为字符串，方便 AI 读取
    const iconsString = availableIcons.join(',');

    const systemInstruction = `你是一个UI设计师。请从我提供的【图标列表】中，严格选择一个最能代表用户项目名称和描述的图标名称。

    【图标列表】：
    ${iconsString}
    
    重要规则：
    1. 你必须只输出列表中的某一个单词。
    2. 严禁编造列表中不存在的单词（例如：绝对不要输出 "Tool" 如果它不在列表中）。
    3. 严禁输出任何标点符号、Markdown标记或解释性文字。
    4. 如果没有完美匹配，请选择最接近的通用图标（如 Globe, Layout, Box, Star）。
    5. 直接输出单词本身。`;

    const userPrompt = `项目名称：${title}\n描述：${description}`;
    let result = '';

    try {
      if (provider === 'gemini') {
        const response = await geminiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userPrompt,
          config: { systemInstruction: systemInstruction, temperature: 0.1 }
        });
        result = response.text || '';
      } else {
        const response = await deepseekClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "deepseek-chat",
          temperature: 0.1,
        });
        result = response.choices[0]?.message?.content || '';
      }

      // 强力清洗：去除空格、换行、句号、引号、Markdown代码块
      const cleaned = result.trim()
        .replace(/['"`.]/g, '')
        .replace(/```/g, '')
        .replace(/\n/g, '')
        .split(' ')[0]; // 只取第一个词

      return cleaned;
    } catch (e) {
      console.error("Recommend Icon Failed", e);
      return null;
    }
  },

  /**
   * Generate an SVG icon
   */
  generateSVGIcon: async (title: string, description: string, provider: AIProvider): Promise<string> => {
    const systemInstruction = `你是一个 SVG 代码生成器。请根据项目描述，生成一个现代、简约、Outline 风格的 SVG 图标代码。
      
      技术约束：
      1. 必须包含 viewBox="0 0 24 24"。
      2. 必须设置 stroke="currentColor", fill="none", stroke-width="2", stroke-linecap="round", stroke-linejoin="round"。
      3. 仅返回 <svg>...</svg> 标签及其内容。
      4. 严禁包含 <?xml ...?> 声明或 <!DOCTYPE ...>。
      5. 严禁使用 markdown 代码块标记（如 \`\`\`xml 或 \`\`\`svg）。不要有任何文字解释。
      6. 确保代码是有效的 SVG，可以直接嵌入 HTML。`;

    const userPrompt = `项目名称：${title}\n描述：${description}\n设计要求：抽象、极简、高科技感。`;
    let result = '';

    try {
      if (provider === 'gemini') {
        const response = await geminiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userPrompt,
          config: { systemInstruction: systemInstruction, temperature: 0.7 }
        });
        result = response.text || '';
      } else {
        const response = await deepseekClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "deepseek-chat",
          temperature: 0.7,
        });
        result = response.choices[0]?.message?.content || '';
      }

      // Cleanup response
      let svg = result.trim();

      // 移除 markdown 代码块
      if (svg.includes('```')) {
        svg = svg.replace(/```(xml|svg)?/g, '').replace(/```/g, '');
      }

      // 移除可能的 XML 声明
      svg = svg.replace(/<\?xml.*?\?>/g, '');

      // 提取 <svg> 到 </svg> 之间的内容
      const svgStart = svg.indexOf('<svg');
      const svgEnd = svg.lastIndexOf('</svg>');

      if (svgStart !== -1 && svgEnd !== -1) {
        return svg.substring(svgStart, svgEnd + 6);
      }

      // 如果没有找到完整的 svg 标签，尝试返回清理后的字符串（如果它看起来像SVG）
      if (svg.includes('path') || svg.includes('circle') || svg.includes('rect')) {
        if (!svg.startsWith('<svg')) {
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
        }
      }

      return '';

    } catch (e) {
      console.error("Generate SVG Failed", e);
      return '';
    }
  }
};