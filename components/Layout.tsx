import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText, Search, MessageSquare, Settings } from 'lucide-react';

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<Props> = ({ isAuthenticated, onLogout, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Get dynamic branding from env
  const env = (import.meta as any).env;
  const adminName = env.ADMIN_USERNAME || 'Eray';
  const logoLetter = adminName.charAt(0).toUpperCase();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Scroll handler for auto-hiding navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top
      if (currentScrollY < 20) {
        setIsNavVisible(true);
      } else {
        // Hide on scroll down, show on scroll up
        if (currentScrollY > lastScrollY.current) {
          setIsNavVisible(false);
        } else {
          setIsNavVisible(true);
        }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const baseLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
    { name: 'AI', path: '/chat', icon: MessageSquare },
  ];

  const navLinks = isAuthenticated 
    ? [...baseLinks, { name: '控制台', path: '/admin', icon: Settings }] 
    : baseLinks;

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''} relative overflow-x-hidden selection:bg-indigo-500/30`}>
      
      {/* 
        --- Static Liquid Ambient Background (Performance Optimized) --- 
        No animations. Pure CSS gradients with blur.
        This provides the "look" of liquid glass without the GPU cost of moving blobs.
      */}
      <div className="fixed inset-0 -z-10 bg-[#f8f9fa] dark:bg-[#050505] transition-colors duration-700">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {/* Top Left - Purple/Indigo */}
           <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-indigo-300/30 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]" />
           
           {/* Bottom Right - Pink/Blue */}
           <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-pink-300/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]" />
           
           {/* Center Accent */}
           <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-blue-200/30 dark:bg-blue-800/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px]" />
        </div>
      </div>

      {/* Floating Navigation Island */}
      <div 
        className={`fixed top-0 w-full z-50 flex justify-center pt-4 sm:pt-6 px-4 pointer-events-none transition-transform duration-500 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}
      >
        <header className="pointer-events-auto liquid-glass-high rounded-full px-3 py-2 flex items-center gap-1 sm:gap-4 shadow-xl max-w-full sm:max-w-3xl">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 pl-1 pr-3 py-1 cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-md text-sm font-bold">
              {logoLetter}
            </div>
            <span className="font-semibold text-sm tracking-tight text-gray-800 dark:text-gray-100 hidden sm:inline-block">
              {adminName}
            </span>
          </div>

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center p-1 bg-gray-100/50 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    isActive 
                      ? 'text-indigo-600 dark:text-white bg-white dark:bg-neutral-700/80 shadow-sm font-semibold' 
                      : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          <div className="w-px h-6 bg-gray-300/50 dark:bg-white/10 hidden md:block"></div>

          {/* Actions */}
          <div className="flex items-center gap-1">
             <button
              onClick={() => navigate('/search')}
              className="p-2.5 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white transition-all"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
               <button onClick={onLogout} className="ml-1 p-2.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Logout">
                 <LogOut size={18} />
               </button>
            ) : (
               <button onClick={() => navigate('/login')} className="ml-1 p-2.5 rounded-full text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-28 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <nav className="relative liquid-glass-high rounded-3xl p-3 flex flex-col gap-1 shadow-2xl">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`
                }
              >
                <link.icon size={20} />
                <span className="font-medium">{link.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-12 px-4 sm:px-6 w-full max-w-5xl mx-auto relative z-0">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-sm text-gray-400 dark:text-gray-600 font-medium">
        <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}.</p>
      </footer>
    </div>
  );
};