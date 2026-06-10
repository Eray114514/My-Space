import React from 'react';
import Link from 'next/link';
import { ServerStorageService } from '../../services/server-storage';
import { LiquidGlass } from '../../components/LiquidGlass';
import { AnimatedSection, AnimatedItem } from '../../components/AnimatedSection';
import { Metadata } from "next";
import { Article } from '../../types';
import { ArrowRight, BookOpen } from 'lucide-react';

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
    <div className="mx-auto max-w-5xl py-10 sm:py-16 space-y-10">
      <header className="border-b border-[var(--blog-line)] pb-8">
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.2em] text-[var(--blog-muted)]">
          <BookOpen size={15} />
          ARCHIVE
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.06em] text-[var(--blog-fg)]">文章归档</h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg leading-8 text-[var(--blog-muted)]">文章、想法与技术实践。按时间沉淀，方便回看。</p>
      </header>

      {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
             <Link
                href="/blog"
                className={`blog-tag px-4 py-2 ${selectedTag === null ? 'is-active' : ''}`}
             >
                 全部 ({articles.length})
             </Link>
             {tags.map(([tag, count]) => (
                 <Link
                    key={tag}
                    href={selectedTag === tag ? '/blog' : `/blog?tag=${encodeURIComponent(tag)}`}
                    className={`blog-tag px-4 py-2 ${selectedTag === tag ? 'is-active' : ''}`}
                 >
                     {tag} <span className="opacity-70 ml-1 text-[10px]">{count}</span>
                 </Link>
             ))}
          </div>
      )}

      <AnimatedSection className="space-y-3">
        {filteredArticles.map((article) => (
          <AnimatedItem key={article.id} className="group">
            <Link href={`/blog/${article.id}`} className="block">
              <LiquidGlass className="glass-card px-5 py-5 transition-transform duration-300 group-hover:-translate-y-1 sm:px-6">
                <article className="grid gap-4 sm:grid-cols-[126px_1fr_auto] sm:items-center">
                  <time className="font-mono text-sm font-bold text-[var(--blog-muted)]">
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                  </time>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black tracking-[-0.04em] text-[var(--blog-fg)]">{article.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm sm:text-base leading-7 text-[var(--blog-muted)]">{article.summary}</p>
                    {article.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {article.tags.slice(0, 4).map(tag => (
                          <span key={tag} className={`blog-tag px-2.5 py-1 ${selectedTag === tag ? 'is-active' : ''}`}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--blog-line)] text-[var(--blog-muted)] transition-colors group-hover:border-[var(--blog-fg)] group-hover:text-[var(--blog-fg)] sm:flex">
                    <ArrowRight size={17} />
                  </div>
                </article>
              </LiquidGlass>
            </Link>
          </AnimatedItem>
        ))}
        {filteredArticles.length === 0 && (
             <LiquidGlass className="glass-card text-center py-14 text-[var(--blog-muted)]">
                 {selectedTag ? `标签 "${selectedTag}" 下暂无文章` : '暂无公开文章'}
             </LiquidGlass>
        )}
      </AnimatedSection>
    </div>
  );
}
