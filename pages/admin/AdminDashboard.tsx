import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { AIService, AIModelKey, AI_MODELS } from '../../services/ai';
import { Plus, Trash2, Edit2, Save, Globe, Search, X, Settings, Sparkles, Loader2, BrainCircuit, Wand2, DownloadCloud, Layout, Zap, Bot, Box, CheckCircle } from 'lucide-react';
import { Article, Project } from '../../types';
import * as Icons from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

// Curated list of icons suitable for personal portfolio/tech stack
const CURATED_ICONS = [
  'Globe', 'Github', 'Twitter', 'Linkedin', 'Youtube', 'Facebook', 'Instagram', 'Twitch', 'Figma', 'Dribbble', 'Codepen', 'Gitlab', 'Bot',
  'Code', 'Terminal', 'Cpu', 'Database', 'Server', 'Cloud', 'Laptop', 'Smartphone', 'Monitor', 'Tablet', 'Watch',
  'Home', 'User', 'Users', 'Mail', 'Send', 'MessageCircle', 'MessageSquare', 'Phone', 'Video', 'Mic', 'Camera', 'Image', 'Music', 'Headphones',
  'File', 'FileText', 'Folder', 'FolderOpen', 'Book', 'BookOpen', 'Bookmark', 'Link', 'ExternalLink', 'Share', 'Download', 'Upload',
  'Settings', 'Wrench', 'PenTool', 'Palette', 'Layers', 'Grid', 'Layout', 'Box', 'Package', 'ShoppingBag', 'CreditCard',
  'Activity', 'Zap', 'Battery', 'Wifi', 'Signal', 'Map', 'MapPin', 'Compass', 'Navigation', 'Flag', 'Target', 'Award', 'Star', 'Heart', 'ThumbsUp',
  'Calendar', 'Clock', 'Timer', 'Sun', 'Moon', 'CloudRain', 'Wind', 'Umbrella', 'Coffee', 'Beer', 'Pizza', 'Gift', 'Shield', 'Lock', 'Unlock', 'Key'
];

// Helper to get unique providers
const PROVIDERS = Array.from(new Set(Object.values(AI_MODELS).map(m => m.provider)));
const PROVIDER_NAMES: Record<string, string> = {
  'deepseek': 'DeepSeek',
  'gemini': 'Google Gemini',
  'openrouter': 'OpenRouter'
};
const PROVIDER_ICONS: Record<string, any> = {
  'deepseek': BrainCircuit,
  'gemini': Sparkles,
  'openrouter': Box
};

// --- Model Selector Component (Glass) ---
const ModelSelector: React.FC<{
  label: string;
  description: string;
  value: AIModelKey;
  onChange: (key: AIModelKey) => void;
}> = ({ label, description, value, onChange }) => {
  // @ts-ignore
  const currentModel = AI_MODELS[value];
  const [selectedProvider, setSelectedProvider] = useState<string>(
    currentModel?.provider || 'deepseek'
  );

  useEffect(() => {
    // @ts-ignore
    if (AI_MODELS[value]?.provider) setSelectedProvider(AI_MODELS[value].provider);
  }, [value]);

  const filteredModels = useMemo(() => {
    return Object.entries(AI_MODELS)
      .filter(([_, model]) => model.provider === selectedProvider);
  }, [selectedProvider]);

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          {label}
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/30">当前: {currentModel?.name || '未设置'}</span>
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light leading-relaxed">{description}</p>
      </div>

      {/* Provider Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {PROVIDERS.map(p => {
          const Icon = PROVIDER_ICONS[p] || Bot;
          const isActive = selectedProvider === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${isActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-white/50 dark:bg-white/5 border-transparent text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/10'
                }`}
            >
              <Icon size={16} />
              {PROVIDER_NAMES[p] || p}
            </button>
          )
        })}
      </div>

      {/* Model List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredModels.map(([key, model]) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key as AIModelKey)}
              className={`relative text-left p-4 rounded-2xl border transition-all duration-300 ${isSelected
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/20 shadow-sm'
                  : 'border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{model.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 opacity-80">{model.description}</div>
                </div>
                {isSelected && <CheckCircle size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </div>
            </button>
          );
        })}
        {filteredModels.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-400 py-4">该服务商下无可用的模型，请检查 API Key 配置。</div>
        )}
      </div>
    </div>
  );
};


// Subcomponents
const IconPicker: React.FC<{
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return CURATED_ICONS;
    return CURATED_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="border border-gray-200/50 dark:border-white/10 rounded-2xl overflow-hidden bg-white/40 dark:bg-black/20 mt-2 backdrop-blur-sm">
      <div className="p-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 bg-white/30 dark:bg-white/5">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="搜索图标..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 max-h-48 overflow-y-auto custom-scrollbar">
        {filteredIcons.map(name => {
          const IconComponent = (Icons as any)[name];
          if (!IconComponent) return null;

          const isSelected = selectedIcon === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all hover:bg-white/50 dark:hover:bg-white/10 ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400'}`}
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
  defaultAiProvider: AIModelKey;
  defaultSvgProvider: AIModelKey;
}> = ({ project, onSave, onCancel, defaultAiProvider, defaultSvgProvider }) => {
  const [formData, setFormData] = useState<Project>(
    project || {
      id: '',
      title: '',
      description: '',
      url: '',
      iconType: 'auto',
      presetIcon: 'Globe',
      imageBase64: '',
      customSvg: ''
    }
  );
  const [saving, setSaving] = useState(false);
  const [fetchingFavicon, setFetchingFavicon] = useState(false);
  const [recommendingIcon, setRecommendingIcon] = useState(false);
  const [generatingSvg, setGeneratingSvg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...formData, id: formData.id || Date.now().toString() });
    setSaving(false);
  };

  const SelectedIconComp = formData.presetIcon && (Icons as any)[formData.presetIcon]
    ? (Icons as any)[formData.presetIcon]
    : Icons.Globe;

  const handleFetchFavicon = async () => {
    if (!formData.url) {
      alert("请先填写 URL");
      return;
    }
    setFetchingFavicon(true);
    setFormData(prev => ({ ...prev, iconType: 'auto' }));

    try {
      // Validation
      try { new URL(formData.url); } catch { alert("URL 格式无效"); setFetchingFavicon(false); return; }

      const iconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(formData.url)}&size=128`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(iconUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Fetch failed");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setFormData(prev => ({ ...prev, imageBase64: base64data }));
      };
      reader.readAsDataURL(blob);

    } catch (e) {
      console.error("Favicon fetch error", e);
      alert("获取图标失败，该网站可能没有公开的高清图标。");
    } finally {
      setFetchingFavicon(false);
    }
  };

  const handleRecommendIcon = async () => {
    if (!formData.title && !formData.description) return alert("请先填写标题或描述");
    setRecommendingIcon(true);
    setFormData(prev => ({ ...prev, iconType: 'preset' }));
    try {
      const recommended = await AIService.recommendIcon(formData.title, formData.description, CURATED_ICONS, defaultAiProvider);
      if (recommended && (Icons as any)[recommended]) {
        setFormData(prev => ({ ...prev, presetIcon: recommended }));
      } else {
        setFormData(prev => ({ ...prev, presetIcon: 'Globe' }));
        alert(`AI 推荐结果不明确，已为您选择通用图标。`);
      }
    } catch (e) {
      alert("AI 服务暂时不可用。");
    } finally {
      setRecommendingIcon(false);
    }
  };

  const handleGenerateSvg = async () => {
    if (!formData.title && !formData.description) return alert("请先填写标题或描述");
    setGeneratingSvg(true);
    try {
      const svgCode = await AIService.generateSVGIcon(formData.title, formData.description, defaultSvgProvider);
      if (svgCode && svgCode.trim().startsWith('<svg')) {
        setFormData(prev => ({ ...prev, customSvg: svgCode, iconType: 'generated' }));
      } else {
        alert("SVG 生成失败，请重试。");
      }
    } catch (e) {
      alert("生成出错。");
    } finally {
      setGeneratingSvg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="liquid-glass-high w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 dark:text-white">{project ? '编辑导航' : '新增导航'}</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标题</label>
            <input required placeholder="网站名称" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all backdrop-blur-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">链接 URL</label>
            <input required type="url" placeholder="https://..." className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all backdrop-blur-sm" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">描述</label>
            <textarea placeholder="简短的介绍..." className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white h-24 resize-none transition-all backdrop-blur-sm" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">图标设置</label>
            <div className="flex bg-gray-100/50 dark:bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/20 dark:border-white/5">
              {['auto', 'preset', 'generated'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, iconType: type as any })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${formData.iconType === type ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                  {type === 'auto' && <Globe size={14} />}
                  {type === 'preset' && <Layout size={14} />}
                  {type === 'generated' && <Wand2 size={14} />}
                  {type === 'auto' ? '自动获取' : type === 'preset' ? '预设图标' : 'AI 生成'}
                </button>
              ))}
            </div>

            <div className="bg-white/40 dark:bg-black/20 rounded-2xl p-6 border border-white/30 dark:border-white/5 min-h-[140px] flex flex-col justify-center items-center backdrop-blur-sm">
              {/* 1. Auto */}
              {formData.iconType === 'auto' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
                    {formData.imageBase64 ? <img src={formData.imageBase64} className="w-full h-full object-cover" alt="Favicon" /> : <Globe className="text-gray-300" size={32} />}
                  </div>
                  <button type="button" onClick={handleFetchFavicon} disabled={fetchingFavicon} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-500/30">
                    {fetchingFavicon ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} {fetchingFavicon ? '抓取中...' : '抓取高清图标'}
                  </button>
                </div>
              )}

              {/* 2. Preset */}
              {formData.iconType === 'preset' && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg shadow-sm">
                      当前: <SelectedIconComp size={16} className="text-indigo-600 dark:text-indigo-400" /> <span className="font-mono font-medium">{formData.presetIcon}</span>
                    </div>
                    <button type="button" onClick={handleRecommendIcon} disabled={recommendingIcon} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-full transition-colors">
                      {recommendingIcon ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {recommendingIcon ? '分析中...' : '智能推荐'}
                    </button>
                  </div>
                  <IconPicker selectedIcon={formData.presetIcon || 'Globe'} onSelect={(icon) => setFormData({ ...formData, presetIcon: icon })} />
                </div>
              )}

              {/* 3. Generated */}
              {formData.iconType === 'generated' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-neutral-700 text-indigo-600 dark:text-indigo-400 p-3 overflow-hidden">
                    {formData.customSvg ? (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: formData.customSvg }} />
                    ) : (
                      <Wand2 className="text-gray-300" size={32} />
                    )}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <span>使用模型:</span>
                    {/* @ts-ignore */}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{AI_MODELS[defaultSvgProvider]?.shortName || 'Unknown'}</span>
                  </div>

                  <button type="button" onClick={handleGenerateSvg} disabled={generatingSvg} className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-purple-500/30">
                    {generatingSvg ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {generatingSvg ? '生成中...' : 'AI 设计图标'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200/50 dark:border-white/10">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors font-medium">取消</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 font-bold">{saving ? '保存中...' : '保存'}</button>
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
  defaultAIProvider: AIModelKey;
}> = ({ article, onSave, onCancel, defaultAIProvider }) => {
  const [formData, setFormData] = useState<Article>(
    article || { id: '', title: '', summary: '', content: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPublished: false, tags: [] }
  );
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
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
    if (trimmed && !formData.tags.includes(trimmed)) setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
  };

  const handleGenerateSummary = async () => {
    if (!formData.content || formData.content.length < 10) return alert("请先输入足够的文章内容以便 AI 生成摘要。");
    setIsGeneratingSummary(true);
    setFormData(prev => ({ ...prev, summary: '' }));
    try {
      await AIService.generateSummaryStream(formData.content, defaultAIProvider, (chunk) => {
        setFormData(prev => ({ ...prev, summary: prev.summary + chunk }));
      });
    } catch (error) {
      alert(`AI 生成失败: ${error}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAutoTag = async () => {
    if (!formData.title && !formData.content) return alert("请先输入标题或内容");
    setIsAutoTagging(true);
    try {
      const newTags = await AIService.generateTags(formData.title, formData.content, formData.tags, defaultAIProvider);
      if (newTags.length > 0) setFormData(prev => ({ ...prev, tags: [...prev.tags, ...newTags] }));
    } catch (e) {
      alert("生成标签失败");
    } finally {
      setIsAutoTagging(false);
    }
  };

  return (
    // Changed z-index to 100 to cover navbar, improved background
    <div className="fixed inset-0 z-[100] bg-[#f8f9fa] dark:bg-[#050505] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Embedded Liquid Ambient Background for Editor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-indigo-300/30 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-pink-300/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px]" />
      </div>

      <div className="h-20 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-6 bg-white/40 dark:bg-white/5 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"><X size={24} /></button>
          <h2 className="text-xl font-bold dark:text-white hidden sm:block">{article ? '编辑文章' : '写文章'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.isPublished ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10'}`}>{formData.isPublished ? '已发布' : '草稿'}</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 font-bold disabled:opacity-50"><Save size={18} /> {saving ? '保存中...' : '保存'}</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-6 overflow-y-auto">
          <input placeholder="请输入标题..." className="text-3xl font-bold bg-transparent border-none outline-none mb-6 dark:text-white placeholder-gray-400/50" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

          <div className="relative mb-6">
            <textarea placeholder="请输入摘要..." className="w-full bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/5 rounded-xl outline-none resize-none p-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed pr-24 shadow-sm focus:ring-2 focus:ring-indigo-500/30 transition-all" rows={3} value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} />
            <div className="absolute right-2 top-2"><button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm border bg-white dark:bg-white/10 border-gray-200 dark:border-white/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">{isGeneratingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI 摘要</button></div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 items-center">
            {formData.tags.map(tag => (<span key={tag} className="bg-white dark:bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-white/10 flex items-center gap-2 dark:text-gray-200 shadow-sm">{tag} <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} className="hover:text-red-500"><X size={12} /></button></span>))}
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm"><Plus size={14} className="text-gray-400" /><input className="bg-transparent text-sm outline-none w-20 py-0.5 dark:text-white placeholder-gray-400" placeholder="标签..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }} /></div>
            <button type="button" onClick={handleAutoTag} disabled={isAutoTagging} className="flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">{isAutoTagging ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} 自动</button>
          </div>

          <div className="flex-1 relative group border-t border-gray-200/50 dark:border-white/10 pt-6 mt-2">
            <textarea className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed dark:text-gray-200 p-0 placeholder-gray-400/50" placeholder="# 开始写作 (Markdown)..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </div>
        </div>
        <div className="hidden md:block w-1/2 p-10 overflow-y-auto bg-white/40 dark:bg-white/5 backdrop-blur-md">
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 pb-6 border-b border-gray-200/50 dark:border-white/10">
              <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight">{formData.title || '无标题'}</h1>
              {formData.summary && <div className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm"><p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed italic">{formData.summary}</p></div>}
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
      console.error("Failed to load admin data", e);
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
    } catch (e) { alert('保存失败'); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      try { await StorageService.deleteArticle(id); await loadData(); } catch (e) { alert('删除失败'); }
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      await StorageService.saveProject(project);
      await loadData();
      setIsEditingProject(false);
      setCurrentProject(undefined);
    } catch (e) { alert('保存失败'); }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('确定要删除这个导航链接吗？')) {
      try { await StorageService.deleteProject(id); await loadData(); } catch (e) { alert('删除失败'); }
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 font-light tracking-wider animate-pulse">正在连接数据核心...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold dark:text-white tracking-tight">控制台</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-light">管理你的数字花园内容</p>
        </div>

        {/* Glass Tabs */}
        <div className="flex bg-white/40 dark:bg-white/5 p-1.5 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-md shadow-sm">
          <button onClick={() => setTab('articles')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'articles' ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>文章</button>
          <button onClick={() => setTab('projects')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${tab === 'projects' ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>导航</button>
          <button onClick={() => setTab('settings')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${tab === 'settings' ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}><Settings size={16} /> 设置</button>
        </div>
      </div>

      {/* Content Area - Liquid Glass Container */}
      {tab === 'articles' && (
        <div className="liquid-glass rounded-3xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/20 dark:border-white/5 flex justify-between items-center bg-white/30 dark:bg-white/5 backdrop-blur-sm">
            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Layout size={20} className="text-indigo-500" /> 文章列表 <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{articles.length}</span></h3>
            <button onClick={() => { setCurrentArticle(undefined); setIsEditingArticle(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-indigo-500/20 font-bold hover:scale-105 active:scale-95"><Plus size={18} /> 写文章</button>
          </div>
          <div className="divide-y divide-white/20 dark:divide-white/5">
            {articles.map(article => (
              <div key={article.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${article.isPublished ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></span>
                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${article.isPublished ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{article.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <div className="flex gap-1">
                      {article.tags.map(t => <span key={t} className="bg-white/50 dark:bg-white/10 px-1.5 py-0.5 rounded border border-white/20 dark:border-white/5">#{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-4 sm:group-hover:translate-x-0">
                  <button onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }} className="p-2.5 bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/20 rounded-xl transition-all shadow-sm"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteArticle(article.id)} className="p-2.5 bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-white dark:hover:bg-white/20 rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="liquid-glass rounded-3xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/20 dark:border-white/5 flex justify-between items-center bg-white/30 dark:bg-white/5 backdrop-blur-sm">
            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Globe size={20} className="text-indigo-500" /> 导航链接 <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{projects.length}</span></h3>
            <button onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-indigo-500/20 font-bold hover:scale-105 active:scale-95"><Plus size={18} /> 添加链接</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {projects.map(project => {
              let IconDisplay: React.ReactNode = <Globe size={24} />;
              if (project.iconType === 'generated' && project.customSvg) {
                IconDisplay = <div className="w-7 h-7 text-indigo-600 dark:text-indigo-400" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
              } else if (project.iconType === 'auto' && project.imageBase64) {
                IconDisplay = <img src={project.imageBase64} alt="icon" className="w-7 h-7 object-cover rounded-md shadow-sm" />;
              } else {
                const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                IconDisplay = <IconComp size={24} />;
              }
              return (
                <div key={project.id} className="flex items-center justify-between p-4 border border-white/40 dark:border-white/5 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:shadow-lg group backdrop-blur-sm">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 border border-white/50 dark:border-white/5 p-2 backdrop-blur-md">{IconDisplay}</div>
                    <div className="truncate flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">{project.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 opacity-80">{project.url}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-2 sm:group-hover:translate-x-0 gap-2">
                    <button onClick={() => { setCurrentProject(project); setIsEditingProject(true); }} className="p-2 text-gray-500 hover:text-indigo-600 bg-white/50 dark:bg-white/5 rounded-lg hover:bg-white dark:hover:bg-white/20 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-gray-500 hover:text-red-600 bg-white/50 dark:bg-white/5 rounded-lg hover:bg-white dark:hover:bg-white/20 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="liquid-glass rounded-3xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-sm"><h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Settings size={20} className="text-indigo-500" /> 系统设置</h3></div>
          <div className="p-8 max-w-3xl space-y-10">

            {/* 1. General AI Selection */}
            <ModelSelector
              label="全局 AI 写作模型"
              description="用于文章摘要生成、自动打标签等文本处理任务。建议选择速度较快的模型。"
              value={generalAiProvider}
              onChange={handleGeneralProviderChange}
            />

            {/* 2. SVG AI Selection */}
            <ModelSelector
              label="图标绘制 AI 模型"
              description="专用于生成 SVG 图标代码。建议选择 DeepSeek Reasoner (R1) 或逻辑能力较强的模型以获得最佳绘图效果。"
              value={svgAiProvider}
              onChange={handleSvgProviderChange}
            />

          </div>
        </div>
      )}
      {isEditingProject && <ProjectEditor project={currentProject} onSave={handleSaveProject} onCancel={() => setIsEditingProject(false)} defaultAiProvider={generalAiProvider} defaultSvgProvider={svgAiProvider} />}
      {isEditingArticle && <ArticleEditor article={currentArticle} onSave={handleSaveArticle} onCancel={() => setIsEditingArticle(false)} defaultAIProvider={generalAiProvider} />}
    </div>
  );
};