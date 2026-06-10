"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Check } from 'lucide-react';
import { LiquidGlass } from '../../components/LiquidGlass';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Get credentials from environment variables
  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'Eray'; // Fallback to Eray if not set

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('my_session', 'active');
        } else {
          sessionStorage.setItem('my_session', 'active');
        }
        router.push('/admin');
      } else {
        setError(data.error || '用户名或密码错误');
      }
    } catch (err) {
      setError('登录请求失败，请稍后重试');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
      <LiquidGlass variant="panel" className="glass-panel w-full max-w-sm p-8">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-sm">
            <Lock size={24} />
          </div>
        </div>
        
        <h2 className="text-2xl font-black tracking-[-0.04em] text-center text-[var(--blog-fg)] mb-2">管理员登录</h2>
        <p className="text-center text-[var(--blog-muted)] mb-8 text-sm">请输入凭证以访问后台</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--blog-muted)] mb-1">用户名</label>
            <input
              type="text"
              className="blog-input w-full px-4 py-2.5 rounded-xl"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--blog-muted)] mb-1">密码</label>
            <input
              type="password"
              className="blog-input w-full px-4 py-2.5 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[var(--blog-fg)] border-[var(--blog-fg)]' : 'bg-[var(--blog-fg-soft)] border-[var(--blog-line)] group-hover:border-[var(--blog-fg)]'}`}>
                {rememberMe && <Check size={10} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-[var(--blog-muted)] select-none">记住我</span>
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50/80 dark:bg-red-900/20 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="blog-button-primary w-full py-2.5 text-sm group"
          >
            登录
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </LiquidGlass>
    </div>
  );
}
