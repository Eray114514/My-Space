import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ServerStorageService } from '../../../services/server-storage';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import { LiquidGlass } from '../../../components/LiquidGlass';
import { Metadata } from 'next';

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
    <article className="min-h-screen relative animate-in fade-in duration-500 pb-20 overflow-x-hidden w-full max-w-full">

      {/* Immersive Back Button Header */}
      <div className="fixed top-0 left-0 w-full p-6 z-50 pointer-events-none">
          <Link 
            href="/blog"
            className="blog-control pointer-events-auto h-10 w-10 p-0"
            title="返回列表"
          >
            <ArrowLeft size={20} />
          </Link>
      </div>
      
      {/* Content Container (Center Aligned) */}
      <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6">
        <LiquidGlass variant="panel" className="glass-panel p-6 sm:p-10 lg:p-12 relative">
            <header className="mb-10 pb-8 border-b border-[var(--blog-line)]">
                <div className="flex flex-wrap gap-2 mb-6">
                    {article.tags.map(tag => (
                        <span key={tag} className="blog-tag px-3 py-1 uppercase tracking-wide">
                        {tag}
                        </span>
                    ))}
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-[var(--blog-fg)] leading-[1.05] mb-6 tracking-[-0.06em]">
                {article.title}
                </h1>
                <div className="flex items-center text-[var(--blog-muted)] text-sm gap-4 font-mono">
                <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                </div>
            </header>

            <MarkdownRenderer content={article.content} />
        </LiquidGlass>
      </div>

      {/* Floating Chat Button */}
      <Link 
        href={`/chat?articleId=${article.id}`}
        className="blog-button-primary fixed bottom-8 right-8 z-50 px-5 py-3 text-sm"
      >
        <MessageSquare size={20} />
        <span className="hidden sm:inline">对此文章提问</span>
      </Link>
    </article>
  );
}
