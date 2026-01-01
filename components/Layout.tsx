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
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* 
        Apple Aesthetic Header:
        - High blur (backdrop-blur-xl)
        - Slightly more transparency (bg/70)
        - Subtle border (white/20 or black/5)
      */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-neutral-800/50 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">{logoLetter}</div>
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
                  `text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {isAuthenticated && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <LogOut size={14} />
                退出
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
        <div className="fixed inset-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl pt-20 px-6 md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col gap-6 text-lg">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center gap-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
                  `flex items-center gap-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
                  `flex items-center gap-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
                className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800"
              >
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 w-full max-w-5xl mx-auto">
        <Outlet />
      </main>

      <footer className="py-8 border-t border-gray-200 dark:border-neutral-800 text-center text-sm text-gray-500 dark:text-neutral-500">
        <p>&copy; {new Date().getFullYear()} {adminName}. Built with simplicity.</p>
      </footer>
    </div>
  );
};