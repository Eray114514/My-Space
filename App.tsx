import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Blog } from './pages/Blog';
import { ArticleDetail } from './pages/ArticleDetail';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SearchPage } from './pages/Search';
import { Chat } from './pages/Chat';
import { StorageService } from './services/storage';

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
    </HashRouter>
  );
};

export default App;