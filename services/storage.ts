import { Article, Project } from '../types';
import { AIModelKey } from './ai';

const THEME_KEY = 'my_theme';

let articlesCache: Article[] | null = null;
let projectsCache: Project[] | null = null;
let settingsCache: Record<string, string> | null = null;

const rpc = async (action: string, args: any[] = []) => {
  const res = await fetch('/api/storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args })
  });
  if (!res.ok) throw new Error(`RPC Error: ${res.statusText}`);
  const { data, error } = await res.json();
  if (error) throw new Error(error);
  return data;
};

export interface ChatSession {
    id: string; title: string; systemPrompt?: string; articleContextId?: string; createdAt: string; updatedAt: string;
}
export interface ChatMessage {
    id: string; sessionId: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt: string;
}

export const StorageService = {
  initDB: () => rpc('initDB'),
  getSystemSetting: async (key: string, defaultValue: string): Promise<string> => {
    if (settingsCache && settingsCache[key]) return settingsCache[key];
    try {
      const val = await rpc('getSystemSetting', [key, defaultValue]);
      if (!settingsCache) settingsCache = {};
      settingsCache[key] = val;
      return val;
    } catch { return defaultValue; }
  },
  saveSystemSetting: async (key: string, value: string) => {
    await rpc('saveSystemSetting', [key, value]);
    if (!settingsCache) settingsCache = {};
    settingsCache[key] = value;
  },
  getGeneralAIModel: async (): Promise<AIModelKey> => await StorageService.getSystemSetting('general_ai_model', 'deepseek-chat') as AIModelKey,
  saveGeneralAIModel: (model: AIModelKey) => StorageService.saveSystemSetting('general_ai_model', model),
  getSvgAIModel: async (): Promise<AIModelKey> => await StorageService.getSystemSetting('svg_ai_model', 'deepseek-reasoner') as AIModelKey,
  saveSvgAIModel: (model: AIModelKey) => StorageService.saveSystemSetting('svg_ai_model', model),
  getArticles: async (forceRefresh = false): Promise<Article[]> => {
    if (articlesCache && !forceRefresh) return articlesCache;
    const data = await rpc('getArticles');
    articlesCache = data;
    return data;
  },
  getArticleById: async (id: string): Promise<Article | null> => {
    if (articlesCache) { const found = articlesCache.find(a => a.id === id); if (found) return found; }
    return await rpc('getArticleById', [id]);
  },
  saveArticle: async (article: Article) => {
    await rpc('saveArticle', [article]);
    articlesCache = null;
  },
  deleteArticle: async (id: string) => {
    await rpc('deleteArticle', [id]);
    articlesCache = null;
  },
  getProjects: async (forceRefresh = false): Promise<Project[]> => {
    if (projectsCache && !forceRefresh) return projectsCache;
    const data = await rpc('getProjects');
    projectsCache = data;
    return data;
  },
  saveProject: async (project: Project) => {
    await rpc('saveProject', [project]);
    projectsCache = null;
  },
  deleteProject: async (id: string) => {
    await rpc('deleteProject', [id]);
    projectsCache = null;
  },
  getChatSessions: async (isAdmin: boolean): Promise<ChatSession[]> => {
    if (isAdmin) return rpc('getChatSessions', [isAdmin]);
    const localData = localStorage.getItem('guest_chat_sessions');
    return localData ? JSON.parse(localData) : [];
  },
  getChatMessages: async (sessionId: string, isAdmin: boolean): Promise<ChatMessage[]> => {
    if (isAdmin) return rpc('getChatMessages', [sessionId, isAdmin]);
    const localData = localStorage.getItem(`guest_chat_messages_${sessionId}`);
    return localData ? JSON.parse(localData) : [];
  },
  saveChatSession: async (session: ChatSession, messages: ChatMessage[], isAdmin: boolean) => {
    if (isAdmin) return rpc('saveChatSession', [session, messages, isAdmin]);
    const sessions = await StorageService.getChatSessions(false);
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) sessions[existingIndex] = session;
    else sessions.unshift(session);
    localStorage.setItem('guest_chat_sessions', JSON.stringify(sessions));
    localStorage.setItem(`guest_chat_messages_${session.id}`, JSON.stringify(messages));
  },
  deleteChatSession: async (sessionId: string, isAdmin: boolean) => {
    if (isAdmin) return rpc('deleteChatSession', [sessionId, isAdmin]);
    const sessions = await StorageService.getChatSessions(false);
    const newSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem('guest_chat_sessions', JSON.stringify(newSessions));
    localStorage.removeItem(`guest_chat_messages_${sessionId}`);
  },
  getTheme: (): 'light' | 'dark' => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem(THEME_KEY, theme)
};
