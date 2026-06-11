import React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Globe, BookOpen, Link2 } from 'lucide-react';
import { ServerStorageService } from '../services/server-storage';
import * as Icons from 'lucide-react';
import { LiquidGlass } from '../components/LiquidGlass';
import { PointerLens } from '../components/PointerLens';
import { Project } from '../types';
import { AnimatedSection, AnimatedItem } from '../components/AnimatedSection';

export default async function Home() {
  const projects = await ServerStorageService.getProjects().catch(() => []);
  const allArticles = await ServerStorageService.getPublishedArticlesLight().catch(() => []);
  const recentArticles = allArticles.slice(0, 5);

  const adminName = process.env.ADMIN_USERNAME || 'Eray';

  const getFaviconUrl = (url: string) => {
    try {
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;
    } catch {
      return '';
    }
  };

  const renderIcon = (project: Project) => {
    if (project.iconType === 'generated' && project.customSvg) {
      return (
        <div
          className="w-7 h-7 text-[var(--blog-fg)] opacity-80 [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: project.customSvg }}
        />
      );
    }
    if (project.iconType === 'auto' && project.imageBase64) {
      return <img src={project.imageBase64} alt={project.title} className="w-7 h-7 rounded-lg object-cover grayscale" />;
    }
    if (project.iconType === 'auto') {
      return (
        <img
          src={getFaviconUrl(project.url)}
          alt={project.title}
          className="w-7 h-7 rounded-lg object-cover grayscale"
        />
      );
    }
    const IconComponent = (Icons as any)[project.presetIcon || 'Globe'];
    return IconComponent ? <IconComponent size={28} className="text-[var(--blog-fg)] opacity-80" /> : <Globe size={28} />;
  };

  return (
    <div className="relative">
      <PointerLens />

      <section className="blog-hero min-h-screen px-5 sm:px-8 pt-32 pb-16 flex items-center justify-center">
        <div className="hero-copy hero-copy-base w-full max-w-6xl text-center">
          <p className="mb-8 text-xs sm:text-sm font-extrabold tracking-[0.22em] text-[var(--blog-muted)]">
            文章 · 想法 · 技术实践
          </p>
          <h1
            className="hero-title mx-auto max-w-6xl text-[clamp(3.4rem,10.8vw,10rem)] font-black leading-[0.86] tracking-[-0.075em] text-[var(--blog-fg)]"
            aria-label={`HELLO, THIS IS ${adminName.toUpperCase()}`}
          >
            <span className="block">HELLO, THIS IS</span>
            <span className="block">{adminName.toUpperCase()}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base sm:text-lg font-semibold leading-8 text-[var(--blog-muted)]">
            文章、想法与技术记录。保持简洁，留住锋利。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--blog-fg)] px-6 py-3 text-sm font-extrabold text-[var(--blog-bg)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              阅读文章
              <ArrowRight size={17} />
            </Link>
            <Link
              href="#latest"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--blog-line)] px-6 py-3 text-sm font-extrabold text-[var(--blog-fg)] transition-colors hover:bg-[var(--blog-fg-soft)]"
            >
              最近更新
            </Link>
          </div>
        </div>
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-[0.18em] text-[var(--blog-muted)]">
          SCROLL FOR POSTS
        </p>
      </section>

      <section id="latest" className="px-5 sm:px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--blog-line)] pb-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-[var(--blog-muted)]">
                <BookOpen size={15} />
                LATEST
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.055em] text-[var(--blog-fg)]">最新文章</h2>
            </div>
            <Link href="/blog" className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-[var(--blog-muted)] transition-colors hover:bg-[var(--blog-fg-soft)] hover:text-[var(--blog-fg)]">
              全部文章
              <ArrowRight size={16} />
            </Link>
          </div>

          <AnimatedSection className="space-y-3">
            {recentArticles.map((article) => (
              <AnimatedItem key={article.id} className="group">
                <Link href={`/blog/${article.id}`} className="block">
                  <LiquidGlass variant="card" className="glass-card px-5 py-5 transition-transform duration-300 group-hover:-translate-y-1 sm:px-6">
                    <article className="grid gap-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                      <div className="font-mono text-sm font-bold text-[var(--blog-muted)]">
                        {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl sm:text-2xl font-black tracking-[-0.04em] text-[var(--blog-fg)]">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm sm:text-base leading-7 text-[var(--blog-muted)]">
                          {article.summary}
                        </p>
                        {article.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="blog-tag px-2.5 py-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--blog-line)] text-[var(--blog-muted)] transition-all group-hover:border-[var(--blog-fg)] group-hover:text-[var(--blog-fg)] sm:flex">
                        <ArrowRight size={17} />
                      </div>
                    </article>
                  </LiquidGlass>
                </Link>
              </AnimatedItem>
            ))}
            {recentArticles.length === 0 && (
              <LiquidGlass variant="card" className="glass-card py-16 text-center text-[var(--blog-muted)]">
                暂无文章
              </LiquidGlass>
            )}
          </AnimatedSection>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3 text-[var(--blog-fg)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--blog-fg-soft)]">
              <Link2 size={18} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.045em]">精选链接</h2>
          </div>

          <AnimatedSection className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <AnimatedItem key={project.id} className="group">
                <Link href={project.url} target="_blank" className="block h-full">
                  <LiquidGlass variant="card" className="glass-card h-full p-5 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="mb-7 flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--blog-fg-soft)]">
                        {renderIcon(project)}
                      </div>
                      <ExternalLink size={18} className="text-[var(--blog-muted)] transition-colors group-hover:text-[var(--blog-fg)]" />
                    </div>
                    <h3 className="text-lg font-black tracking-[-0.035em] text-[var(--blog-fg)]">{project.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--blog-muted)]">
                      {project.description}
                    </p>
                  </LiquidGlass>
                </Link>
              </AnimatedItem>
            ))}
            {projects.length === 0 && (
              <LiquidGlass variant="card" className="glass-card col-span-full py-14 text-center text-[var(--blog-muted)]">
                暂无链接
              </LiquidGlass>
            )}
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
// force redeploy Thu Jun 11 05:21:38 UTC 2026
