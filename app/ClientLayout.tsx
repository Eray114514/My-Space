'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Moon, Sun, Lock, LogOut, Menu, X, LayoutGrid, FileText, Search, MessageSquare, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiquidGlass } from '@/components/LiquidGlass';
import { StorageService } from '@/services/storage';

const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  // 优先用 maxTouchPoints（更可靠），再用 hover 媒体查询
  if (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches) {
    // 排除有精细指针的设备（带鼠标的笔记本/平板）
    if (!window.matchMedia('(any-pointer: fine)').matches) return true;
  }
  return false;
};

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
              className="w-full bg-transparent border-none outline-none text-sm text-[var(--blog-fg)] placeholder:text-[var(--blog-muted)] h-8 font-medium"
              value={searchParams?.get('q') || ''}
              onChange={handleSearchChange}
          />
          <button type="button" onClick={() => router.push('/')} className="p-1.5 rounded-full text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]" aria-label="关闭搜索">
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
  const [isNavOverContent, setIsNavOverContent] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastScrollY = useRef(0);
  
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Determine if we are in "Immersive Mode" (Chat or Article Detail)
  const isChatPage = pathname === '/chat';
  const isArticleDetailPage = pathname.startsWith('/blog/') && pathname !== '/blog';
  const isImmersive = isChatPage || isArticleDetailPage;
  const isHomePage = pathname === '/';

  // Determine if we are in "Search Mode"
  const isSearchPage = pathname === '/search';

  const adminName = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'Eray';

  useEffect(() => {
    setIsMounted(true);
    const touch = isTouchDevice();
    setIsTouch(touch);
    if (touch) {
      document.documentElement.classList.add('is-touch');
    }
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
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, (currentScrollY / docHeight) * 100) : 0);

      const contentThreshold = isHomePage ? window.innerHeight * 0.68 : 80;
      setIsNavOverContent(currentScrollY > contentThreshold);

      if (isImmersive) return;

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

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, isImmersive]);

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
    <div className="blog-shell min-h-screen flex flex-col relative overflow-x-hidden selection:bg-black/10 dark:selection:bg-white/20">
      
      {/* Background */}
      <div className="blog-background fixed inset-0 -z-10 transition-colors duration-500">
        <div className="blog-background-grid absolute inset-0 pointer-events-none" />
        <div className="blog-background-refraction absolute inset-0 pointer-events-none" />
      </div>

      <svg className="fixed h-0 w-0 pointer-events-none" aria-hidden="true" focusable="false">
        <filter id="liquid-glass-refraction" x="-18%" y="-80%" width="136%" height="260%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.026" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Floating Navigation */}
      {!isImmersive && (
        <motion.div 
          className="fixed top-3 sm:top-5 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none"
          initial={false}
          animate={{ 
            y: isNavVisible ? 0 : -88,
            scale: isNavVisible ? 1 : 0.985
          }}
          transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            data-blog-header
            data-nav-context={isNavOverContent ? 'content' : 'hero'}
            className={`glass-blog pointer-events-auto rounded-full flex-shrink-0 isolate ${
              isSearchPage
                ? 'w-full max-w-[720px]'
                : `w-fit max-w-[calc(100vw-32px)] ${isAuthenticated ? 'md:min-w-[820px]' : 'md:min-w-[720px]'}`
            }`}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-refract-grid" aria-hidden="true" />
            <div className="glass-cursor-bubble" aria-hidden="true" />
            <div className="relative z-10 px-3 sm:px-4 md:px-5 py-1.5 md:py-2 flex items-center w-full h-full gap-2 md:gap-4">
                <div className="flex-1 flex justify-start">
                  <Link
                    href="/"
                    className="group shrink-0 rounded-full px-2 py-1 text-sm sm:text-base font-black tracking-[0.16em] text-[var(--blog-fg)] transition-transform hover:scale-[1.02]"
                    aria-label="返回首页"
                  >
                    {adminName}
                  </Link>
                </div>

                <div className={`${isSearchPage ? 'flex-1' : 'shrink-0'} flex items-center justify-center min-w-0 relative min-h-8 overflow-visible`}>
                  {isSearchPage ? (
                    <div className="w-full flex items-center">
                      <React.Suspense fallback={<div className="h-8"></div>}>
                        <SearchInput />
                      </React.Suspense>
                    </div>
                  ) : (
                    <nav className="hidden md:flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full">
                      {navLinks.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                          <Link
                            key={link.path}
                            href={link.path}
                            className={`blog-nav-pill px-3.5 py-1.5 rounded-full text-[11px] font-extrabold tracking-[0.1em] transition-all ${
                              isActive
                                ? 'is-active text-[var(--blog-bg)] bg-[var(--blog-fg)]'
                                : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]'
                            }`}
                          >
                            {link.name}
                          </Link>
                        );
                      })}
                    </nav>
                  )}
                </div>

                {!isSearchPage && (
                  <div className="h-4 bg-[var(--blog-line)] hidden md:block shrink-0 w-px" />
                )}

                <div className="flex-1 flex justify-end items-center gap-1 z-10">
                    {!isSearchPage && (
                      <button
                        type="button"
                        onClick={() => router.push('/search')}
                        className="blog-icon-button"
                        aria-label="打开搜索"
                      >
                        <Search size={16} className="shrink-0" />
                      </button>
                    )}
                    <button type="button" onClick={toggleTheme} className="blog-icon-button" aria-label="切换主题">
                        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    {!isSearchPage && (
                      <>
                        {isAuthenticated ? (
                          <button type="button" onClick={handleLogout} className="blog-icon-button hover:text-red-500" aria-label="退出登录">
                            <LogOut size={16} />
                          </button>
                        ) : (
                          <button type="button" onClick={() => router.push('/login')} className="blog-icon-button hidden sm:inline-flex" aria-label="管理员登录">
                            <Lock size={16} />
                          </button>
                        )}
                      </>
                    )}
                    <button type="button" className="blog-icon-button blog-mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}>
                      {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && !isImmersive && !isSearchPage && (
        <div className="fixed inset-0 z-40 pt-24 px-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <LiquidGlass variant="popover" className="glass-blog rounded-2xl p-2 flex flex-col gap-1 shadow-2xl relative z-50">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
              <Link key={link.path} href={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'hover:bg-[var(--blog-fg-soft)] text-[var(--blog-fg)]'}`}>
                <link.icon size={18} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            )})}
             {!isAuthenticated && (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--blog-fg-soft)] text-[var(--blog-fg)]">
                    <Lock size={18} />
                    <span className="font-medium text-sm">管理员登录</span>
                </Link>
            )}
          </LiquidGlass>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full relative z-0 ${isChatPage ? 'h-dvh overflow-hidden' : (isArticleDetailPage ? 'min-h-screen' : (isHomePage ? 'pt-0 pb-12' : 'pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto'))} ${isTouch && !isImmersive && !isSearchPage ? 'pb-24' : ''}`}>
        {children}
      </main>

      {!isImmersive && (
        <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
          <p className="mix-blend-plus-darker dark:mix-blend-plus-lighter">&copy; {new Date().getFullYear()} {adminName}.</p>
        </footer>
      )}

      {/* 移动端底部 Dock 导航 */}
      {isTouch && !isImmersive && !isSearchPage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
          <div className="glass-blog rounded-2xl px-2 py-2 flex items-center gap-1 shadow-2xl">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-all min-w-[56px] ${
                    isActive ? 'text-[var(--blog-fg)]' : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-dock-indicator"
                      className="absolute inset-0 rounded-xl bg-[var(--blog-fg-soft)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <link.icon size={20} className="relative z-10" />
                  <span className="relative z-10 text-[9px] font-extrabold tracking-wider">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 移动端首页滚动进度条 */}
      {isTouch && isHomePage && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent md:hidden">
          <div
            className="h-full bg-[var(--blog-fg)] transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 0 ? 0.6 : 0 }}
          />
        </div>
      )}
    </div>
  );
};
