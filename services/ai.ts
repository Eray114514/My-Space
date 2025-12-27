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
  }
};