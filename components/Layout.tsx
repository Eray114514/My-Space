import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText } from 'lucide-react';
import { StorageService } from '../services/storage';

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
  ];

  const adminLinks = [
    { name: '管理后台', path: '/admin' },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">E</div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Eray
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <LogOut size={14} />
                退出
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-neutral-950 pt-20 px-6 md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col gap-6 text-lg">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
                 `flex items-center gap-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${
                   isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
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
        <p>&copy; {new Date().getFullYear()} Eray. Built with simplicity.</p>
      </footer>
    </div>
  );
};