import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Article } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

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
    <article className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500">
      <Link to="/blog" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-1" />
        返回列表
      </Link>
      
      <header className="mb-10 pb-8 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex flex-wrap gap-2 mb-4">
             {article.tags.map(tag => (
                <span key={tag} className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                   {tag}
                </span>
             ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
          {article.title}
        </h1>
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm gap-4">
           <span className="flex items-center gap-1">
             <Calendar size={14} />
             {new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
           </span>
        </div>
      </header>

      <MarkdownRenderer content={article.content} />
    </article>
  );
};