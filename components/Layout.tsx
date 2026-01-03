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

  // Scroll handler for auto-hiding navbar
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
      
      {/* Background - Enhanced Visibility for Dark Mode Glass Effect */}
      <div className="fixed inset-0 -z-10 bg-[#f8f9fa] dark:bg-[#020202] transition-colors duration-700">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {/* Spotlight - Much Brighter in Dark Mode */}
           <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-gradient-to-b from-indigo-500/10 to-transparent dark:from-indigo-600/30 dark:to-transparent blur-[80px] rounded-full pointer-events-none" />

           {/* Animated Blobs - Higher Opacity for Glass Refraction */}
           <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-400/30 dark:bg-violet-600/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[90px] animate-pulse-slow" />
           <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] bg-blue-400/30 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-float" />
           <div className="absolute bottom-[0%] left-[30%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-pink-400/20 dark:bg-fuchsia-800/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px]" />
        </div>
        {/* Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-[0.06] mix-blend-overlay"></div>
      </div>

      {/* Floating Navigation (Redesigned) */}
      {!isImmersive && (
        <div 
          className={`fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-transform duration-500 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-[200%]'}`}
        >
          {/* New Compact Design: Tighter padding, smaller height, island style */}
          <LiquidGlass className={`pointer-events-auto rounded-[1.25rem] px-2 py-1.5 flex items-center shadow-xl transition-all duration-300 ${isSearchPage ? 'w-full max-w-lg' : 'w-fit min-w-[300px]'}`}>
            
            {/* Left: Branding */}
            <div 
              className={`flex items-center gap-2 pl-2 pr-4 py-1.5 cursor-pointer rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group shrink-0`}
              onClick={() => navigate('/')}
            >
              <div className="w-7 h-7 bg-gradient-to-tr from-gray-800 to-black dark:from-white dark:to-gray-300 rounded-lg flex items-center justify-center text-white dark:text-black shadow-md text-xs font-bold font-mono group-hover:scale-105 transition-transform">
                {logoLetter}
              </div>
            </div>

            {/* Center: Navigation or Search */}
            {isSearchPage ? (
                <div className="flex-1 flex items-center gap-2 px-2 animate-in fade-in zoom-in-95">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Type to search..." 
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400/70 h-8 font-medium"
                        value={searchParams.get('q') || ''}
                        onChange={handleSearchChange}
                    />
                    <button onClick={() => navigate('/')} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <nav className="hidden md:flex items-center gap-1 mx-2">
                    {navLinks.map((link) => (
                        <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 relative ${
                            isActive 
                                ? 'text-gray-900 dark:text-white bg-white/60 dark:bg-white/10 shadow-sm backdrop-blur-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                            }`
                        }
                        >
                        {link.name}
                        </NavLink>
                    ))}
                </nav>
            )}

            {/* Divider */}
            <div className="w-px h-4 bg-gray-300/50 dark:bg-white/10 hidden md:block mx-2"></div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">
                {!isSearchPage && (
                    <button onClick={() => navigate('/search')} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all">
                        <Search size={16} />
                    </button>
                )}
                <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all">
                    {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                {!isSearchPage && (
                     isAuthenticated ? (
                        <button onClick={onLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><LogOut size={16} /></button>
                    ) : (
                        <button onClick={() => navigate('/login')} className="hidden sm:block p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all"><Lock size={16} /></button>
                    )
                )}
                <button className="md:hidden p-2 text-gray-600 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button>
            </div>
          </LiquidGlass>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && !isImmersive && !isSearchPage && (
        <div className="fixed inset-0 z-40 pt-24 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <LiquidGlass className="rounded-2xl p-2 flex flex-col gap-1 shadow-2xl relative z-50">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                <link.icon size={18} />
                <span className="font-medium text-sm">{link.name}</span>
              </NavLink>
            ))}
             {!isAuthenticated && (
                <NavLink to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200">
                    <Lock size={18} />
                    <span className="font-medium text-sm">管理员登录</span>
                </NavLink>
            )}
          </LiquidGlass>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full relative z-0 ${isImmersive ? 'h-screen overflow-hidden' : 'pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto'}`}>
        <Outlet />
      </main>

      {!isImmersive && (
        <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
          <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}.</p>
        </footer>
      )}
    </div>
  );
};