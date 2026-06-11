export const config = {
    runtime: 'edge'
};

const isKeyValid = (key: string | undefined): boolean => {
    return !!key && key.trim() !== '' && key.trim().toLowerCase() !== 'none';
};

export default async function handler(req: Request) {
    if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');

    if (!provider) return new Response(JSON.stringify({ error: 'Missing provider param' }), { status: 400 });

    try {
        if (provider === 'deepseek') {
            const key = process.env.DEEPSEEK_API_KEY;
            if (!isKeyValid(key)) {
                return new Response(JSON.stringify({ error: 'DeepSeek API Key not configured' }), { status: 400 });
            }
            const res = await fetch('https://api.deepseek.com/models', {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (!res.ok) {
                return new Response(JSON.stringify({ error: `DeepSeek API error: ${res.status}` }), { status: 500 });
            }
            const data = await res.json();
            const models = (data.data || []).map((m: any) => ({
                id: m.id,
                owned_by: m.owned_by || 'deepseek'
            }));
            return new Response(JSON.stringify({ models }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (provider === 'openrouter') {
            const key = process.env.OPENROUTER_API_KEY;
            if (!isKeyValid(key)) {
                return new Response(JSON.stringify({ error: 'OpenRouter API Key not configured' }), { status: 400 });
            }
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (!res.ok) {
                return new Response(JSON.stringify({ error: `OpenRouter API error: ${res.status}` }), { status: 500 });
            }
            const data = await res.json();
            const models = (data.data || []).map((m: any) => ({
                id: m.id,
                name: m.name || m.id,
                context_length: m.context_length,
                pricing: m.pricing,
                description: m.description || ''
            }));
            return new Response(JSON.stringify({ models }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), { status: 400 });
        }
    } catch (e: unknown) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
    }
}
