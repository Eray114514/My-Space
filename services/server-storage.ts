import { neon } from '@neondatabase/serverless';
import { Article, Project } from '../types';

const safeParseJSON = (jsonString: string | null) => {
    if (!jsonString) return [];
    try { return JSON.parse(jsonString); } catch (e) { return []; }
}

const getSql = () => {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) throw new Error('DATABASE_URL is not defined on server.');
    return neon(DATABASE_URL);
};

export const ServerStorageService = {
    getProjects: async (): Promise<Project[]> => {
        const sql = getSql();
        const rowsProj = await sql`SELECT * FROM projects ORDER BY id DESC`;
        return rowsProj.map((row: Record<string, any>) => ({
            id: row.id, title: row.title, description: row.description, url: row.url,
            iconType: row.icon_type, presetIcon: row.preset_icon,
            imageBase64: row.image_base64, customSvg: row.custom_svg
        }));
    },
    getPublishedArticlesLight: async (): Promise<Article[]> => {
        const sql = getSql();
        const rowsLight = await sql`SELECT id, title, summary, created_at, updated_at, tags FROM articles WHERE is_published = true ORDER BY created_at DESC`;
        return rowsLight.map((row: Record<string, any>) => ({
            id: row.id, title: row.title, summary: row.summary, content: '', // Light weight
            createdAt: row.created_at, updatedAt: row.updated_at,
            isPublished: true,
            tags: safeParseJSON(row.tags as string)
        }));
    },
    getArticleById: async (id: string): Promise<Article | null> => {
        const sql = getSql();
        const rowsArt = await sql`SELECT * FROM articles WHERE id = ${id}`;
        if (rowsArt.length === 0) return null;
        const row = rowsArt[0];
        return {
            id: row.id, title: row.title, summary: row.summary, content: row.content,
            createdAt: row.created_at, updatedAt: row.updated_at,
            isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't',
            tags: safeParseJSON(row.tags)
        };
    }
};
