export const AI_MODELS = {
  'deepseek-chat': { provider: 'deepseek', modelId: 'deepseek-chat', name: 'DeepSeek 默认', shortName: '默认', description: 'V3 模型，速度快，性价比高。', isFree: false },
  'deepseek-reasoner': { provider: 'deepseek', modelId: 'deepseek-reasoner', name: 'DeepSeek 思考', shortName: '思考', description: 'R1 推理模型，擅长复杂逻辑和代码。', isFree: false },
  'gemini-flash': { provider: 'gemini', modelId: 'gemini-3-flash-preview', name: 'Gemini Flash', shortName: 'Flash', description: 'Google 最新模型，响应极快。', isFree: true },
  'openrouter-r1': { provider: 'openrouter', modelId: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 (Free)', shortName: 'R1 Free', description: 'OpenRouter 免费版 R1。', isFree: true },
  'openrouter-v3': { provider: 'openrouter', modelId: 'nex-agi/deepseek-v3.1-nex-n1:free', name: 'DeepSeek V3.1 (Free)', shortName: 'V3.1 Free', description: 'OpenRouter 免费版 V3.1。', isFree: true }
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

export const AIService = {
  generateSummaryStream: async (content: string, modelKey: AIModelKey, onChunk: (text: string) => void) => {
    const res = await fetch('/api/ai-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateSummaryStream', args: [content, modelKey] })
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  },
  generateTags: async (title: string, content: string, existingTags: string[], modelKey: AIModelKey): Promise<string[]> => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateTags', args: [title, content, existingTags, modelKey] })
    });
    const { data, error } = await res.json();
    if (error) throw new Error(error);
    return data;
  },
  recommendIcon: async (title: string, description: string, availableIcons: string[], modelKey: AIModelKey): Promise<string | null> => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recommendIcon', args: [title, description, availableIcons, modelKey] })
    });
    const { data, error } = await res.json();
    if (error) throw new Error(error);
    return data;
  },
  generateSVGIcon: async (title: string, description: string, modelKey: AIModelKey): Promise<string> => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateSVGIcon', args: [title, description, modelKey] })
    });
    const { data, error } = await res.json();
    if (error) throw new Error(error);
    return data;
  },
  chatStream: async (messages: { role: string; content: string }[], modelKey: AIModelKey, onChunk: (text: string) => void) => {
    const res = await fetch('/api/ai-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chatStream', args: [messages, modelKey] })
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  }
};
