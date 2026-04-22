'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText, Search, MessageSquare, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidGlass } from '@/components/LiquidGlass';
import { StorageService } from '@/services/storage';

const SearchInput = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (!val) {
          params.delete('q');
      } else {
          params.set('q', val);
      }
      router.replace(`${pathname}?${params.toString()}`);
  };

  return (
      <div className="w-full flex items-center gap-2 px-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input 
              autoFocus
              type="text" 
              placeholder="Type to search..." 
              className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400/70 h-8 font-medium"
              value={searchParams?.get('q') || ''}
              onChange={handleSearchChange}
          />
          <button onClick={() => router.push('/')} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
              <X size={14} />
          </button>
      </div>
  );
};

export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Determine if we are in "Immersive Mode" (Chat or Article Detail)
  const isChatPage = pathname === '/chat';
  const isArticleDetailPage = pathname.startsWith('/blog/') && pathname !== '/blog';
  const isImmersive = isChatPage || isArticleDetailPage;

  // Determine if we are in "Search Mode"
  const isSearchPage = pathname === '/search';

  const adminName = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'Eray';
  const logoLetter = adminName.charAt(0).toUpperCase();

  useEffect(() => {
    setIsMounted(true);
    const dark = StorageService.getTheme() === 'dark';
    setIsDarkMode(dark);

    const session = sessionStorage.getItem('my_session') || localStorage.getItem('my_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, isMounted]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    sessionStorage.removeItem('my_session');
    localStorage.removeItem('my_session');
    setIsAuthenticated(false);
    router.push('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const baseLinks = [
    { name: '主页', path: '/', icon: LayoutGrid },
    { name: '文章', path: '/blog', icon: FileText },
    { name: 'AI', path: '/chat', icon: MessageSquare },
  ];

  const navLinks = isAuthenticated 
    ? [...baseLinks, { name: '控制台', path: '/admin', icon: Settings }] 
    : baseLinks;

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#020202]"></div>;
  }

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden selection:bg-indigo-500/30`}>
      
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8f9fa] dark:bg-[#020202] transition-colors duration-700">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {/* Top Spotlight */}
           <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-linear-to-b from-indigo-500/10 to-transparent dark:from-indigo-600/30 dark:to-transparent filter blur-2xl md:blur-[80px] rounded-full pointer-events-none" />

           {/* Animated Orbs */}
           <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-400/30 dark:bg-violet-600/40 rounded-full mix-blend-normal md:mix-blend-multiply dark:md:mix-blend-screen filter blur-[60px] md:blur-[90px] md:animate-pulse-slow will-change-transform" />
           <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] bg-blue-400/30 dark:bg-blue-600/30 rounded-full mix-blend-normal md:mix-blend-multiply dark:md:mix-blend-screen filter blur-[60px] md:blur-[100px] md:animate-float will-change-transform" />
        </div>
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-[0.06] mix-blend-overlay pointer-events-none hidden md:block"></div>
      </div>

      {/* Floating Navigation */}
      {!isImmersive && (
        <motion.div 
          className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          initial={false}
          animate={{ 
            y: isNavVisible ? 0 : -100,
            opacity: isNavVisible ? 1 : 0
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div 
            layout
            initial={false}
            animate={{ 
              width: isSearchPage ? '100%' : 'auto'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="liquid-glass-wrapper pointer-events-auto rounded-full shadow-xl sm:min-w-[320px] max-w-full md:max-w-2xl flex-shrink-0"
            style={{ overflow: 'hidden' }}
          >
            <div className="liquid-glass-content px-2 md:px-4 py-1.5 flex items-center justify-between w-full h-full gap-2 relative">
                <motion.div 
                  layout="position"
                  className="flex items-center gap-2 sm:pr-3 cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group shrink-0 z-10"
                  onClick={() => router.push('/')}
                >
                <div className="w-8 h-8 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold font-mono border border-white/20 group-hover:scale-105 transition-transform shrink-0">
                    {logoLetter}
                </div>
                <AnimatePresence mode="popLayout">
                  {!isSearchPage && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)' }}
                      exit={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="font-bold text-sm tracking-tight text-gray-800 dark:text-gray-100 hidden sm:block whitespace-nowrap"
                    >
                      {adminName}
                    </motion.span>
                  )}
                </AnimatePresence>
                </motion.div>

                <div className="flex-1 flex items-center justify-center min-w-0 relative h-8 overflow-visible">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isSearchPage ? (
                        <motion.div 
                          key="search-input"
                          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="w-full flex items-center"
                        >
                            <React.Suspense fallback={<div className="h-8"></div>}>
                                <SearchInput />
                            </React.Suspense>
                        </motion.div>
                    ) : (
                        <motion.nav 
                          key="nav-links"
                          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="hidden md:flex w-full items-center justify-center gap-0.5 whitespace-nowrap"
                        >
                            {navLinks.map((link) => {
                                const isActive = pathname === link.path;
                                return (
                                <Link
                                key={link.path}
                                href={link.path}
                                className={`px-2 md:px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-all duration-300 ${
                                    isActive 
                                        ? 'text-indigo-600 dark:text-white bg-white/80 dark:bg-white/10 shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                {link.name}
                                </Link>
                            )})}
                        </motion.nav>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="popLayout">
                  {!isSearchPage && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, width: 0, margin: 0 }}
                      animate={{ opacity: 1, scale: 1, width: '1px', margin: '0 0.5rem' }}
                      exit={{ opacity: 0, scale: 0.8, width: 0, margin: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="h-4 bg-gray-300/50 dark:bg-white/10 hidden md:block shrink-0"
                    />
                  )}
                </AnimatePresence>

                <motion.div layout="position" className="flex items-center gap-1 md:gap-2 shrink-0 z-10">
                    <AnimatePresence mode="popLayout">
                      {!isSearchPage && (
                          <motion.button 
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={() => router.push('/search')} 
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all overflow-hidden"
                          >
                              <Search size={16} className="shrink-0" />
                          </motion.button>
                      )}
                    </AnimatePresence>
                    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all shrink-0">
                        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <AnimatePresence mode="popLayout">
                      {!isSearchPage && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="overflow-hidden"
                          >
                            {isAuthenticated ? (
                                <button onClick={handleLogout} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"><LogOut size={16} /></button>
                            ) : (
                                <button onClick={() => router.push('/login')} className="hidden sm:block p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0"><Lock size={16} /></button>
                            )}
                          </motion.div>
                      )}
                    </AnimatePresence>
                    <button className="md:hidden p-2 text-gray-600 dark:text-gray-300 shrink-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button>
                </motion.div>
            </div>

          </motion.div>
        </motion.div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && !isImmersive && !isSearchPage && (
        <div className="fixed inset-0 z-40 pt-24 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <LiquidGlass className="rounded-2xl p-2 flex flex-col gap-1 shadow-2xl relative z-50">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
              <Link key={link.path} href={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                <link.icon size={18} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            )})}
             {!isAuthenticated && (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200">
                    <Lock size={18} />
                    <span className="font-medium text-sm">管理员登录</span>
                </Link>
            )}
          </LiquidGlass>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full relative z-0 ${isChatPage ? 'h-dvh overflow-hidden' : (isArticleDetailPage ? 'min-h-screen' : 'pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto')}`}>
        {children}
      </main>

      {!isImmersive && (
        <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
          <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}.</p>
        </footer>
      )}
    </div>
  );
};