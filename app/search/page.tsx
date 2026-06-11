"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '../../services/storage';
import { Article, Project } from '../../types';
import { FileText, Layout, ExternalLink, Globe, Search as SearchIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { LiquidGlass } from '../../components/LiquidGlass';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedArticles, fetchedProjects] = await Promise.all([
          StorageService.getPublishedArticlesLight(),
          StorageService.getProjects()
        ]);
        setArticles(fetchedArticles);
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
        return <div className="w-5 h-5 text-[var(--blog-fg)] [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
      }
      if (project.iconType === 'auto' && project.imageBase64) {
        return <img src={project.imageBase64} alt={project.title} className="w-5 h-5 rounded object-cover" />;
      }
       const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Globe;
       return <IconComp size={20} className="text-[var(--blog-fg)]" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="search-page max-w-4xl mx-auto py-4 min-h-[60vh]">
      
      {!query && (
        <div className="text-center text-[var(--blog-muted)] mt-20 flex flex-col items-center gap-4">
            <LiquidGlass variant="card" className="h-24 w-24 rounded-full" innerClassName="flex items-center justify-center">
                 <SearchIcon size={48} className="opacity-30" />
            </LiquidGlass>
            <p className="font-semibold tracking-wide">请在顶部搜索框输入关键词</p>
        </div>
      )}

      {query && (results.articles.length === 0 && results.projects.length === 0) && (
        <div className="text-center text-[var(--blog-muted)] mt-20">
            <p>未找到与 "{query}" 相关的内容</p>
        </div>
      )}

      <div className="space-y-12 mt-4">
        {results.projects.length > 0 && (
          <section>
            <h2 className="text-xl font-black tracking-[-0.035em] mb-6 flex items-center gap-2 text-[var(--blog-fg)] px-2">
                <Layout size={20} /> 网站导航
            </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.projects.map(project => (
                <motion.div key={project.id} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button
                      type="button"
                      className="search-result-card content-surface flex w-full items-center gap-4 p-4 text-left transition-transform hover:-translate-y-1 cursor-pointer group"
                      onClick={() => window.open(project.url, '_blank')}
                  >
                      <div className="p-2.5 rounded-xl bg-[var(--blog-fg-soft)] border border-[var(--blog-line)]">
                          {renderProjectIcon(project)}
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="font-black text-[var(--blog-fg)] truncate">{project.title}</h3>
                          <p className="text-xs text-[var(--blog-muted)] truncate">{project.description}</p>
                      </div>
                      <ExternalLink size={14} className="text-[var(--blog-muted)] group-hover:text-[var(--blog-fg)] transition-colors" />
                 </button>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {results.articles.length > 0 && (
           <section>
            <h2 className="text-xl font-black tracking-[-0.035em] mb-6 flex items-center gap-2 text-[var(--blog-fg)] px-2">
                <FileText size={20} /> 文章
            </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                {results.articles.map(article => (
                    <motion.div key={article.id} variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="block group">
                        <Link href={`/blog/${article.id}`} className="block h-full">
                            <div className="search-result-card content-surface p-6 transition-transform hover:-translate-y-1 cursor-pointer">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="text-lg font-black text-[var(--blog-fg)]">{article.title}</h3>
                                     <span className="text-xs text-[var(--blog-muted)] font-mono py-1 px-2 rounded-full bg-[var(--blog-fg-soft)]">{new Date(article.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-sm text-[var(--blog-muted)] line-clamp-2 leading-relaxed">{article.summary}</p>
                                 <div className="flex gap-2 mt-4">
                                     {article.tags.map(t => (
                                         <span key={t} className="blog-tag px-2.5 py-1">#{t}</span>
                                     ))}
                                 </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
           </section>
        )}
      </div>
    </div>
  );
};export default function SearchPage() { return <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}><SearchContent /></Suspense>; }
