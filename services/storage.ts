import { Article, Project } from '../types';
import { neon } from '@neondatabase/serverless';
import { AIModelKey, AI_MODELS } from './ai';

const DATABASE_URL = (import.meta as any).env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not defined in environment variables.");
}

const sql = neon(DATABASE_URL || '');

// Refactored keys for brand agnosticism
const THEME_KEY = 'my_theme'; 

// Database Setting Keys
const SETTING_GENERAL_AI = 'general_ai_model';
const SETTING_SVG_AI = 'svg_ai_model';

let articlesCache: Article[] | null = null;
let projectsCache: Project[] | null = null;
// Simple cache for settings to avoid db hits on every render
let settingsCache: Record<string, string> | null = null;

const safeParseJSON = (jsonString: string | null) => {
    if (!jsonString) return [];
    try { return JSON.parse(jsonString); } catch (e) { console.error("JSON Parse error", e); return []; }
}

export interface ChatSession {
    id: string;
    title: string;
    systemPrompt?: string;
    articleContextId?: string; // Optional: Linked article ID
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
}

export const StorageService = {
  
  initDB: async () => {
    if (!DATABASE_URL) return;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          title TEXT,
          summary TEXT,
          content TEXT,
          created_at TEXT,
          updated_at TEXT,
          is_published BOOLEAN,
          tags TEXT
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          title TEXT,
          description TEXT,
          url TEXT,
          icon_type TEXT,
          preset_icon TEXT
        );
      `;
      // New Table for cross-device settings
      await sql`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `;
      
      // --- Chat Tables ---
      await sql`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          system_prompt TEXT,
          article_context_id TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
          role TEXT,
          content TEXT,
          created_at TEXT
        );
      `;

      try { await sql`ALTER TABLE projects ADD COLUMN image_base64 TEXT`; } catch (e) {}
      try { await sql`ALTER TABLE projects ADD COLUMN custom_svg TEXT`; } catch (e) {}
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  },

  // --- Settings (Cross-Device) ---
  
  getSystemSetting: async (key: string, defaultValue: string): Promise<string> => {
      if (!DATABASE_URL) return defaultValue;
      if (settingsCache && settingsCache[key]) return settingsCache[key];

      try {
          const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
          if (rows.length > 0) {
              if (!settingsCache) settingsCache = {};
              settingsCache[key] = rows[0].value;
              return rows[0].value;
          }
          return defaultValue;
      } catch (e) {
          console.error(`Error fetching setting ${key}`, e);
          return defaultValue;
      }
  },

  saveSystemSetting: async (key: string, value: string): Promise<void> => {
      if (!DATABASE_URL) return;
      try {
          await sql`
            INSERT INTO settings (key, value) VALUES (${key}, ${value})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
          `;
          if (!settingsCache) settingsCache = {};
          settingsCache[key] = value;
      } catch (e) {
          console.error(`Error saving setting ${key}`, e);
      }
  },

  // Specific helpers for AI config
  getGeneralAIModel: async (): Promise<AIModelKey> => {
      const val = await StorageService.getSystemSetting(SETTING_GENERAL_AI, 'deepseek-chat');
      // Validate existence
      if (val in AI_MODELS) return val as AIModelKey;
      return 'deepseek-chat';
  },

  saveGeneralAIModel: async (model: AIModelKey) => {
      await StorageService.saveSystemSetting(SETTING_GENERAL_AI, model);
  },

  getSvgAIModel: async (): Promise<AIModelKey> => {
      const val = await StorageService.getSystemSetting(SETTING_SVG_AI, 'deepseek-reasoner');
      if (val in AI_MODELS) return val as AIModelKey;
      return 'deepseek-reasoner'; // Reasoners are better for SVG code
  },

  saveSvgAIModel: async (model: AIModelKey) => {
      await StorageService.saveSystemSetting(SETTING_SVG_AI, model);
  },


  // --- Articles ---

  getArticles: async (forceRefresh = false): Promise<Article[]> => {
    if (!DATABASE_URL) return [];
    if (articlesCache && !forceRefresh) return articlesCache;
    try {
      const rows = await sql`SELECT * FROM articles ORDER BY created_at DESC`;
      const result = rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        content: row.content,
        createdAt: row.created_at, 
        updatedAt: row.updated_at, 
        isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't', 
        tags: safeParseJSON(row.tags)
      })) as Article[];
      articlesCache = result;
      return result;
    } catch (e) { console.error("Error fetching articles:", e); return []; }
  },

  getArticleById: async (id: string): Promise<Article | null> => {
    if (!DATABASE_URL) return null;
    if (articlesCache) { const found = articlesCache.find(a => a.id === id); if (found) return found; }
    try {
        const rows = await sql`SELECT * FROM articles WHERE id = ${id}`;
        if (rows.length === 0) return null;
        const row = rows[0];
        return {
            id: row.id,
            title: row.title,
            summary: row.summary,
            content: row.content,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't',
            tags: safeParseJSON(row.tags)
        } as Article;
    } catch (e) {
        console.error("Error fetching article:", e);
        return null;
    }
  },

  saveArticle: async (article: Article): Promise<void> => {
    if (!DATABASE_URL) return;
    const tagsJson = JSON.stringify(article.tags);
    const isPublishedBool = article.isPublished === true;
    
    await sql`
      INSERT INTO articles (id, title, summary, content, created_at, updated_at, is_published, tags)
      VALUES (${article.id}, ${article.title}, ${article.summary}, ${article.content}, ${article.createdAt}, ${article.updatedAt}, ${isPublishedBool}, ${tagsJson})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at,
        is_published = EXCLUDED.is_published,
        tags = EXCLUDED.tags;
    `;
    articlesCache = null; // Invalidate cache
  },

  deleteArticle: async (id: string): Promise<void> => {
    if (!DATABASE_URL) return;
    await sql`DELETE FROM articles WHERE id = ${id}`;
    articlesCache = null; // Invalidate cache
  },

  // --- Projects ---

  getProjects: async (forceRefresh = false): Promise<Project[]> => {
    if (!DATABASE_URL) return [];
    if (projectsCache && !forceRefresh) return projectsCache;

    try {
      const rows = await sql`SELECT * FROM projects ORDER BY id DESC`; 
      const result = rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          url: row.url,
          iconType: row.icon_type, 
          presetIcon: row.preset_icon,
          imageBase64: row.image_base64, 
          customSvg: row.custom_svg
      })) as Project[];
      projectsCache = result;
      return result;
    } catch (e) {
      console.error("Error fetching projects:", e);
      return [];
    }
  },

  saveProject: async (project: Project): Promise<void> => {
    if (!DATABASE_URL) return;
    await sql`
      INSERT INTO projects (id, title, description, url, icon_type, preset_icon, image_base64, custom_svg)
      VALUES (${project.id}, ${project.title}, ${project.description}, ${project.url}, ${project.iconType}, ${project.presetIcon}, ${project.imageBase64 || null}, ${project.customSvg || null})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        icon_type = EXCLUDED.icon_type,
        preset_icon = EXCLUDED.preset_icon,
        image_base64 = EXCLUDED.image_base64,
        custom_svg = EXCLUDED.custom_svg;
    `;
    projectsCache = null; // Invalidate cache
  },

  deleteProject: async (id: string): Promise<void> => {
    if (!DATABASE_URL) return;
    await sql`DELETE FROM projects WHERE id = ${id}`;
    projectsCache = null; // Invalidate cache
  },

  // --- Chat History Management (Unified API) ---

  getChatSessions: async (isAdmin: boolean): Promise<ChatSession[]> => {
      if (isAdmin && DATABASE_URL) {
          try {
              const rows = await sql`SELECT id, title, system_prompt, article_context_id, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC`;
              return rows.map(r => ({
                  id: r.id,
                  title: r.title,
                  systemPrompt: r.system_prompt,
                  articleContextId: r.article_context_id,
                  createdAt: r.created_at,
                  updatedAt: r.updated_at
              }));
          } catch (e) { console.error("DB Chat Session Error", e); return []; }
      } else {
          // Local Storage
          const localData = localStorage.getItem('guest_chat_sessions');
          return localData ? JSON.parse(localData) : [];
      }
  },

  getChatMessages: async (sessionId: string, isAdmin: boolean): Promise<ChatMessage[]> => {
      if (isAdmin && DATABASE_URL) {
          try {
              const rows = await sql`SELECT * FROM chat_messages WHERE session_id = ${sessionId} ORDER BY created_at ASC`;
              return rows.map(r => ({
                  id: r.id,
                  sessionId: r.session_id,
                  role: r.role,
                  content: r.content,
                  createdAt: r.created_at
              }));
          } catch (e) { return []; }
      } else {
          const localData = localStorage.getItem(`guest_chat_messages_${sessionId}`);
          return localData ? JSON.parse(localData) : [];
      }
  },

  saveChatSession: async (session: ChatSession, messages: ChatMessage[], isAdmin: boolean): Promise<void> => {
      if (isAdmin && DATABASE_URL) {
          try {
              // Upsert Session
              await sql`
                INSERT INTO chat_sessions (id, title, system_prompt, article_context_id, created_at, updated_at)
                VALUES (${session.id}, ${session.title}, ${session.systemPrompt || null}, ${session.articleContextId || null}, ${session.createdAt}, ${session.updatedAt})
                ON CONFLICT (id) DO UPDATE SET
                  title = EXCLUDED.title,
                  system_prompt = EXCLUDED.system_prompt,
                  updated_at = EXCLUDED.updated_at
              `;
              
              // Upsert Messages (Naive implementation: Delete all and re-insert is safer for sync if modifying history often, but expensive. 
              // Better: Upsert each. For "rollback" (truncation), we need to explicitely delete.)
              
              // 1. Delete messages in DB that are NOT in the current messages array (handling rollbacks)
              const msgIds = messages.map(m => m.id);
              if (msgIds.length > 0) {
                 // Postgres requires special handling for array inclusion in some drivers, looping is safer for small counts
                 // Fixed: Used ANY operator for array parameter instead of invalid template tag usage
                 await sql`DELETE FROM chat_messages WHERE session_id = ${session.id} AND NOT (id = ANY(${msgIds}))`;
              } else {
                 await sql`DELETE FROM chat_messages WHERE session_id = ${session.id}`;
              }

              // 2. Upsert current messages
              for (const msg of messages) {
                  await sql`
                    INSERT INTO chat_messages (id, session_id, role, content, created_at)
                    VALUES (${msg.id}, ${session.id}, ${msg.role}, ${msg.content}, ${msg.createdAt})
                    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
                  `;
              }
          } catch (e) { console.error("Save chat db error", e); }
      } else {
          // Local Storage logic
          const sessions = await StorageService.getChatSessions(false);
          const existingIndex = sessions.findIndex(s => s.id === session.id);
          if (existingIndex >= 0) {
              sessions[existingIndex] = session;
          } else {
              sessions.unshift(session);
          }
          localStorage.setItem('guest_chat_sessions', JSON.stringify(sessions));
          localStorage.setItem(`guest_chat_messages_${session.id}`, JSON.stringify(messages));
      }
  },

  deleteChatSession: async (sessionId: string, isAdmin: boolean): Promise<void> => {
      if (isAdmin && DATABASE_URL) {
          await sql`DELETE FROM chat_sessions WHERE id = ${sessionId}`;
      } else {
          const sessions = await StorageService.getChatSessions(false);
          const newSessions = sessions.filter(s => s.id !== sessionId);
          localStorage.setItem('guest_chat_sessions', JSON.stringify(newSessions));
          localStorage.removeItem(`guest_chat_messages_${sessionId}`);
      }
  },

  // --- Theme (Local is fine for theme to avoid FOUC, but kept strict to requirements) ---

  getTheme: (): 'light' | 'dark' => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
  }
};