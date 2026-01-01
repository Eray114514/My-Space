import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Globe, Layout, Code, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Article, Project } from '../types';
import * as Icons from 'lucide-react';

export const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get username from env
  const env = (import.meta as any).env;
  const adminName = env.ADMIN_USERNAME || 'Eray';

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
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`;
    } catch { return ''; }
  };

  const renderIcon = (project: Project) => {
    if (project.iconType === 'generated' && project.customSvg) {
      return (
        <div className="w-10 h-10 text-indigo-600 dark:text-indigo-300 [&>svg]:w-full [&>svg]:h-full drop-shadow-sm" dangerouslySetInnerHTML={{ __html: project.customSvg }} />
      );
    }
    if (project.iconType === 'auto' && project.imageBase64) {
      return <img src={project.imageBase64} alt={project.title} className="w-10 h-10 rounded-xl object-cover shadow-sm" />;
    }
    if (project.iconType === 'auto') {
      return (
        <img
          src={getFaviconUrl(project.url)}
          alt={project.title}
          className="w-10 h-10 rounded-xl object-cover shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    const IconComponent = (Icons as any)[project.presetIcon || 'Globe'];
    return IconComponent ? <IconComponent size={40} className="text-indigo-600 dark:text-indigo-300 drop-shadow-sm" /> : <Globe size={40} />;
  };

  const scrollToProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('projects');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center text-gray-400 font-light tracking-widest uppercase text-sm">Loading...</div>;

  return (
    <div className="space-y-24 animate-in fade-in duration-700">

      {/* Hero Section */}
      <section className="space-y-8 py-10 relative">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10 backdrop-blur-md text-xs font-medium text-indigo-600 dark:text-indigo-300 shadow-sm">
            <Sparkles size={12} />
            <span>Welcome to {new Date().getFullYear()}</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
            你好，我是 <br />
            {/* Removed animate-pulse-slow */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{adminName}</span>
          </h1>
        </div>

        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed font-light">
          这里是我的数字花园。在液态流动的光影中，分享设计、代码与思考。
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/blog" className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-900/20 dark:shadow-white/20">
            阅读文章
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={scrollToProjects}
            className="inline-flex items-center gap-2 px-8 py-3.5 liquid-glass rounded-full text-gray-900 dark:text-white font-semibold hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          >
            查看作品
          </button>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="space-y-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400"><Layout size={24} /></div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">精选导航</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a
              key={project.id}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col p-6 liquid-glass rounded-[2rem] hover:bg-white/60 dark:hover:bg-white/10 hover:border-white/50 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/40 dark:border-white/10 backdrop-blur-md">
                  {renderIcon(project)}
                  {project.iconType === 'auto' && <Globe size={40} className="text-gray-300 hidden" />}
                </div>
                <div className="p-2 rounded-full bg-transparent group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <ExternalLink size={20} className="text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{project.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            </a>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 liquid-glass rounded-3xl">
              暂无导航链接
            </div>
          )}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="space-y-10">
        <div className="flex items-baseline justify-between border-b border-gray-200/50 dark:border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400"><Code size={24} /></div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">最近更新</h2>
          </div>
          <Link to="/blog" className="px-4 py-2 rounded-full text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">查看全部</Link>
        </div>

        <div className="space-y-4">
          {recentArticles.map(article => (
            <Link key={article.id} to={`/blog/${article.id}`} className="block group">
              <article className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center p-6 rounded-3xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/5 border border-transparent hover:border-white/30 dark:hover:border-white/10">
                <div className="sm:w-32 flex-shrink-0 flex flex-col gap-1">
                  <span className="text-3xl font-bold text-gray-200 dark:text-neutral-800 group-hover:text-indigo-500/30 transition-colors font-mono">
                    {new Date(article.createdAt).getDate().toString().padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {article.title}
                    </h3>
                    {article.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 pr-4">
                    {article.summary}
                  </p>
                </div>

                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-neutral-800 text-gray-300 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0">
                  <ArrowRight size={18} />
                </div>
              </article>
            </Link>
          ))}
          {recentArticles.length === 0 && (
            <div className="py-10 text-center text-gray-400">暂无文章</div>
          )}
        </div>
      </section>

    </div>
  );
};