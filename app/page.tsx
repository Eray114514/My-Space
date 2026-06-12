import React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Globe, BookOpen, Link2, Sparkles } from 'lucide-react';
import { ServerStorageService } from '../services/server-storage';
import * as Icons from 'lucide-react';
import { PointerLens } from '../components/PointerLens';
import { Project } from '../types';
import { ScrollStage, StageReveal } from '../components/ScrollExperience';

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
    <div className="home-canvas relative">
      <PointerLens />

      <section className="blog-hero home-hero min-h-screen px-5 sm:px-8 pt-32 pb-16 flex items-center justify-center">
        <div className="home-hero-axis" aria-hidden="true" />
        <div className="hero-copy hero-copy-base w-full max-w-6xl text-center">
          <p className="mb-8 text-xs sm:text-sm font-extrabold tracking-[0.22em] text-[var(--blog-muted)]">
            文章 · 想法 · 技术实践
          </p>
          <h1
            className="hero-title mx-auto max-w-6xl text-[clamp(3.25rem,10.8vw,10rem)] font-black leading-[0.86] tracking-[-0.075em] text-[var(--blog-fg)]"
            aria-label={`HELLO, THIS IS ${adminName.toUpperCase()}`}
          >
            <span className="hidden sm:block">HELLO, THIS IS</span>
            <span className="block sm:hidden">HELLO,</span>
            <span className="block sm:hidden">THIS IS</span>
            <span className="block">{adminName.toUpperCase()}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base sm:text-lg font-semibold leading-8 text-[var(--blog-muted)]">
            文章、想法与技术记录。保持简洁，留住锋利。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/blog" className="blog-button-primary px-6 py-3 text-sm">
              阅读文章
              <ArrowRight size={17} />
            </Link>
            <Link href="#latest" className="blog-button-secondary px-6 py-3 text-sm">
              最近更新
            </Link>
          </div>
        </div>
        <p className="home-scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-[0.18em] text-[var(--blog-muted)]">
          SCROLL FOR POSTS
        </p>
      </section>

      <ScrollStage id="latest" className="home-stage px-5 sm:px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="stage-heading mb-12 grid gap-6 border-b border-[var(--blog-line)] pb-7 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-[var(--blog-muted)]">
                <BookOpen size={15} />
                LATEST
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[var(--blog-fg)]">最新文章</h2>
            </div>
            <Link href="/blog" className="blog-button-secondary hidden px-4 py-2 text-sm md:inline-flex">
              全部文章
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-stream">
            <aside className="home-stream-rail" aria-hidden="true">
              <span>FOCUS</span>
              <strong>{String(recentArticles.length).padStart(2, '0')}</strong>
            </aside>
            <div className="home-article-stack">
              {recentArticles.map((article, index) => (
                <StageReveal key={article.id} delay={index * 0.04} className="group">
                  <Link href={`/blog/${article.id}`} className={`article-focus-card content-surface ${index === 0 ? 'is-primary' : ''}`}>
                    <article className="grid gap-5 md:grid-cols-[92px_1fr_auto] md:items-center">
                      <div className="article-index">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <time>
                          {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                        </time>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-2xl sm:text-3xl font-black text-[var(--blog-fg)]">
                          {article.title}
                        </h3>
                        <p className="mt-3 line-clamp-2 text-sm sm:text-base leading-7 text-[var(--blog-muted)]">
                          {article.summary}
                        </p>
                        {article.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="blog-tag px-2.5 py-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="article-card-action">
                        <ArrowRight size={18} />
                      </div>
                    </article>
                  </Link>
                </StageReveal>
              ))}
              {recentArticles.length === 0 && (
                <div className="content-surface content-empty py-16 text-center text-[var(--blog-muted)]">
                  暂无文章
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollStage>

      <ScrollStage className="home-stage px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 text-[var(--blog-fg)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-[var(--blog-muted)]">
                <Link2 size={15} />
                LINKS
              </div>
              <h2 className="text-3xl sm:text-5xl font-black">精选链接</h2>
            </div>
          </div>

          <div className="project-constellation">
            <div className="project-constellation-grid" aria-hidden="true" />
            {projects.map((project, index) => (
              <StageReveal key={project.id} delay={index * 0.035} className="group">
                <Link href={project.url} target="_blank" className="project-node content-surface">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="project-node-icon">
                      {renderIcon(project)}
                    </div>
                    <ExternalLink size={18} className="text-[var(--blog-muted)] transition-colors group-hover:text-[var(--blog-fg)]" />
                  </div>
                  <h3 className="text-lg font-black text-[var(--blog-fg)]">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--blog-muted)]">
                    {project.description}
                  </p>
                </Link>
              </StageReveal>
            ))}
            {projects.length === 0 && (
              <div className="content-surface content-empty col-span-full py-14 text-center text-[var(--blog-muted)]">
                <Sparkles className="mx-auto mb-3 opacity-40" size={28} />
                暂无链接
              </div>
            )}
          </div>
        </div>
      </ScrollStage>
    </div>
  );
}
