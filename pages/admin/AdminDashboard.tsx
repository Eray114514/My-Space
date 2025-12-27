import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { AIService, AIProvider } from '../../services/ai';
import { Plus, Trash2, Edit2, Save, Globe, Search, X, Settings, Sparkles, Loader2, BrainCircuit, Wand2, DownloadCloud, Layout, Zap } from 'lucide-react';
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
        <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 mt-2">
            <div className="p-2 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2 bg-gray-50 dark:bg-neutral-800/50">
                <Search size={16} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索图标..."
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
    aiProvider: AIProvider;
}> = ({ project, onSave, onCancel, aiProvider }) => {
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

    // 1. Favicon Logic (High-Res)
    const handleFetchFavicon = async () => {
        if (!formData.url) {
            alert("请先填写 URL");
            return;
        }
        setFetchingFavicon(true);
        setFormData(prev => ({ ...prev, iconType: 'auto' }));

        try {
            let domain = '';
            try {
                domain = new URL(formData.url).hostname;
            } catch {
                alert("URL 格式无效");
                setFetchingFavicon(false);
                return;
            }

            // 使用 Google Favicon V2 API 获取 128px 高清图标
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

    // 2. AI Recommend Logic (Strict Validation)
    const handleRecommendIcon = async () => {
        if (!formData.title && !formData.description) return alert("请先填写标题或描述");
        setRecommendingIcon(true);
        setFormData(prev => ({ ...prev, iconType: 'preset' }));

        try {
            const recommended = await AIService.recommendIcon(formData.title, formData.description, CURATED_ICONS, aiProvider);
            if (recommended && (Icons as any)[recommended]) {
                setFormData(prev => ({ ...prev, presetIcon: recommended }));
            } else {
                console.warn(`AI recommended invalid icon: ${recommended}`);
                setFormData(prev => ({ ...prev, presetIcon: 'Globe' }));
                alert(`AI 推荐结果不明确，已为您选择通用图标。`);
            }
        } catch (e) {
            alert("AI 服务暂时不可用。");
        } finally {
            setRecommendingIcon(false);
        }
    };

    // 3. AI Generate SVG Logic
    const handleGenerateSvg = async () => {
        if (!formData.title && !formData.description) return alert("请先填写标题或描述");
        setGeneratingSvg(true);

        try {
            const svgCode = await AIService.generateSVGIcon(formData.title, formData.description, aiProvider);
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
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 dark:text-white">{project ? '编辑导航' : '新增导航'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                        <input required placeholder="网站名称" className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg outline-none dark:text-white" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接 URL</label>
                        <input required type="url" placeholder="https://..." className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg outline-none dark:text-white" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                        <textarea placeholder="简短的介绍..." className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg outline-none dark:text-white h-20 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">图标设置</label>
                        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
                            <button type="button" onClick={() => setFormData({ ...formData, iconType: 'auto' })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${formData.iconType === 'auto' ? 'bg-white dark:bg-neutral-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Globe size={14} /> 自动获取</button>
                            <button type="button" onClick={() => setFormData({ ...formData, iconType: 'preset' })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${formData.iconType === 'preset' ? 'bg-white dark:bg-neutral-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Layout size={14} /> 预设图标</button>
                            <button type="button" onClick={() => setFormData({ ...formData, iconType: 'generated' })} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${formData.iconType === 'generated' ? 'bg-white dark:bg-neutral-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Wand2 size={14} /> AI 生成</button>
                        </div>

                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-100 dark:border-neutral-800 min-h-[120px] flex flex-col justify-center items-center">
                            {/* 1. Auto */}
                            {formData.iconType === 'auto' && (
                                <div className="flex flex-col items-center gap-4 w-full">
                                    <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
                                        {formData.imageBase64 ? <img src={formData.imageBase64} className="w-full h-full object-cover" alt="Favicon" /> : <Globe className="text-gray-300" size={32} />}
                                    </div>
                                    <button type="button" onClick={handleFetchFavicon} disabled={fetchingFavicon} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors">
                                        {fetchingFavicon ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} {fetchingFavicon ? '抓取中...' : '抓取高清图标'}
                                    </button>
                                </div>
                            )}

                            {/* 2. Preset */}
                            {formData.iconType === 'preset' && (
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-sm">
                                            当前: <SelectedIconComp size={16} className="text-indigo-600" /> <span className="font-mono">{formData.presetIcon}</span>
                                        </div>
                                        <button type="button" onClick={handleRecommendIcon} disabled={recommendingIcon} className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded transition-colors">
                                            {recommendingIcon ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {recommendingIcon ? '分析中...' : '智能推荐'}
                                        </button>
                                    </div>
                                    <IconPicker selectedIcon={formData.presetIcon || 'Globe'} onSelect={(icon) => setFormData({ ...formData, presetIcon: icon })} />
                                </div>
                            )}

                            {/* 3. Generated (FIXED CRASH HERE) */}
                            {formData.iconType === 'generated' && (
                                <div className="flex flex-col items-center gap-4 w-full">
                                    {/* 关键修复：绝对不要在同一个 div 上同时放 dangerouslySetInnerHTML 和 children */}
                                    <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-neutral-700 text-indigo-600 dark:text-indigo-400 p-3 overflow-hidden">
                                        {formData.customSvg ? (
                                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: formData.customSvg }} />
                                        ) : (
                                            <Wand2 className="text-gray-300" size={32} />
                                        )}
                                    </div>

                                    <button type="button" onClick={handleGenerateSvg} disabled={generatingSvg} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors">
                                        {generatingSvg ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {generatingSvg ? '生成中...' : 'AI 设计图标'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-neutral-800">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">取消</button>
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
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
            alert(`AI 生成失败 (${defaultAIProvider})`);
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
        <div className="fixed inset-0 z-[60] bg-white dark:bg-neutral-950 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-neutral-950">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"><X size={24} /></button>
                    <h2 className="text-lg font-bold dark:text-white hidden sm:block">{article ? '编辑文章' : '写文章'}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.isPublished ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-neutral-800'}`}>{formData.isPublished ? '已发布' : '草稿'}</button>
                    <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 shadow-sm dark:shadow-none transition-colors font-medium disabled:opacity-50"><Save size={18} /> {saving ? '保存中...' : '保存'}</button>
                </div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/30 p-4 sm:p-6 overflow-y-auto">
                    <input placeholder="请输入标题..." className="text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none mb-4 dark:text-white placeholder-gray-400" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    <div className="relative mb-4">
                        <textarea placeholder="请输入摘要..." className="w-full bg-transparent border-none outline-none resize-none h-auto min-h-[4rem] text-gray-600 dark:text-gray-400 text-sm leading-relaxed pr-24" rows={3} value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} />
                        <div className="absolute right-0 top-0 m-1"><button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md shadow-sm border bg-white border-gray-200 text-indigo-600 hover:bg-gray-50">{isGeneratingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI</button></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6 items-center">
                        {formData.tags.map(tag => (<span key={tag} className="bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-md text-xs border border-gray-200 dark:border-neutral-700 flex items-center gap-1.5 dark:text-gray-300">{tag} <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}><X size={12} /></button></span>))}
                        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-2 rounded-md border border-transparent focus-within:border-indigo-500 transition-colors"><Plus size={14} className="text-gray-400" /><input className="bg-transparent text-sm outline-none w-20 py-1 dark:text-white" placeholder="标签..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }} /></div>
                        <button type="button" onClick={handleAutoTag} disabled={isAutoTagging} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-indigo-600 hover:bg-indigo-50">{isAutoTagging ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} 自动</button>
                    </div>
                    <div className="flex-1 relative group border-t border-gray-200 dark:border-neutral-800 pt-4 mt-2">
                        <textarea className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed dark:text-gray-200 p-0" placeholder="开始写作 (Markdown)..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                    </div>
                </div>
                <div className="hidden md:block w-1/2 p-8 overflow-y-auto bg-white dark:bg-neutral-950">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-8 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{formData.title || '无标题'}</h1>
                            {formData.summary && <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-800"><p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed italic">{formData.summary}</p></div>}
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
            setAiProvider(StorageService.getAIProvider());
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleProviderChange = (provider: AIProvider) => {
        setAiProvider(provider);
        StorageService.saveAIProvider(provider);
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

    if (loading) return <div className="p-8 text-center text-gray-500">正在连接数据库...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><h1 className="text-3xl font-bold dark:text-white">控制台</h1><p className="text-gray-500 dark:text-gray-400 mt-1">欢迎回来，Eray</p></div>
                <div className="flex bg-gray-100 dark:bg-neutral-900 p-1.5 rounded-xl">
                    <button onClick={() => setTab('articles')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'articles' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>文章</button>
                    <button onClick={() => setTab('projects')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'projects' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>导航</button>
                    <button onClick={() => setTab('settings')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'settings' ? 'bg-white dark:bg-neutral-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Settings size={16} /> 设置</button>
                </div>
            </div>

            {tab === 'articles' && (
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50">
                        <h3 className="font-semibold dark:text-white">所有文章 ({articles.length})</h3>
                        <button onClick={() => { setCurrentArticle(undefined); setIsEditingArticle(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"><Plus size={16} /> 新建文章</button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {articles.map(article => (
                            <div key={article.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${article.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{article.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${article.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{article.isPublished ? '已发布' : '草稿'}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono">{new Date(article.updatedAt).toLocaleDateString()} · {article.tags.join(', ') || '无标签'}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setCurrentArticle(article); setIsEditingArticle(true); }} className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'projects' && (
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50">
                        <h3 className="font-semibold dark:text-white">所有导航 ({projects.length})</h3>
                        <button onClick={() => { setCurrentProject(undefined); setIsEditingProject(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"><Plus size={16} /> 添加链接</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {projects.map(project => {
                            let IconDisplay: React.ReactNode = <Globe size={24} />;
                            if (project.iconType === 'generated' && project.customSvg) {
                                IconDisplay = <div className="w-6 h-6 text-indigo-600 dark:text-indigo-400" dangerouslySetInnerHTML={{ __html: project.customSvg }} />;
                            } else if (project.iconType === 'auto' && project.imageBase64) {
                                IconDisplay = <img src={project.imageBase64} alt="icon" className="w-6 h-6 object-cover rounded" />;
                            } else {
                                const IconComp = (Icons as any)[project.presetIcon || 'Globe'] || Icons.Globe;
                                IconDisplay = <IconComp size={24} />;
                            }
                            return (
                                <div key={project.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-neutral-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-900 bg-gray-50/50 dark:bg-neutral-800/30 transition-all hover:shadow-sm group">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0 border border-gray-100 dark:border-neutral-700 overflow-hidden p-2">{IconDisplay}</div>
                                        <div className="truncate flex-1"><h4 className="font-bold text-gray-900 dark:text-white truncate">{project.title}</h4><p className="text-xs text-gray-400 truncate mt-0.5">{project.url}</p></div>
                                    </div>
                                    <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setCurrentProject(project); setIsEditingProject(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {tab === 'settings' && (
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50"><h3 className="font-semibold dark:text-white">系统设置</h3></div>
                    <div className="p-6 max-w-2xl">
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white mb-4 block">默认 AI 模型</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button onClick={() => handleProviderChange('deepseek')} className={`relative p-4 rounded-xl border-2 text-left transition-all ${aiProvider === 'deepseek' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
                                        <div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><BrainCircuit size={18} className="text-blue-600" /> DeepSeek Chat</span>{aiProvider === 'deepseek' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}</div>
                                    </button>
                                    <button onClick={() => handleProviderChange('gemini')} className={`relative p-4 rounded-xl border-2 text-left transition-all ${aiProvider === 'gemini' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-neutral-700'}`}>
                                        <div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles size={18} className="text-yellow-600" /> Google Gemini</span>{aiProvider === 'gemini' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isEditingProject && <ProjectEditor project={currentProject} onSave={handleSaveProject} onCancel={() => setIsEditingProject(false)} aiProvider={aiProvider} />}
            {isEditingArticle && <ArticleEditor article={currentArticle} onSave={handleSaveArticle} onCancel={() => setIsEditingArticle(false)} defaultAIProvider={aiProvider} />}
        </div>
    );
};