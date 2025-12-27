import { Article, Project } from '../types';
import { neon } from '@neondatabase/serverless';

// 从环境变量读取数据库连接字符串
// 请在 .env 文件中设置 VITE_DATABASE_URL
const DATABASE_URL = (import.meta as any).env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("VITE_DATABASE_URL is not defined in environment variables.");
}

// 初始化 Neon SQL 客户端 (HTTP 模式)
const sql = neon(DATABASE_URL || '');

const THEME_KEY = 'eray_theme';
const AI_PROVIDER_KEY = 'eray_ai_provider';

// 简单的内存缓存
let articlesCache: Article[] | null = null;
let projectsCache: Project[] | null = null;

// Helper to safely parse JSON
const safeParseJSON = (jsonString: string | null) => {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse error", e);
    return [];
  }
}

export const StorageService = {

  // --- Initialization ---
  // 尝试创建表结构（如果不存在）
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

      // 数据库迁移：尝试添加新列（如果不存在）
      try {
        await sql`ALTER TABLE projects ADD COLUMN image_base64 TEXT`;
      } catch (e) { /* ignore if exists */ }

      try {
        await sql`ALTER TABLE projects ADD COLUMN custom_svg TEXT`;
      } catch (e) { /* ignore if exists */ }

      //   console.log('Database tables verified.');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
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
        // 关键修复：确保 is_published 转换为布尔值，防止数据库驱动返回字符串导致的过滤失效
        isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't',
        tags: safeParseJSON(row.tags)
      })) as Article[];
      articlesCache = result;
      return result;
    } catch (e) {
      console.error("Error fetching articles:", e);
      return [];
    }
  },

  getArticleById: async (id: string): Promise<Article | null> => {
    if (!DATABASE_URL) return null;
    // Try cache first
    if (articlesCache) {
      const found = articlesCache.find(a => a.id === id);
      if (found) return found;
    }

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

  // --- Theme ---

  getTheme: (): 'light' | 'dark' => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
  },

  // --- AI Settings ---
  getAIProvider: (): 'deepseek' | 'gemini' => {
    const stored = localStorage.getItem(AI_PROVIDER_KEY);
    if (stored === 'gemini') return 'gemini';
    return 'deepseek'; // Default
  },

  saveAIProvider: (provider: 'deepseek' | 'gemini') => {
    localStorage.setItem(AI_PROVIDER_KEY, provider);
  }
};