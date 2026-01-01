import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Article } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ArrowLeft, Calendar, Tag, MessageSquare } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const found = await StorageService.getArticleById(id);
        setArticle(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return <div className="py-20 text-center">Loading...</div>;
  if (!article) return <div className="py-20 text-center">文章未找到</div>;

  return (
    <article className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500 relative">
      <Link to="/blog" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-8 transition-colors px-3 py-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10">
        <ArrowLeft size={16} className="mr-2" />
        返回列表
      </Link>

      {/* Glass Container for Content */}
      <div className="liquid-glass rounded-3xl p-8 sm:p-10 shadow-xl">
        <header className="mb-10 pb-8 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span key={tag} className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
            {article.title}
          </h1>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm gap-4 font-mono">
            <span className="flex items-center gap-2">
              <Calendar size={14} />
              {new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <MarkdownRenderer content={article.content} />
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => navigate(`/chat?articleId=${article.id}`)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95 font-bold"
      >
        <MessageSquare size={20} />
        <span className="hidden sm:inline">对此文章提问</span>
      </button>
    </article>
  );
};