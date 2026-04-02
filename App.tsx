import React, { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { StorageService } from './services/storage';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail').then(m => ({ default: m.ArticleDetail })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SearchPage = lazy(() => import('./pages/Search').then(m => ({ default: m.SearchPage })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // 关键修复：直接在初始化时读取 Storage，防止 useEffect 异步覆盖导致每次刷新重置为浅色
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return StorageService.getTheme() === 'dark';
  });

  useEffect(() => {
    // Check both session (tab only) and local (remember me) storage
    // Updated key to 'my_session'
    const session = sessionStorage.getItem('my_session') || localStorage.getItem('my_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogin = () => {
    // Storage logic is now handled in Login.tsx based on "Remember Me" selection
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('my_session');
    localStorage.removeItem('my_session');
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <HashRouter>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#050505]">
          <div className="text-gray-400 dark:text-gray-500 font-light tracking-widest animate-pulse text-sm">
            正在加载 / LOADING...
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={
            <Layout 
              isAuthenticated={isAuthenticated} 
              onLogout={handleLogout} 
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          }>
            <Route index element={<Home />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:id" element={<ArticleDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="login" element={isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />} />
            <Route path="admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster 
        toastOptions={{
          className: 'dark:bg-[#1a1a1a] dark:text-gray-100 dark:border dark:border-white/10 shadow-lg',
        }}
      />
    </HashRouter>
  );
};

export default App;