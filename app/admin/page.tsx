"use client";
import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { AIModelKey } from '../../services/ai';
import { confirmToast } from '../../utils/toast';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Globe, Settings, Layout } from 'lucide-react';
import { Article, Project } from '../../types';
import * as Icons from 'lucide-react';
import { LiquidGlass } from '../../components/LiquidGlass';
import { ModelSelector } from './components/ModelSelector';
import { ProjectEditor } from './components/ProjectEditor';
import { ArticleEditor } from './components/ArticleEditor';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'articles' | 'projects' | 'settings'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [generalAiProvider, setGeneralAiProvider] = useState<AIModelKey>('deepseek-chat');
  const [svgAiProvider, setSvgAiProvider] = useState<AIModelKey>('deepseek-reasoner');

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
        <LiquidGlass variant="panel" className="glass-panel overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-[var(--blog-line)] flex justify-between items-center">
            <h3 className="font-black text-lg text-[var(--blog-fg)] flex items-center gap-2"><Layout size={20} /> 文章列表 <span className="blog-tag px-2 py-0.5">{articles.length}</span></h3>
            <button onClick={() => { setCurrentArticle(undefined); setIsEditingArticle(true); }} className="blog-button-primary px-5 py-2.5 text-sm"><Plus size={18} /> 写文章</button>
          </div>
          <div className="divide-y divide-[var(--blog-line)]">
            {articles.map(article => (
              <div key={article.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--blog-fg-soft)] transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${article.isPublished ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></span>
                    <h4 className="font-black text-[var(--blog-fg)] truncate text-lg">{article.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${article.isPublished ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{article.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--blog-line)]"></span>
                    <div className="flex gap-1">
                      {article.tags.map(t => <span key={t} className="blog-tag px-1.5 py-0.5">#{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-4 sm:group-hover:translate-x-0">
                  <button onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }} className="blog-control h-10 w-10 p-0"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteArticle(article.id)} className="blog-control h-10 w-10 p-0 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </LiquidGlass>
      )}

      {tab === 'projects' && (
        <LiquidGlass variant="panel" className="glass-panel overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-[var(--blog-line)] flex justify-between items-center">
            <h3 className="font-black text-lg text-[var(--blog-fg)] flex items-center gap-2"><Globe size={20} /> 导航链接 <span className="blog-tag px-2 py-0.5">{projects.length}</span></h3>
            <button onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }} className="blog-button-primary px-5 py-2.5 text-sm"><Plus size={18} /> 添加链接</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {projects.map(project => {
              let IconDisplay: React.ReactNode = <Globe size={24} />;
              if (project.iconType === 'generated' && project.customSvg) {
                IconDisplay = <div className="w-7 h-7 text-[var(--blog-fg)]" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
              } else if (project.iconType === 'auto' && project.imageBase64) {
                IconDisplay = <img src={project.imageBase64} alt="icon" className="w-7 h-7 object-cover rounded-md shadow-sm" />;
              } else {
                const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                IconDisplay = <IconComp size={24} />;
              }
              return (
                <div key={project.id} className="glass-card flex items-center justify-between p-4 border border-[var(--blog-line)] hover:bg-[var(--blog-fg-soft)] transition-all group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 rounded-xl bg-[var(--blog-fg-soft)] flex items-center justify-center text-[var(--blog-fg)] shadow-sm shrink-0 border border-[var(--blog-line)] p-2">{IconDisplay}</div>
                    <div className="truncate flex-1">
                      <h4 className="font-black text-[var(--blog-fg)] truncate text-lg">{project.title}</h4>
                      <p className="text-xs text-[var(--blog-muted)] truncate mt-1 opacity-80">{project.url}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-2 sm:group-hover:translate-x-0 gap-2">
                    <button onClick={() => { setCurrentProject(project); setIsEditingProject(true); }} className="blog-control h-9 w-9 p-0"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteProject(project.id)} className="blog-control h-9 w-9 p-0 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </LiquidGlass>
      )}

      {tab === 'settings' && (
        <LiquidGlass variant="panel" className="glass-panel overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-[var(--blog-line)]"><h3 className="font-black text-lg text-[var(--blog-fg)] flex items-center gap-2"><Settings size={20} /> 系统设置</h3></div>
          <div className="p-8 max-w-3xl space-y-10">
            <ModelSelector
              label="全局 AI 写作模型"
              description="用于文章摘要生成、自动打标签等文本处理任务。建议选择速度较快的模型。"
              value={generalAiProvider}
              onChange={handleGeneralProviderChange}
            />
            <ModelSelector
              label="图标绘制 AI 模型"
              description="专用于生成 SVG 图标代码。建议选择 DeepSeek Reasoner (R1) 或逻辑能力较强的模型以获得最佳绘图效果。"
              value={svgAiProvider}
              onChange={handleSvgProviderChange}
            />
          </div>
        </LiquidGlass>
      )}
      {isEditingProject && <ProjectEditor project={currentProject} onSave={handleSaveProject} onCancel={() => setIsEditingProject(false)} defaultAiProvider={generalAiProvider} defaultSvgProvider={svgAiProvider} />}
      {isEditingArticle && <ArticleEditor article={currentArticle} onSave={handleSaveArticle} onCancel={() => setIsEditingArticle(false)} defaultAIProvider={generalAiProvider} />}
    </div>
  );
};
