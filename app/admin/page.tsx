"use client";
import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { AIModelKey } from '../../services/ai';
import { confirmToast } from '../../utils/toast';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Globe, Settings, Layout, ExternalLink, Wand2, Image as ImageIcon, Box as BoxIcon } from 'lucide-react';
import { Article, Project } from '../../types';
import * as Icons from 'lucide-react';
import { ModelSelector, ProviderManager } from './components/ModelSelector';
import { StoredModel } from '../../services/ai';
import { LiquidGlass } from '../../components/LiquidGlass';
import { ProjectEditor } from './components/ProjectEditor';
import { ArticleEditor } from './components/ArticleEditor';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'articles' | 'projects' | 'settings'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [generalAiProvider, setGeneralAiProvider] = useState<AIModelKey>('');
  const [svgAiProvider, setSvgAiProvider] = useState<AIModelKey>('');
  const [aiModels, setAiModels] = useState<StoredModel[]>([]);

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      await StorageService.initDB();
      const [articlesData, projectsData, generalModel, svgModel, modelsData] = await Promise.all([
        StorageService.getArticles(),
        StorageService.getProjects(),
        StorageService.getGeneralAIModel(),
        StorageService.getSvgAIModel(),
        StorageService.getAIModels()
      ]);
      setArticles(articlesData);
      setProjects(projectsData);
      setGeneralAiProvider(generalModel);
      setSvgAiProvider(svgModel);

      // One-time migration from legacy localStorage to DB
      let finalModels = modelsData;
      if (modelsData.length === 0 && typeof window !== 'undefined') {
        try {
          const legacy = localStorage.getItem('admin_custom_models');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await StorageService.saveAIModels(parsed);
              finalModels = parsed;
              localStorage.removeItem('admin_custom_models');
              toast.success('已将本地模型配置迁移到数据库');
            }
          }
        } catch { /* ignore */ }
      }
      setAiModels(finalModels);
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

  const handleAIModelsChange = async (models: StoredModel[]) => {
    setAiModels(models);
    await StorageService.saveAIModels(models);
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

  const handleTogglePublish = async (article: Article) => {
    try {
      await StorageService.saveArticle({ ...article, isPublished: !article.isPublished });
      await loadData();
      toast.success(article.isPublished ? '已转为草稿' : '已发布');
    } catch (e) { toast.error('操作失败'); }
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
              <div key={article.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--blog-fg-soft)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${article.isPublished ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></span>
                    <h4 className="font-black text-[var(--blog-fg)] truncate text-lg">{article.title}</h4>
                    <button onClick={() => handleTogglePublish(article)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider cursor-pointer transition-colors ${article.isPublished ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200/50' : 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200/50'}`}
                      title={article.isPublished ? '点击转为草稿' : '点击发布'}>
                      {article.isPublished ? '已发布' : '草稿'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--blog-line)]"></span>
                    <div className="flex gap-1">
                      {article.tags.map(t => <span key={t} className="blog-tag px-1.5 py-0.5">#{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }} className="p-2 rounded-lg hover:bg-[var(--blog-line)] text-[var(--blog-muted)] hover:text-[var(--blog-fg)] transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteArticle(article.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--blog-muted)] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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
          <div className="divide-y divide-[var(--blog-line)]">
            {projects.map(project => {
              let IconDisplay: React.ReactNode = <Globe size={22} />;
              let TypeIcon = BoxIcon;
              let typeLabel = '预设';
              if (project.iconType === 'generated' && project.customSvg) {
                IconDisplay = <div className="w-6 h-6 text-[var(--blog-fg)]" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
                TypeIcon = Wand2;
                typeLabel = 'AI 设计';
              } else if (project.iconType === 'auto' && project.imageBase64) {
                IconDisplay = <img src={project.imageBase64} alt="icon" className="w-6 h-6 object-cover rounded-md" />;
                TypeIcon = ImageIcon;
                typeLabel = '自动抓取';
              } else {
                const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                IconDisplay = <IconComp size={22} />;
              }
              return (
                <div key={project.id} className="group flex items-center gap-4 p-4 sm:p-5 hover:bg-[var(--blog-fg-soft)] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--blog-bg)] border border-[var(--blog-line)] flex items-center justify-center text-[var(--blog-fg)] shadow-sm shrink-0 transition-transform group-hover:scale-105 group-hover:border-[var(--blog-fg)]/30">
                    {IconDisplay}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-black text-[var(--blog-fg)] truncate text-base">{project.title}</h4>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--blog-fg-soft)] text-[var(--blog-muted)]">
                        <TypeIcon size={10} /> {typeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--blog-muted)] truncate">{project.description || project.url}</p>
                    <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[var(--blog-muted)] hover:text-[var(--blog-fg)] transition-colors mt-1 group/link">
                      <span className="truncate max-w-[200px] sm:max-w-sm">{project.url}</span>
                      <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => { setCurrentProject(project); setIsEditingProject(true); }} className="p-2 rounded-xl hover:bg-[var(--blog-line)] text-[var(--blog-muted)] hover:text-[var(--blog-fg)] transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteProject(project.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--blog-muted)] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
            {projects.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--blog-fg-soft)] flex items-center justify-center mx-auto mb-4 text-[var(--blog-muted)]">
                  <Globe size={28} />
                </div>
                <h4 className="font-bold text-[var(--blog-fg)] mb-1">还没有导航链接</h4>
                <p className="text-sm text-[var(--blog-muted)] mb-4">添加你的博客、社交主页或常用工具</p>
                <button onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }} className="blog-button-primary px-5 py-2 text-sm"><Plus size={16} /> 添加第一个链接</button>
              </div>
            )}
          </div>
        </LiquidGlass>
      )}

      {tab === 'settings' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <ProviderManager models={aiModels} onChange={handleAIModelsChange} />
          <LiquidGlass variant="panel" className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-[var(--blog-line)]">
              <h3 className="font-black text-lg text-[var(--blog-fg)] flex items-center gap-2"><Settings size={20} /> 系统设置</h3>
            </div>
            <div className="p-8 max-w-3xl space-y-10">
              <ModelSelector
                label="全局 AI 写作模型"
                description="用于文章摘要生成、自动打标签、图标推荐等文本处理任务。建议选择速度较快的模型。"
                value={generalAiProvider}
                onChange={handleGeneralProviderChange}
                models={aiModels}
              />
              <div className="border-t border-[var(--blog-line)] pt-10">
                <ModelSelector
                  label="SVG 绘图模型"
                  description="用于在项目导航中生成自定义 SVG 图标。建议选择遵循指令能力较强的模型。"
                  value={svgAiProvider}
                  onChange={handleSvgProviderChange}
                  models={aiModels}
                />
              </div>
            </div>
          </LiquidGlass>
        </div>
      )}
      {isEditingProject && <ProjectEditor project={currentProject} onSave={handleSaveProject} onCancel={() => setIsEditingProject(false)} defaultAiProvider={generalAiProvider || aiModels[0]?.key} defaultSvgProvider={svgAiProvider || aiModels[0]?.key} />}
      {isEditingArticle && <ArticleEditor article={currentArticle} onSave={handleSaveArticle} onCancel={() => setIsEditingArticle(false)} defaultAIProvider={generalAiProvider || aiModels[0]?.key} />}
    </div>
  );
};
