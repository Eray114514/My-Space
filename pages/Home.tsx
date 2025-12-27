import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Globe, Layout, Server, Code, Hash } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Article, Project } from '../types';
import * as Icons from 'lucide-react';

export const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const allProjects = await StorageService.getProjects();
            setProjects(allProjects);

            const allArticles = await StorageService.getArticles();
            const published = allArticles
                .filter(a => a.isPublished)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3);
            setRecentArticles(published);
        } catch (e) {
            console.error("Failed to load home data", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return '';
    }
  };

  const renderIcon = (project: Project) => {
    if (project.iconType === 'auto') {
      return (
        <img 
          src={getFaviconUrl(project.url)} 
          alt={project.title} 
          className="w-8 h-8 rounded object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    
    // Preset Icon
    const IconComponent = (Icons as any)[project.presetIcon || 'Globe'];
    return IconComponent ? <IconComponent size={32} className="text-indigo-600 dark:text-indigo-400" /> : <Globe size={32} />;
  };

  const scrollToProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
      return <div className="min-h-[50vh] flex items-center justify-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="space-y-6 py-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          你好，我是 <span className="text-indigo-600 dark:text-indigo-400">Eray</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
          这里是我的数字花园。我热爱极简设计与高效代码，在这里分享我的思考，并展示我搭建的各种有趣服务。
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium transition-transform hover:scale-105 active:scale-95">
                阅读文章
                <ArrowRight size={16} />
            </Link>
            <button 
              onClick={scrollToProjects}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-full font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
                查看导航
            </button>
        </div>
      </section>

      {/* Projects Navigation */}
      <section id="projects" className="space-y-8">
        <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layout className="text-indigo-500" />
                网站导航
            </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a 
              key={project.id}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-6 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                   {renderIcon(project)}
                </div>
                <ExternalLink size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{project.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
            </a>
          ))}
          {projects.length === 0 && (
             <div className="col-span-full py-10 text-center text-gray-400 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                 暂无导航链接 (或未连接数据库)
             </div>
          )}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="text-indigo-500" />
                最近更新
            </h2>
            <Link to="/blog" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">查看全部</Link>
        </div>

        <div className="space-y-6">
          {recentArticles.map(article => (
            <article key={article.id} className="group relative flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-baseline transition-all">
                <div className="sm:w-32 flex-shrink-0 text-sm text-gray-400 font-mono">
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="flex-1 space-y-2">
                    <Link to={`/blog/${article.id}`} className="block">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {article.title}
                            </h3>
                            {/* Tags display */}
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {article.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Link>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                        {article.summary}
                    </p>
                </div>
            </article>
          ))}
           {recentArticles.length === 0 && (
             <div className="py-10 text-center text-gray-400">
                 暂无文章
             </div>
          )}
        </div>
      </section>

    </div>
  );
};