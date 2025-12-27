import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Blog } from './pages/Blog';
import { ArticleDetail } from './pages/ArticleDetail';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // 关键修复：直接在初始化时读取 Storage，防止 useEffect 异步覆盖导致每次刷新重置为浅色
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return StorageService.getTheme() === 'dark';
  });

  useEffect(() => {
    // Check local storage for auth session (simple simulation)
    const session = sessionStorage.getItem('eray_session');
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
    sessionStorage.setItem('eray_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('eray_session');
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
          <Route path="login" element={isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />} />
          <Route path="admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;