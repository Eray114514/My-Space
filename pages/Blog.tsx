import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Article } from '../types';

export const Blog: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
        try {
            const all = await StorageService.getArticles();
            const published = all
                .filter(a => a.isPublished)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setArticles(published);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchArticles();
  }, []);

  if (isLoading) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center space-y-4 mb-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">文章归档</h1>
        <p className="text-gray-500 dark:text-gray-400">记录生活，分享技术，沉淀思考。</p>
      </header>

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent dark:before:via-neutral-800">
        {articles.map((article) => (
          <div key={article.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            {/* Dot on the timeline */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-neutral-900 bg-gray-100 dark:bg-neutral-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-gray-500">
               <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            </div>

            {/* Card Content */}
            <Link 
                to={`/blog/${article.id}`}
                className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
            >
                <div className="flex items-center justify-between mb-2">
                    <time className="font-mono text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</time>
                    <div className="flex gap-2">
                         {article.tags.map(tag => (
                             <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 rounded-md">#{tag}</span>
                         ))}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {article.summary}
                </p>
            </Link>
          </div>
        ))}
        {articles.length === 0 && (
             <div className="text-center py-10 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
                 暂无公开文章 (或未连接数据库)
             </div>
        )}
      </div>
    </div>
  );
};