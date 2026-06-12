import React from 'react';
import { notFound } from 'next/navigation';
import { ServerStorageService } from '../../../services/server-storage';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { Calendar, Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import { BackButton } from './BackButton';
import { ArticleReadingChrome } from '../../../components/ArticleReadingChrome';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id);
  const article = await ServerStorageService.getArticleById(id).catch(() => null);
  if (!article) return { title: '文章未找到' };

  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.createdAt,
      authors: ['Eray'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
    }
  };
}

export default async function ArticleDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id);
  const article = await ServerStorageService.getArticleById(id).catch(() => null);

  if (!article) {
    notFound();
  }

  return (
    <article className="article-page min-h-screen relative pb-24 overflow-x-hidden w-full max-w-full">
      <ArticleReadingChrome chatHref={`/chat?articleId=${article.id}`} />

      <div className="fixed top-0 left-0 w-full p-4 sm:p-6 z-50 pointer-events-none">
        <BackButton />
      </div>

      <header className="article-cover px-4 sm:px-6 pt-28 sm:pt-32 pb-10">
        <div className="article-main-column mx-auto">
          <div className="article-cover-grid">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="blog-tag px-3 py-1 uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="article-title text-4xl sm:text-6xl lg:text-7xl font-black text-[var(--blog-fg)] leading-[0.98]">
                {article.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base sm:text-lg leading-8 text-[var(--blog-muted)]">
                {article.summary}
              </p>
            </div>

            <aside className="article-meta-panel content-surface">
              <div className="article-meta-kicker">
                <Sparkles size={14} />
                ARTICLE
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[var(--blog-muted)]">
                <Calendar size={15} />
                {new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </aside>
          </div>
        </div>
      </header>

      <div className="article-body-wrap article-main-column mx-auto px-4 sm:px-6">
        <div className="article-paper content-surface">
          <MarkdownRenderer content={article.content} />
        </div>
      </div>
    </article>
  );
}
