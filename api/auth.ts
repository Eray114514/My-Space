interface ApiRequest {
    method: string;
    body: any;
}

interface ApiResponse {
    status: (code: number) => ApiResponse;
    json: (data: unknown) => void;
    setHeader: (name: string, value: string | string[]) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    if (req.method === 'DELETE') {
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        res.setHeader('Set-Cookie', `admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`);
        return res.status(200).json({ success: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'Eray';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: '系统配置错误：未在 .env 中设置管理员密码' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Set HttpOnly cookie
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const cookieStr = `admin_session=active; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${secure}`;

        res.setHeader('Set-Cookie', cookieStr);
        return res.status(200).json({ success: true });
    }

    return res.status(401).json({ error: '用户名或密码错误' });
}
