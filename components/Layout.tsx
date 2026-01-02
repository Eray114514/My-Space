import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, matchPath, useSearchParams } from 'react-router-dom';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText, Search, MessageSquare, Settings } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine if we are in "Immersive Mode" (Chat or Article Detail)
  const isChatPage = location.pathname === '/chat';
  const isArticleDetailPage = matchPath('/blog/:id', location.pathname);
  const isImmersive = isChatPage || isArticleDetailPage;

  // Determine if we are in "Search Mode"
  const isSearchPage = location.pathname === '/search';

  // Get dynamic branding from env
  const env = (import.meta as any).env;
  const adminName = env.ADMIN_USERNAME || 'Eray';
  const logoLetter = adminName.charAt(0).toUpperCase();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Scroll handler for auto-hiding navbar (Only active if NOT in immersive mode)
  useEffect(() => {
    if (isImmersive) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 20) {
        setIsNavVisible(true);
      } else {
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
  }, [isImmersive]);

  const baseLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
    { name: 'AI', path: '/chat', icon: MessageSquare },
  ];

  const navLinks = isAuthenticated 
    ? [...baseLinks, { name: '控制台', path: '/admin', icon: Settings }] 
    : baseLinks;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Replace URL params to update search results instantly
      setSearchParams(prev => {
          if (!val) {
              prev.delete('q');
          } else {
              prev.set('q', val);
          }
          return prev;
      }, { replace: true });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''} relative overflow-x-hidden selection:bg-indigo-500/30`}>
      
      {/* Background - Enhanced for Liquid Effect */}
      <div className="fixed inset-0 -z-10 bg-[#f8f9fa] dark:bg-[#020202] transition-colors duration-700">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {/* Top Center Spotlight - Crucial for Glass Refraction */}
           <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-gradient-to-b from-indigo-500/20 to-transparent dark:from-indigo-900/40 dark:to-transparent blur-[80px] rounded-full" />

           {/* Animated Blobs - Increased Opacity for Dark Mode */}
           <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-purple-300/40 dark:bg-violet-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-pulse-slow" />
           <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-300/40 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70" />
           <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-pink-300/30 dark:bg-fuchsia-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60" />
        </div>
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-[0.07] mix-blend-overlay"></div>
      </div>

      {/* Floating Navigation - HIDDEN on Chat & Article Detail */}
      {!isImmersive && (
        <div 
          className={`fixed top-0 w-full z-50 flex justify-center pt-4 sm:pt-8 px-4 pointer-events-none transition-transform duration-500 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}
        >
          {/* Changed: w-fit instead of max-w-3xl to hug content. Added min-w for stability. */}
          <LiquidGlass className={`pointer-events-auto rounded-full px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 sm:gap-4 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSearchPage ? 'w-full max-w-xl' : 'w-fit min-w-[320px] sm:min-w-[400px]'}`}>
            
            {/* Logo */}
            <div 
              className={`flex items-center gap-2 pl-2 pr-2 py-1 cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group shrink-0`}
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 text-sm font-bold border border-white/20">
                {logoLetter}
              </div>
              <span className={`font-semibold text-sm tracking-tight text-gray-800 dark:text-gray-100 hidden sm:inline-block ${isSearchPage ? 'hidden' : ''}`}>
                {adminName}
              </span>
            </div>

            {/* SEARCH INPUT MODE */}
            {isSearchPage ? (
                <div className="flex-1 flex items-center gap-2 px-1 animate-in fade-in zoom-in-95">
                    <Search size={18} className="text-gray-400 shrink-0" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Type to search..." 
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 h-9"
                        value={searchParams.get('q') || ''}
                        onChange={handleSearchChange}
                    />
                    <button onClick={() => navigate('/')} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                /* NORMAL NAV MODE */
                <>
                    <nav className="hidden md:flex items-center p-1">
                    {navLinks.map((link) => (
                        <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `px-4 py-1.5 mx-0.5 rounded-full text-sm transition-all duration-300 relative font-medium ${
                            isActive 
                                ? 'text-indigo-600 dark:text-white bg-white/80 dark:bg-white/10 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                            }`
                        }
                        >
                        {link.name}
                        </NavLink>
                    ))}
                    </nav>

                    <div className="w-px h-5 bg-gray-300/50 dark:bg-white/10 hidden md:block mx-1"></div>

                    <div className="flex items-center gap-1 ml-auto md:ml-0">
                        <button onClick={() => navigate('/search')} className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white transition-all">
                            <Search size={18} />
                        </button>
                        <button onClick={toggleTheme} className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all">
                            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        {isAuthenticated ? (
                            <button onClick={onLogout} className="ml-1 p-2.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><LogOut size={18} /></button>
                        ) : (
                            <button onClick={() => navigate('/login')} className="ml-1 p-2.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"><Lock size={18} /></button>
                        )}
                        <button className="md:hidden p-2.5 text-gray-600 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
                    </div>
                </>
            )}
          </LiquidGlass>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && !isImmersive && !isSearchPage && (
        <div className="fixed inset-0 z-40 pt-28 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <LiquidGlass className="rounded-3xl p-3 flex flex-col gap-1 shadow-2xl">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                <link.icon size={20} />
                <span className="font-medium">{link.name}</span>
              </NavLink>
            ))}
          </LiquidGlass>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full relative z-0 ${isImmersive ? 'h-screen overflow-hidden' : 'pt-32 pb-12 px-4 sm:px-6 max-w-5xl mx-auto'}`}>
        <Outlet />
      </main>

      {!isImmersive && (
        <footer className="py-8 text-center text-sm text-gray-400 dark:text-gray-600 font-medium">
          <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}.</p>
        </footer>
      )}
    </div>
  );
};