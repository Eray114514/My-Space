import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText, Search, MessageSquare } from 'lucide-react';

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<Props> = ({ isAuthenticated, onLogout, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get dynamic branding from env
  const env = (import.meta as any).env;
  const adminName = env.ADMIN_USERNAME || 'Eray';
  const logoLetter = adminName.charAt(0).toUpperCase();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
    { name: 'AI 聊天', path: '/chat', icon: MessageSquare },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''} relative selection:bg-indigo-500/30`}>
      
      {/* --- Global Ambient Background (The foundation for glassmorphism) --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-50 dark:bg-neutral-950 transition-colors duration-500">
        {/* Blob 1: Top Left - Indigo/Purple */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px] animate-pulse-slow" />
        
        {/* Blob 2: Bottom Right - Blue/Cyan */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000" />
        
        {/* Blob 3: Center Right - Pink/Purple Accent */}
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[100px] animate-pulse-slow delay-2000" />
      </div>

      {/* Header - Increased transparency for glass effect */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/40 dark:bg-black/30 backdrop-blur-xl border-b border-white/20 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-indigo-600/90 backdrop-blur-md rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">{logoLetter}</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              {adminName}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-all duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 relative py-1 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
            
            {isAuthenticated && (
               <NavLink
               to="/admin"
               className={({ isActive }) =>
                 `text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                   isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                 }`
               }
             >
               管理后台
             </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
             {/* Search Button */}
             <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors backdrop-blur-sm"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors backdrop-blur-sm"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-full transition-colors backdrop-blur-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              >
                <LogOut size={14} />
                退出
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors backdrop-blur-sm"
                aria-label="Admin Login"
              >
                <Lock size={16} />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay with Blur */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-xl pt-20 px-6 md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col gap-6 text-lg">
             <NavLink
                to="/search"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 border-b border-gray-200/50 dark:border-white/10 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'
                  }`
                }
              >
                <Search size={20} />
                搜索
              </NavLink>

            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 border-b border-gray-200/50 dark:border-white/10 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'
                  }`
                }
              >
                <link.icon size={20} />
                {link.name}
              </NavLink>
            ))}
            {isAuthenticated && (
               <NavLink
               to="/admin"
               className={({ isActive }) =>
                 `flex items-center gap-3 py-3 border-b border-gray-200/50 dark:border-white/10 ${
                   isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'
                 }`
               }
             >
               <Lock size={20} />
               管理后台
             </NavLink>
            )}
            <div className="flex items-center justify-between mt-4">
               <span className="text-gray-500">外观模式</span>
               <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm"
              >
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 w-full max-w-5xl mx-auto relative z-0">
        <Outlet />
      </main>

      <footer className="py-8 border-t border-gray-200/50 dark:border-white/5 text-center text-sm text-gray-500 dark:text-neutral-500 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} {adminName}. Built with simplicity.</p>
      </footer>
    </div>
  );
};