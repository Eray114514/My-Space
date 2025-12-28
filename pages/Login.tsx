import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Check } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get credentials from environment variables
  const env = (import.meta as any).env;
  const ADMIN_USERNAME = env.ADMIN_USERNAME || 'Eray'; // Fallback to Eray if not set
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check: ensure env vars are actually set
    if (!ADMIN_PASSWORD) {
      setError('系统配置错误：未在 .env 中设置管理员密码');
      return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      if (rememberMe) {
        localStorage.setItem('my_session', 'active');
      } else {
        sessionStorage.setItem('my_session', 'active');
      }
      onLogin();
      navigate('/admin');
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
            <Lock size={24} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">管理员登录</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">请输入凭证以访问后台</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户名</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 group-hover:border-indigo-400'}`}>
                {rememberMe && <Check size={10} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 select-none">记住我</span>
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group"
          >
            登录
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};