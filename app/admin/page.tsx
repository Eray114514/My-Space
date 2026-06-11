"use client";
import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { AIModelKey } from '../../services/ai';
import { confirmToast } from '../../utils/toast';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Globe, Settings, Layout } from 'lucide-react';
import { Article, Project } from '../../types';
import * as Icons from 'lucide-react';
import { ModelSelector, ProviderManager, SvgModelSelector } from './components/ModelSelector';
import { ProjectEditor } from './components/ProjectEditor';
import { ArticleEditor } from './components/ArticleEditor';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'articles' | 'projects' | 'settings'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [generalAiProvider, setGeneralAiProvider] = useState<AIModelKey>('');
  const [svgAiProvider, setSvgAiProvider] = useState<AIModelKey>('');

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      await StorageService.initDB();
      setArticles(await StorageService.getArticles());
      setProjects(await StorageService.getProjects());
      setGeneralAiProvider(await StorageService.getGeneralAIModel());
      setSvgAiProvider(await StorageService.getSvgAIModel());
    } catch (e) {
      console.warn("Admin data unavailable", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGeneralProviderChange = async (model: AIModelKey) => {
    setGeneralAiProvider(model);
    await StorageService.saveGeneralAIModel(model);
  };

  const handleSvgProviderChange = async (model: AIModelKey) => {
    setSvgAiProvider(model);
    await StorageService.saveSvgAIModel(model);
  };

  const handleSaveArticle = async (article: Article) => {
    try {
      await StorageService.saveArticle(article);
      await loadData();
      setIsEditingArticle(false);
      setCurrentArticle(undefined);
      toast.success('文章保存成功');
    } catch (e) { toast.error('保存失败'); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (await confirmToast('确定要删除这篇文章吗？')) {
      try { await StorageService.deleteArticle(id); await loadData(); toast.success('文章已删除'); } catch (e) { toast.error('删除失败'); }
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      await StorageService.saveProject(project);
      await loadData();
      setIsEditingProject(false);
      setCurrentProject(undefined);
      toast.success('项目保存成功');
    } catch (e) { toast.error('保存失败'); }
  };

  const handleDeleteProject = async (id: string) => {
    if (await confirmToast('确定要删除这个项目吗？')) {
      try { await StorageService.deleteProject(id); await loadData(); toast.success('项目已删除'); } catch (e) { toast.error('删除失败'); }
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 font-light tracking-wider animate-pulse">正在连接数据核心...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.055em] text-[var(--blog-fg)]">控制台</h1>
          <p className="text-[var(--blog-muted)] mt-2">管理你的博客内容</p>
        </div>

        {/* Glass Tabs */}
        <div className="glass-surface flex p-1.5 rounded-full">
          <button onClick={() => setTab('articles')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'articles' ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]'}`}>文章</button>
          <button onClick={() => setTab('projects')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'projects' ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]'}`}>导航</button>
          <button onClick={() => setTab('settings')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${tab === 'settings' ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]'}`}><Settings size={16} /> 设置</button>
        </div>
      </div>

      {/* Content Area */}
      {tab === 'articles' && (
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Layout size={16} /> 文章列表 <span className="text-[10px] bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-medium text-gray-500">{articles.length}</span></h3>
            <button onClick={() => { setCurrentArticle(undefined); setIsEditingArticle(true); }} className="blog-button-primary px-4 py-2 text-xs"><Plus size={14} /> 写文章</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {articles.map(article => (
              <div key={article.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${article.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{article.title}</h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${article.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{article.isPublished ? '已发布' : '草稿'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-mono">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <div className="flex gap-1">
                      {article.tags.map(t => <span key={t} className="text-[10px] bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-500">#{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteArticle(article.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Globe size={16} /> 导航链接 <span className="text-[10px] bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-medium text-gray-500">{projects.length}</span></h3>
            <button onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }} className="blog-button-primary px-4 py-2 text-xs"><Plus size={14} /> 添加链接</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
            {projects.map(project => {
              let IconDisplay: React.ReactNode = <Globe size={20} className="text-gray-400" />;
              if (project.iconType === 'generated' && project.customSvg) {
                IconDisplay = <div className="w-6 h-6 text-[var(--blog-fg)]" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
              } else if (project.iconType === 'auto' && project.imageBase64) {
                IconDisplay = <img src={project.imageBase64} alt="icon" className="w-6 h-6 object-cover rounded" />;
              } else {
                const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                IconDisplay = <IconComp size={20} className="text-gray-400" />;
              }
              return (
                <div key={project.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5">{IconDisplay}</div>
                    <div className="truncate flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">{project.title}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{project.url}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => { setCurrentProject(project); setIsEditingProject(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => handleDeleteProject(project.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <ProviderManager />
          <SvgModelSelector />
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings size={16} /> 系统设置</h3>
            </div>
            <div className="p-6 max-w-3xl">
              <ModelSelector
                label="全局 AI 写作模型"
                description="用于文章摘要生成、自动打标签等文本处理任务。建议选择速度较快的模型。"
                value={generalAiProvider}
                onChange={handleGeneralProviderChange}
              />
            </div>
          </div>
        </div>
      )}
      {isEditingProject && <ProjectEditor project={currentProject} onSave={handleSaveProject} onCancel={() => setIsEditingProject(false)} defaultAiProvider={generalAiProvider} defaultSvgProvider={svgAiProvider} />}
      {isEditingArticle && <ArticleEditor article={currentArticle} onSave={handleSaveArticle} onCancel={() => setIsEditingArticle(false)} defaultAIProvider={generalAiProvider} />}
    </div>
  );
};
