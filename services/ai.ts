export interface AIModelConfig {
  provider: string;
  modelId: string;
  name: string;
  shortName: string;
  description: string;
  isFree: boolean;
  supportsThinking?: boolean;
}

export interface StoredModel extends AIModelConfig {
  key: string;
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  'deepseek-chat': 'DeepSeek V3',
  'deepseek-reasoner': 'DeepSeek R1',
  'deepseek-coder': 'DeepSeek Coder',
  'deepseek-v4-flash': 'DeepSeek V4 Flash',
  'deepseek-v4-pro': 'DeepSeek V4 Pro',
  'deepseek-v4': 'DeepSeek V4',
};

export function getModelDisplayName(model: { modelId: string; name?: string }): string {
  const id = model.modelId;
  if (model.name && model.name !== id) return model.name;
  if (DISPLAY_NAME_MAP[id]) return DISPLAY_NAME_MAP[id];
  return id
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeModelDisplay(model: StoredModel): StoredModel {
  const id = model.modelId;
  const optimizedName = getModelDisplayName(model);
  const rawIdPart = id.split('/').pop() || id;
  let shortName = model.shortName;
  if (!shortName || shortName === id || shortName === rawIdPart || shortName === id.split(':').pop()) {
    shortName = optimizedName.length > 16 ? rawIdPart.slice(0, 16) : optimizedName;
  }
  return { ...model, name: optimizedName, shortName };
}

export interface AIProviderConfig {
  id: string;
  name: string;
  baseUrl?: string;
  apiKeyEnv: string;
  enabled: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', apiKeyEnv: 'DEEPSEEK_API_KEY', enabled: true },
  { id: 'openrouter', name: 'OpenRouter', apiKeyEnv: 'OPENROUTER_API_KEY', enabled: true }
];

// No hardcoded models - all models come from user's stored models in localStorage
export const AI_MODELS: Record<string, AIModelConfig> = {};

export type AIModelKey = string;

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
  generateTags: async (title: string, content: string, existingTags: string[], allTags: string[], modelKey: AIModelKey): Promise<string[]> => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generateTags', args: [title, content, existingTags, allTags, modelKey] })
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
  chatStream: async (messages: { role: string; content: string }[], modelKey: AIModelKey, onChunk: (text: string, reasoning?: string) => void) => {
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
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            onChunk(parsed.content || '', parsed.reasoning || '');
          } catch {
            onChunk(line.slice(6));
          }
        }
      }
    }
  }
};
