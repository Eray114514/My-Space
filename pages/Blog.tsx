import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Article } from '../types';

export const Blog: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

    const tags = useMemo(() => {
        const map = new Map<string, number>();
        articles.forEach(a => {
            if (a.tags) {
                a.tags.forEach(t => map.set(t, (map.get(t) || 0) + 1));
            }
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [articles]);

    const filteredArticles = useMemo(() => {
        if (!selectedTag) return articles;
        return articles.filter(a => a.tags && a.tags.includes(selectedTag));
    }, [articles, selectedTag]);

    if (isLoading) return <div className="py-20 text-center text-gray-400">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="text-center space-y-4 pt-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">文章归档</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-light">记录生活，分享技术，沉淀思考。</p>
            </header>

            {/* Tag Filter - Glass Pills */}
            {tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${selectedTag === null
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-lg'
                                : 'bg-white/40 dark:bg-white/5 border-white/20 text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10'
                            }`}
                    >
                        全部 ({articles.length})
                    </button>
                    {tags.map(([tag, count]) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${selectedTag === tag
                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                                    : 'bg-white/40 dark:bg-white/5 border-white/20 text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                        >
                            {tag} <span className="opacity-70 ml-1 text-[10px]">{count}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-gray-300/50 before:to-transparent dark:before:via-white/10">
                {filteredArticles.map((article) => (
                    <div key={article.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                        {/* Dot on the timeline - Glass Bead */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/50 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-gray-500 z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                        </div>

                        {/* Card Content - Liquid Glass */}
                        <Link
                            to={`/blog/${article.id}`}
                            className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] liquid-glass p-6 rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 hover:border-indigo-200/40 dark:hover:border-indigo-500/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <time className="font-mono text-xs text-gray-400 font-medium">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</time>
                                <div className="flex gap-2">
                                    {article.tags.map(tag => (
                                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 ${selectedTag === tag ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100/50 dark:bg-white/5 text-gray-500'}`}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{article.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed opacity-90">
                                {article.summary}
                            </p>
                        </Link>
                    </div>
                ))}
                {filteredArticles.length === 0 && (
                    <div className="text-center py-12 liquid-glass rounded-2xl text-gray-400">
                        {selectedTag ? `标签 "${selectedTag}" 下暂无文章` : '暂无公开文章'}
                    </div>
                )}
            </div>
        </div>
    );
};