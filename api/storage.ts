import { neon } from '@neondatabase/serverless';

const safeParseJSON = (jsonString: string | null) => {
    if (!jsonString) return [];
    try { return JSON.parse(jsonString); } catch (e) { return []; }
}

interface ApiRequest {
    method: string;
    headers: {
        cookie?: string;
    };
    body: {
        action: string;
        args: any[];
    };
}

const isAdmin = (req: ApiRequest) => {
    const cookie = req.headers?.cookie || '';
    return cookie.includes('admin_session=active');
};

interface ApiResponse {
    status: (code: number) => ApiResponse;
    json: (data: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) return res.status(500).json({ error: 'DATABASE_URL is not defined on server.' });

    const sql = neon(DATABASE_URL);
    const { action, args } = req.body;
    const isUserAdmin = isAdmin(req);

    try {
        let data;
        
        // Protect admin actions
        const adminActions = ['initDB', 'saveSystemSetting', 'saveArticle', 'deleteArticle', 'saveProject', 'deleteProject'];
        if (adminActions.includes(action) && !isUserAdmin) {
            return res.status(401).json({ error: 'Unauthorized: Admin access required.' });
        }

        switch (action) {
            case 'initDB':
                await sql`
                    CREATE TABLE IF NOT EXISTS articles (
                        id TEXT PRIMARY KEY, title TEXT, summary TEXT, content TEXT,
                        created_at TEXT, updated_at TEXT, is_published BOOLEAN, tags TEXT
                    );
                `;
                await sql`
                    CREATE TABLE IF NOT EXISTS projects (
                        id TEXT PRIMARY KEY, title TEXT, description TEXT, url TEXT,
                        icon_type TEXT, preset_icon TEXT, image_base64 TEXT, custom_svg TEXT
                    );
                `;
                await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`;
                await sql`
                    CREATE TABLE IF NOT EXISTS chat_sessions (
                        id TEXT PRIMARY KEY, title TEXT, system_prompt TEXT,
                        article_context_id TEXT, created_at TEXT, updated_at TEXT
                    );
                `;
                await sql`
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id TEXT PRIMARY KEY, session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
                        role TEXT, content TEXT, created_at TEXT
                    );
                `;
                await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);`;
                try { await sql`ALTER TABLE projects ADD COLUMN image_base64 TEXT`; } catch (e) {}
                try { await sql`ALTER TABLE projects ADD COLUMN custom_svg TEXT`; } catch (e) {}
                data = { success: true };
                break;
            case 'getSystemSetting':
                const [key, defaultVal] = args;
                const rowsSetting = await sql`SELECT value FROM settings WHERE key = ${key}`;
                data = rowsSetting.length > 0 ? rowsSetting[0].value : defaultVal;
                break;
            case 'saveSystemSetting':
                const [sKey, sValue] = args;
                await sql`
                    INSERT INTO settings (key, value) VALUES (${sKey}, ${sValue})
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                `;
                data = { success: true };
                break;
            case 'getArticles':
                const rowsArticles = await sql`SELECT * FROM articles ORDER BY created_at DESC`;
                data = rowsArticles.map((row: Record<string, unknown>) => ({
                    id: row.id, title: row.title, summary: row.summary, content: row.content,
                    createdAt: row.created_at, updatedAt: row.updated_at,
                    isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't',
                    tags: safeParseJSON(row.tags as string)
                }));
                break;
            case 'getPublishedArticlesLight':
                const rowsLight = await sql`SELECT id, title, summary, created_at, updated_at, tags FROM articles WHERE is_published = true ORDER BY created_at DESC`;
                data = rowsLight.map((row: Record<string, unknown>) => ({
                    id: row.id, title: row.title, summary: row.summary, content: '', // Light weight
                    createdAt: row.created_at, updatedAt: row.updated_at,
                    isPublished: true,
                    tags: safeParseJSON(row.tags as string)
                }));
                break;
            case 'getArticleById':
                const rowsArt = await sql`SELECT * FROM articles WHERE id = ${args[0]}`;
                if (rowsArt.length === 0) data = null;
                else {
                    const row = rowsArt[0];
                    data = {
                        id: row.id, title: row.title, summary: row.summary, content: row.content,
                        createdAt: row.created_at, updatedAt: row.updated_at,
                        isPublished: row.is_published === true || row.is_published === 'true' || row.is_published === 't',
                        tags: safeParseJSON(row.tags)
                    };
                }
                break;
            case 'saveArticle':
                const art = args[0];
                await sql`
                    INSERT INTO articles (id, title, summary, content, created_at, updated_at, is_published, tags)
                    VALUES (${art.id}, ${art.title}, ${art.summary}, ${art.content}, ${art.createdAt}, ${art.updatedAt}, ${art.isPublished}, ${JSON.stringify(art.tags)})
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title, summary = EXCLUDED.summary, content = EXCLUDED.content,
                        updated_at = EXCLUDED.updated_at, is_published = EXCLUDED.is_published, tags = EXCLUDED.tags;
                `;
                data = { success: true };
                break;
            case 'deleteArticle':
                await sql`DELETE FROM articles WHERE id = ${args[0]}`;
                data = { success: true };
                break;
            case 'getProjects':
                const rowsProj = await sql`SELECT * FROM projects ORDER BY id DESC`;
                data = rowsProj.map((row: Record<string, unknown>) => ({
                    id: row.id, title: row.title, description: row.description, url: row.url,
                    iconType: row.icon_type, presetIcon: row.preset_icon,
                    imageBase64: row.image_base64, customSvg: row.custom_svg
                }));
                break;
            case 'saveProject':
                const proj = args[0];
                await sql`
                    INSERT INTO projects (id, title, description, url, icon_type, preset_icon, image_base64, custom_svg)
                    VALUES (${proj.id}, ${proj.title}, ${proj.description}, ${proj.url}, ${proj.iconType}, ${proj.presetIcon}, ${proj.imageBase64 || null}, ${proj.customSvg || null})
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title, description = EXCLUDED.description, url = EXCLUDED.url,
                        icon_type = EXCLUDED.icon_type, preset_icon = EXCLUDED.preset_icon,
                        image_base64 = EXCLUDED.image_base64, custom_svg = EXCLUDED.custom_svg;
                `;
                data = { success: true };
                break;
            case 'deleteProject':
                await sql`DELETE FROM projects WHERE id = ${args[0]}`;
                data = { success: true };
                break;
            case 'getChatSessions':
                if (!isUserAdmin) { data = []; break; }
                const sessions = await sql`SELECT id, title, system_prompt, article_context_id, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC`;
                data = sessions.map((r: Record<string, unknown>) => ({
                    id: r.id, title: r.title, systemPrompt: r.system_prompt,
                    articleContextId: r.article_context_id, createdAt: r.created_at, updatedAt: r.updated_at
                }));
                break;
            case 'getChatMessages':
                if (!isUserAdmin) { data = []; break; }
                const msgs = await sql`SELECT * FROM chat_messages WHERE session_id = ${args[0]} ORDER BY created_at ASC`;
                data = msgs.map((r: Record<string, unknown>) => ({
                    id: r.id, sessionId: r.session_id, role: r.role, content: r.content, createdAt: r.created_at
                }));
                break;
            case 'saveChatSession':
                const [session, messages] = args;
                if (isUserAdmin) {
                    await sql`
                        INSERT INTO chat_sessions (id, title, system_prompt, article_context_id, created_at, updated_at)
                        VALUES (${session.id}, ${session.title}, ${session.systemPrompt || null}, ${session.articleContextId || null}, ${session.createdAt}, ${session.updatedAt})
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title, system_prompt = EXCLUDED.system_prompt, updated_at = EXCLUDED.updated_at
                    `;
                    const msgIds = messages.map((m: Record<string, unknown>) => m.id);
                    if (msgIds.length > 0) {
                        await sql`DELETE FROM chat_messages WHERE session_id = ${session.id} AND NOT (id = ANY(${msgIds}))`;
                    } else {
                        await sql`DELETE FROM chat_messages WHERE session_id = ${session.id}`;
                    }
                    for (const msg of messages) {
                        await sql`
                            INSERT INTO chat_messages (id, session_id, role, content, created_at)
                            VALUES (${msg.id}, ${session.id}, ${msg.role}, ${msg.content}, ${msg.createdAt})
                            ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
                        `;
                    }
                }
                data = { success: true };
                break;
            case 'deleteChatSession':
                if (isUserAdmin) {
                    await sql`DELETE FROM chat_sessions WHERE id = ${args[0]}`;
                }
                data = { success: true };
                break;
            default:
                return res.status(400).json({ error: `Unknown action ${action}` });
        }
        return res.json({ data });
    } catch (e: unknown) {
        console.error(`Storage API Error [${action}]:`, e);
        return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
}
