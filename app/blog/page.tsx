import React from 'react';
import Link from 'next/link';
import { ServerStorageService } from '../../services/server-storage';
import { Metadata } from "next";
import { Article } from '../../types';
import { ArrowRight, BookOpen, Filter } from 'lucide-react';
import { ScrollStage, StageReveal } from '../../components/ScrollExperience';

export const metadata: Metadata = {
  title: "文章归档",
  description: "Eray 的文章归档，记录想法、技术与实践。",
  openGraph: {
    title: '文章归档 - Eray',
    description: 'Eray 的文章归档，记录想法、技术与实践。',
  }
};

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const articles: Article[] = await ServerStorageService.getPublishedArticlesLight().catch(() => []);
  const selectedTag = resolvedSearchParams.tag || null;

  const tags = (() => {
    const map = new Map<string, number>();
    articles.forEach(a => {
      if (a.tags) {
        a.tags.forEach(t => map.set(t, (map.get(t) || 0) + 1));
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  })();

  const filteredArticles = selectedTag
    ? articles.filter(a => a.tags && a.tags.includes(selectedTag))
    : articles;

  return (
    <div className="archive-page mx-auto max-w-6xl py-8 sm:py-14">
      <header className="archive-hero content-surface mb-10 p-6 sm:p-10">
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-[var(--blog-muted)]">
          <BookOpen size={15} />
          ARCHIVE FIELD
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black text-[var(--blog-fg)]">文章归档</h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-8 text-[var(--blog-muted)]">
              文章、想法与技术实践。按时间沉淀，方便回看。
            </p>
          </div>
          <div className="archive-count">
            <span>{filteredArticles.length}</span>
            <small>{selectedTag ? 'FILTERED' : 'POSTS'}</small>
          </div>
        </div>
      </header>

      {tags.length > 0 && (
        <nav className="archive-filter mb-10" aria-label="文章标签筛选">
          <div className="archive-filter-label">
            <Filter size={15} />
            FILTER
          </div>
          <div className="archive-filter-track scrollbar-hide">
            <Link
              href="/blog"
              className={`archive-filter-chip ${selectedTag === null ? 'is-active' : ''}`}
            >
              全部 <span>{articles.length}</span>
            </Link>
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={selectedTag === tag ? '/blog' : `/blog?tag=${encodeURIComponent(tag)}`}
                className={`archive-filter-chip ${selectedTag === tag ? 'is-active' : ''}`}
              >
                {tag} <span>{count}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <ScrollStage className="archive-stage">
        <div className="archive-timeline">
          {filteredArticles.map((article, index) => (
            <StageReveal key={article.id} delay={Math.min(index * 0.025, 0.18)} className="group">
              <Link href={`/blog/${article.id}`} className="archive-record content-surface">
                <article className="grid gap-5 md:grid-cols-[132px_1fr_auto] md:items-center">
                  <div className="archive-record-date">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <time>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</time>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--blog-fg)]">{article.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm sm:text-base leading-7 text-[var(--blog-muted)]">{article.summary}</p>
                    {article.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {article.tags.slice(0, 4).map(tag => (
                          <span key={tag} className={`blog-tag px-2.5 py-1 ${selectedTag === tag ? 'is-active' : ''}`}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="article-card-action">
                    <ArrowRight size={17} />
                  </div>
                </article>
              </Link>
            </StageReveal>
          ))}
          {filteredArticles.length === 0 && (
            <div className="content-surface content-empty text-center py-14 text-[var(--blog-muted)]">
              {selectedTag ? `标签 "${selectedTag}" 下暂无文章` : '暂无公开文章'}
            </div>
          )}
        </div>
      </ScrollStage>
    </div>
  );
}
