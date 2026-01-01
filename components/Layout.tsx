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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
    { name: 'AI', path: '/chat', icon: MessageSquare },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''} relative overflow-x-hidden`}>
      
      {/* 
        --- Liquid Ambient Background --- 
        This is the soul of the "Liquid Glass" effect.
      */}
      <div className="fixed inset-0 -z-10 bg-[#f3f4f6] dark:bg-[#050505] transition-colors duration-700">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[96px] opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[96px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[96px] opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[96px] opacity-70 animate-blob animation-delay-2000" />
      </div>

      {/* 
        --- Floating Glass Navigation Island ---
        Replaces full-width header with a detached, floating capsule
      */}
      <div className="fixed top-0 w-full z-50 flex justify-center pt-4 sm:pt-6 px-4 pointer-events-none">
        <header className="pointer-events-auto liquid-glass rounded-full px-2 pr-3 py-2 flex items-center gap-1 sm:gap-4 transition-all duration-300 hover:shadow-lg hover:bg-white/50 dark:hover:bg-black/50 max-w-full sm:max-w-2xl">
          
          {/* Logo / Brand Pill */}
          <div 
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 cursor-pointer rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-inner text-sm font-bold">
              {logoLetter}
            </div>
            <span className="font-semibold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 hidden sm:inline-block">
              {adminName}
            </span>
          </div>

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center p-1 bg-gray-100/50 dark:bg-white/5 rounded-full border border-white/20 dark:border-white/5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    isActive 
                      ? 'text-indigo-600 dark:text-white bg-white dark:bg-neutral-800 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          <div className="w-px h-6 bg-gray-300/50 dark:bg-white/10 hidden md:block"></div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
             <button
              onClick={() => navigate('/search')}
              className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white transition-all"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
               <button onClick={onLogout} className="ml-1 p-2.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Logout">
                 <LogOut size={18} />
               </button>
            ) : (
               <button onClick={() => navigate('/login')} className="ml-1 p-2.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                 <Lock size={18} />
               </button>
            )}
            
            <button
              className="md:hidden p-2.5 text-gray-600 dark:text-gray-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Menu Glass Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-28 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <nav className="relative liquid-glass-high rounded-3xl p-4 flex flex-col gap-2 shadow-2xl ring-1 ring-white/20">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                      : 'hover:bg-white/40 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`
                }
              >
                <link.icon size={20} />
                <span className="font-medium text-lg">{link.name}</span>
              </NavLink>
            ))}
             {isAuthenticated && (
               <NavLink
               to="/admin"
               className={({ isActive }) =>
                 `flex items-center gap-4 p-4 rounded-2xl transition-all ${
                   isActive 
                     ? 'bg-indigo-500 text-white' 
                     : 'hover:bg-white/40 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                 }`
               }
             >
               <Lock size={20} />
               <span className="font-medium text-lg">后台管理</span>
             </NavLink>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-12 px-4 sm:px-6 w-full max-w-5xl mx-auto relative z-0">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-sm text-gray-400 dark:text-gray-600 font-medium">
        <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}. Designed with Liquid Glass.</p>
      </footer>
    </div>
  );
};