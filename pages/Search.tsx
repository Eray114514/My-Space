import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Article, Project } from '../types';
import { Search, FileText, Layout, ExternalLink, Globe } from 'lucide-react';
import * as Icons from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedArticles, fetchedProjects] = await Promise.all([
          StorageService.getArticles(),
          StorageService.getProjects()
        ]);
        setArticles(fetchedArticles.filter(a => a.isPublished));
        setProjects(fetchedProjects);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { articles: [], projects: [] };
    const lowerQ = query.toLowerCase();

    const filteredProjects = projects.filter(p =>
      p.title.toLowerCase().includes(lowerQ) ||
      p.description.toLowerCase().includes(lowerQ) ||
      p.url.toLowerCase().includes(lowerQ)
    );

    const filteredArticles = articles.filter(a =>
      a.title.toLowerCase().includes(lowerQ) ||
      a.summary.toLowerCase().includes(lowerQ) ||
      a.tags.some(t => t.toLowerCase().includes(lowerQ))
    );

    return { articles: filteredArticles, projects: filteredProjects };
  }, [query, articles, projects]);

  const renderProjectIcon = (project: Project) => {
    if (project.iconType === 'generated' && project.customSvg) {
      return <div className="w-5 h-5 text-indigo-600 dark:text-indigo-400 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
    }
    if (project.iconType === 'auto' && project.imageBase64) {
      return <img src={project.imageBase64} alt={project.title} className="w-5 h-5 rounded object-cover" />;
    }
    const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Globe;
    return <IconComp size={20} className="text-indigo-600 dark:text-indigo-400" />;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500 min-h-[60vh]">
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={24} />
        <input
          autoFocus
          type="text"
          placeholder="搜索文章、网站..."
          className="w-full pl-16 pr-6 py-5 liquid-glass-high rounded-full shadow-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-xl transition-all text-gray-900 dark:text-white placeholder-gray-400/70"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {!query && (
        <div className="text-center text-gray-400 dark:text-neutral-600 mt-20 flex flex-col items-center gap-4">
          <div className="p-6 rounded-full bg-white/30 dark:bg-white/5 backdrop-blur-md">
            <Search size={48} className="opacity-30" />
          </div>
          <p className="font-light tracking-wide">输入关键词开始探索</p>
        </div>
      )}

      {query && (results.articles.length === 0 && results.projects.length === 0) && (
        <div className="text-center text-gray-500 dark:text-neutral-500 mt-20">
          <p>未找到与 "{query}" 相关的内容</p>
        </div>
      )}

      <div className="space-y-12">
        {results.projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white px-2">
              <Layout size={20} className="text-indigo-500" /> 网站导航
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.projects.map(project => (
                <a
                  key={project.id}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 liquid-glass rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 hover:border-indigo-200/50 transition-all hover:shadow-md group"
                >
                  <div className="p-2.5 bg-white/50 dark:bg-white/5 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors backdrop-blur-sm border border-white/20">
                    {renderProjectIcon(project)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        {results.articles.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white px-2">
              <FileText size={20} className="text-indigo-500" /> 文章
            </h2>
            <div className="space-y-4">
              {results.articles.map(article => (
                <Link
                  key={article.id}
                  to={`/blog/${article.id}`}
                  className="block p-6 liquid-glass rounded-2xl hover:bg-white/60 dark:hover:bg-white/10 hover:border-indigo-200/50 transition-all hover:shadow-md group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                    <span className="text-xs text-gray-400 font-mono py-1 px-2 bg-black/5 dark:bg-white/5 rounded-md">{new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{article.summary}</p>
                  <div className="flex gap-2 mt-4">
                    {article.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-500 dark:text-gray-400 rounded-md border border-white/20">#{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};