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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          autoFocus
          type="text"
          placeholder="搜索文章、网站..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-all text-gray-900 dark:text-white placeholder-gray-400"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {!query && (
        <div className="text-center text-gray-400 dark:text-neutral-600 mt-20">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>输入关键词开始搜索</p>
        </div>
      )}

      {query && (results.articles.length === 0 && results.projects.length === 0) && (
        <div className="text-center text-gray-500 dark:text-neutral-500 mt-20">
            <p>未找到与 "{query}" 相关的内容</p>
        </div>
      )}

      <div className="space-y-10">
        {results.projects.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Layout size={18} className="text-indigo-500" /> 网站导航
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.projects.map(project => (
                <a 
                    key={project.id}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:shadow-sm group"
                >
                   <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                      {renderProjectIcon(project)}
                   </div>
                   <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.title}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
                   </div>
                   <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-500" />
                </a>
              ))}
            </div>
          </section>
        )}

        {results.articles.length > 0 && (
           <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText size={18} className="text-indigo-500" /> 文章
            </h2>
            <div className="space-y-4">
                {results.articles.map(article => (
                    <Link 
                        key={article.id}
                        to={`/blog/${article.id}`}
                        className="block p-5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:shadow-sm group"
                    >
                         <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                             <span className="text-xs text-gray-400 font-mono">{new Date(article.createdAt).toLocaleDateString()}</span>
                         </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{article.summary}</p>
                         <div className="flex gap-2 mt-3">
                             {article.tags.map(t => (
                                 <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 rounded border border-gray-100 dark:border-neutral-700">#{t}</span>
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