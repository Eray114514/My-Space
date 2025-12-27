import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { AIService, AIProvider } from '../../services/ai';
import { Plus, Layout, Trash2, Edit2, Save, Globe, Search, X, Settings, Database, Sparkles, Loader2, Zap, BrainCircuit } from 'lucide-react';
import { Article, Project } from '../../types';
import * as Icons from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

// Curated list of icons suitable for personal portfolio/tech stack
const CURATED_ICONS = [
  'Globe', 'Github', 'Twitter', 'Linkedin', 'Youtube', 'Facebook', 'Instagram', 'Twitch', 'Figma', 'Dribbble', 'Codepen', 'Gitlab', 'Bot',
  'Code', 'Terminal', 'Cpu', 'Database', 'Server', 'Cloud', 'Laptop', 'Smartphone', 'Monitor', 'Tablet', 'Watch',
  'Home', 'User', 'Users', 'Mail', 'Send', 'MessageCircle', 'MessageSquare', 'Phone', 'Video', 'Mic', 'Camera', 'Image', 'Music', 'Headphones',
  'File', 'FileText', 'Folder', 'FolderOpen', 'Book', 'BookOpen', 'Bookmark', 'Link', 'ExternalLink', 'Share', 'Download', 'Upload',
  'Settings', 'Tool', 'Wrench', 'PenTool', 'Palette', 'Layers', 'Grid', 'Layout', 'Box', 'Package', 'ShoppingBag', 'CreditCard',
  'Activity', 'Zap', 'Battery', 'Wifi', 'Signal', 'Map', 'MapPin', 'Compass', 'Navigation', 'Flag', 'Target', 'Award', 'Star', 'Heart', 'ThumbsUp',
  'Calendar', 'Clock', 'Timer', 'Sun', 'Moon', 'CloudRain', 'Wind', 'Umbrella', 'Coffee', 'Beer', 'Pizza', 'Gift', 'Shield', 'Lock', 'Unlock', 'Key'
];

// Subcomponents
const IconPicker: React.FC<{
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');
  
  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return CURATED_ICONS;
    return CURATED_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 mt-2">
      {/* Search Bar */}
      <div className="p-2 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2 bg-gray-50 dark:bg-neutral-800/50">
        <Search size={16} className="text-gray-400" />
        <input 
          type="text"
          placeholder="搜索图标 (例如: github, code, home)..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 max-h-48 overflow-y-auto custom-scrollbar">
        {filteredIcons.map(name => {
          const IconComponent = (Icons as any)[name];
          if (!IconComponent) return null;
          
          const isSelected = selectedIcon === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-neutral-800 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 ring-1 ring-indigo-500' : 'text-gray-500 dark:text-gray-400'}`}
              title={name}
            >
              <IconComponent size={20} />
            </button>
          );
        })}
        {filteredIcons.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-gray-400">
            未找到匹配图标
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectEditor: React.FC<{
  project?: Project;
  onSave: (p: Project) => void;
  onCancel: () => void;
}> = ({ project, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Project>(
    project || {
      id: '',
      title: '',
      description: '',
      url: '',
      iconType: 'auto',
      presetIcon: 'Globe',
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...formData, id: formData.id || Date.now().toString() });
    setSaving(false);
  };

  const SelectedIconComp = formData.presetIcon && (Icons as any)[formData.presetIcon] 
    ? (Icons as any)[formData.presetIcon] 
    : Icons.Globe;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 dark:text-white">{project ? '编辑导航' : '新增导航'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
            <input 
              required
              placeholder="网站名称"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接 URL</label>
            <input 
              required
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <textarea 
              placeholder="简短的介绍..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white h-20 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="space-y-3">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标来源</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, iconType: 'auto'})}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      formData.iconType === 'auto' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500' 
                        : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <Globe size={18} />
                    自动获取 (Favicon)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, iconType: 'preset'})}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      formData.iconType === 'preset' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500' 
                        : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <Layout size={18} />
                    选择图标
                  </button>
                </div>
             </div>

             {/* Visual Icon Picker */}
             {formData.iconType === 'preset' && (
               <div className="animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">选择图标</label>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">
                      当前: <SelectedIconComp size={16} className="text-indigo-600" /> 
                      <span className="font-mono">{formData.presetIcon}</span>
                    </div>
                  </div>
                  <IconPicker 
                    selectedIcon={formData.presetIcon || 'Globe'}
                    onSelect={(icon) => setFormData({...formData, presetIcon: icon})}
                  />
               </div>
             )}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">取消</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ArticleEditor: React.FC<{
  article?: Article;
  onSave: (a: Article) => void;
  onCancel: () => void;
  defaultAIProvider: AIProvider;
}> = ({ article, onSave, onCancel, defaultAIProvider }) => {
    const [formData, setFormData] = useState<Article>(
        article || {
          id: '',
          title: '',
          summary: '',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublished: false,
          tags: []
        }
    );
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    
    // AI States
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isAutoTagging, setIsAutoTagging] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title) return alert('请输入标题');
        setSaving(true);
        await onSave({ ...formData, id: formData.id || Date.now().toString(), updatedAt: new Date().toISOString() });
        setSaving(false);
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if(trimmed && !formData.tags.includes(trimmed)) {
            setFormData(prev => ({...prev, tags: [...prev.tags, trimmed]}));
        }
    };

    const handleGenerateSummary = async () => {
        if (!formData.content || formData.content.length < 10) {
            alert("请先输入足够的文章内容以便 AI 生成摘要。");
            return;
        }
        
        setIsGeneratingSummary(true);
        // Clear summary to prepare for streaming
        setFormData(prev => ({ ...prev, summary: '' }));
        
        try {
            await AIService.generateSummaryStream(formData.content, defaultAIProvider, (chunk) => {
                setFormData(prev => ({ ...prev, summary: prev.summary + chunk }));
            });
        } catch (error) {
            alert(`AI 生成失败 (${defaultAIProvider})，请检查对应的 API Key。`);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleAutoTag = async () => {
        if (!formData.title && !formData.content) {
            alert("请先输入标题或内容");
            return;
        }
        setIsAutoTagging(true);
        try {
            const newTags = await AIService.generateTags(formData.title, formData.content, formData.tags, defaultAIProvider);
            if (newTags.length > 0) {
                 setFormData(prev => ({
                     ...prev,
                     tags: [...prev.tags, ...newTags]
                 }));
            } else {
                alert("AI 未能生成有效标签，请重试。");
            }
        } catch (e) {
            alert("生成标签失败");
        } finally {
            setIsAutoTagging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-neutral-950 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-neutral-950">
                 <div className="flex items-center gap-4">
                   <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                     <X size={24} />
                   </button>
                   <h2 className="text-lg font-bold dark:text-white hidden sm:block">{article ? '编辑文章' : '写文章'}</h2>
                   <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                        <Sparkles size={12} className="text-indigo-500" />
                        AI: {defaultAIProvider === 'gemini' ? 'Gemini 3 Flash' : 'DeepSeek Chat'}
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setFormData({...formData, isPublished: !formData.isPublished})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.isPublished ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700'}`}
                     >
                         {formData.isPublished ? '状态：已发布' : '状态：草稿'}
                     </button>
                     <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none transition-colors font-medium disabled:opacity-50">
                        <Save size={18} /> {saving ? '保存中...' : '保存'}
                     </button>
                 </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Editor Side */}
                <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/30 p-4 sm:p-6 overflow-y-auto">
                    <input 
                        placeholder="请输入标题..." 
                        className="text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none mb-4 dark:text-white placeholder-gray-400"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                    
                    {/* Summary Area */}
                    <div className="relative mb-4">
                        <textarea 
                            placeholder="请输入摘要（显示在文章列表）..."
                            className="w-full bg-transparent border-none outline-none resize-none h-auto min-h-[4rem] text-gray-600 dark:text-gray-400 text-sm leading-relaxed pr-24"
                            rows={3}
                            value={formData.summary}
                            onChange={e => setFormData({...formData, summary: e.target.value})}
                        />
                         
                        <div className="absolute right-0 top-0 m-1">
                            <button 
                                type="button"
                                onClick={handleGenerateSummary}
                                disabled={isGeneratingSummary}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shadow-sm border ${
                                    isGeneratingSummary 
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' 
                                    : 'bg-white border-gray-200 text-indigo-600 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-indigo-400 dark:hover:bg-neutral-700'
                                }`}
                                title={`使用 ${defaultAIProvider} 生成摘要`}
                            >
                                {isGeneratingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {isGeneratingSummary ? '生成中...' : 'AI 摘要'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Tags Input */}
                    <div className="flex flex-wrap gap-2 mb-6 items-center">
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-md text-xs border border-gray-200 dark:border-neutral-700 flex items-center gap-1.5 dark:text-gray-300 shadow-sm animate-in zoom-in duration-200">
                                {tag} 
                                <button onClick={() => setFormData({...formData, tags: formData.tags.filter(t => t !== tag)})}>
                                    <X size={12} className="hover:text-red-500 transition-colors" />
                                </button>
                            </span>
                        ))}
                        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-2 rounded-md border border-transparent focus-within:border-indigo-500 transition-colors">
                            <Plus size={14} className="text-gray-400"/>
                            <input 
                                className="bg-transparent text-sm outline-none w-20 py-1 dark:text-white" 
                                placeholder="标签..." 
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        addTag(tagInput);
                                        setTagInput('');
                                    }
                                }}
                            />
                        </div>

                         <button 
                            type="button"
                            onClick={handleAutoTag}
                            disabled={isAutoTagging}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                                isAutoTagging
                                ? 'text-gray-400 cursor-wait'
                                : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
                            }`}
                            title="自动生成标签"
                         >
                             {isAutoTagging ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                             {isAutoTagging ? '生成中' : '自动'}
                         </button>
                    </div>

                    <div className="flex-1 relative group border-t border-gray-200 dark:border-neutral-800 pt-4 mt-2">
                        <textarea 
                            className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed dark:text-gray-200 p-0"
                            placeholder="开始写作 (Markdown)..."
                            value={formData.content}
                            onChange={e => setFormData({...formData, content: e.target.value})}
                        />
                    </div>
                </div>

                {/* Preview Side */}
                <div className="hidden md:block w-1/2 p-8 overflow-y-auto bg-white dark:bg-neutral-950">
                    <div className="max-w-2xl mx-auto">
                         <div className="mb-8 pb-4 border-b border-gray-100 dark:border-neutral-800">
                             <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{formData.title || '无标题'}</h1>
                             {formData.summary && (
                                <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-800">
                                    <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed italic">{formData.summary}</p>
                                </div>
                             )}
                         </div>
                         <MarkdownRenderer content={formData.content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'articles' | 'projects' | 'settings'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiProvider, setAiProvider] = useState<AIProvider>('deepseek');
  
  // Modal states
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
        await StorageService.initDB(); // Ensure tables exist
        const fetchedArticles = await StorageService.getArticles();
        setArticles(fetchedArticles);
        const fetchedProjects = await StorageService.getProjects();
        setProjects(fetchedProjects);
        setAiProvider(StorageService.getAIProvider()); // Load AI preference
    } catch (e) {
        console.error("Failed to load admin data", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
      setAiProvider(provider);
      StorageService.saveAIProvider(provider);
  };

  // --- Article Handlers ---
  const handleSaveArticle = async (article: Article) => {
    try {
        await StorageService.saveArticle(article);
        await loadData(); // Reload all data
        setIsEditingArticle(false);
        setCurrentArticle(undefined);
    } catch(e) {
        alert('保存失败，请检查数据库连接');
    }
  };

  const handleDeleteArticle = async (id: string) => {
      if(window.confirm('确定要删除这篇文章吗？')) {
          try {
              await StorageService.deleteArticle(id);
              await loadData();
          } catch(e) {
              alert('删除失败');
          }
      }
  };

  // --- Project Handlers ---
  const handleSaveProject = async (project: Project) => {
      try {
          await StorageService.saveProject(project);
          await loadData();
          setIsEditingProject(false);
          setCurrentProject(undefined);
      } catch(e) {
          alert('保存失败');
      }
  };

  const handleDeleteProject = async (id: string) => {
    if(window.confirm('确定要删除这个导航链接吗？')) {
        try {
            await StorageService.deleteProject(id);
            await loadData();
        } catch(e) {
            alert('删除失败');
        }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">正在连接数据库...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold dark:text-white">控制台</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">欢迎回来，Eray</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-neutral-900 p-1.5 rounded-xl">
            <button 
                onClick={() => setTab('articles')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'articles' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                文章
            </button>
            <button 
                onClick={() => setTab('projects')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'projects' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                导航
            </button>
            <button 
                onClick={() => setTab('settings')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'settings' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                <Settings size={16} /> 设置
            </button>
        </div>
      </div>

      {tab === 'articles' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50">
                <h3 className="font-semibold dark:text-white">所有文章 ({articles.length})</h3>
                <button 
                    onClick={() => { setCurrentArticle(undefined); setIsEditingArticle(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                    <Plus size={16} /> 新建文章
                </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {articles.map(article => (
                    <div key={article.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${article.isPublished ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-500'}`} title={article.isPublished ? '已发布' : '草稿'}></span>
                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{article.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${article.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                    {article.isPublished ? '已发布' : '草稿'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono">
                                {new Date(article.updatedAt).toLocaleDateString()} · {article.tags.join(', ') || '无标签'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="编辑"
                            >
                                 <Edit2 size={18} />
                             </button>
                             <button 
                                onClick={() => handleDeleteArticle(article.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="删除"
                             >
                                 <Trash2 size={18} />
                             </button>
                        </div>
                    </div>
                ))}
                {articles.length === 0 && <div className="p-12 text-center text-gray-400">暂无文章，开始写作吧</div>}
            </div>
        </div>
      )}

      {tab === 'projects' && (
         <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50">
                <h3 className="font-semibold dark:text-white">所有导航 ({projects.length})</h3>
                <button 
                    onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                    <Plus size={16} /> 添加链接
                </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                 {projects.map(project => {
                     const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                     return (
                     <div key={project.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-neutral-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-900 bg-gray-50/50 dark:bg-neutral-800/30 transition-all hover:shadow-sm group">
                         <div className="flex items-center gap-4 overflow-hidden">
                             <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 border border-gray-100 dark:border-neutral-700">
                                 {project.iconType === 'auto' ? <Globe size={24}/> : <IconComp size={24}/>}
                             </div>
                             <div className="truncate flex-1">
                                 <h4 className="font-bold text-gray-900 dark:text-white truncate">{project.title}</h4>
                                 <p className="text-xs text-gray-400 truncate mt-0.5">{project.url}</p>
                             </div>
                         </div>
                         <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setCurrentProject(project); setIsEditingProject(true); }}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteProject(project.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                     </div>
                 )})}
                 {projects.length === 0 && <div className="col-span-full p-12 text-center text-gray-400">暂无导航链接</div>}
             </div>
         </div>
      )}

      {tab === 'settings' && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                 <h3 className="font-semibold dark:text-white">系统设置</h3>
             </div>
             <div className="p-6 max-w-2xl">
                 <div className="space-y-6">
                     <div>
                         <label className="text-sm font-medium text-gray-900 dark:text-white mb-4 block">默认 AI 模型</label>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                             选择用于生成文章摘要和智能标签的 AI 模型。DeepSeek 适合中文语境，Gemini 响应速度极快。
                         </p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <button 
                                onClick={() => handleProviderChange('deepseek')}
                                className={`relative p-4 rounded-xl border-2 text-left transition-all ${aiProvider === 'deepseek' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'}`}
                             >
                                 <div className="flex items-center justify-between mb-2">
                                     <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                         <BrainCircuit size={18} className="text-blue-600" />
                                         DeepSeek Chat
                                     </span>
                                     {aiProvider === 'deepseek' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">推荐。在中文创作和逻辑推理方面表现出色。</p>
                             </button>

                             <button 
                                onClick={() => handleProviderChange('gemini')}
                                className={`relative p-4 rounded-xl border-2 text-left transition-all ${aiProvider === 'gemini' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'}`}
                             >
                                 <div className="flex items-center justify-between mb-2">
                                     <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                         <Sparkles size={18} className="text-yellow-600" />
                                         Google Gemini
                                     </span>
                                     {aiProvider === 'gemini' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">速度快，适合英语内容和通用任务。</p>
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Editors */}
      {isEditingProject && (
          <ProjectEditor 
            project={currentProject} 
            onSave={handleSaveProject} 
            onCancel={() => setIsEditingProject(false)} 
          />
      )}

      {isEditingArticle && (
          <ArticleEditor
            article={currentArticle}
            onSave={handleSaveArticle}
            onCancel={() => setIsEditingArticle(false)}
            defaultAIProvider={aiProvider}
          />
      )}
    </div>
  );
};