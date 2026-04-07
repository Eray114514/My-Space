"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Article } from '../../../types';
import { AIModelKey, AIService } from '../../../services/ai';
import { StorageService } from '../../../services/storage';
import { X, Save, Loader2, Sparkles, Plus, Zap } from 'lucide-react';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import toast from 'react-hot-toast';

export const ArticleEditor: React.FC<{
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

  // Refs for auto-resize textareas
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function
  const autoResize = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  useEffect(() => { autoResize(contentRef); }, [formData.content]);
  useEffect(() => { autoResize(summaryRef); }, [formData.summary]);

  const handleSubmit = async () => {
    if (!formData.title) return toast.error('请输入标题');
    setSaving(true);
    await onSave({ ...formData, id: formData.id || Date.now().toString(), updatedAt: new Date().toISOString() });
    setSaving(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
  };

  const handleGenerateSummary = async () => {
    if (!formData.content || formData.content.length < 10) return toast.error("请先输入足够的文章内容以便 AI 生成摘要。");
    setIsGeneratingSummary(true);
    setFormData(prev => ({ ...prev, summary: '' }));
    try {
      await AIService.generateSummaryStream(formData.content, defaultAIProvider, (chunk) => {
        setFormData(prev => ({ ...prev, summary: prev.summary + chunk }));
      });
    } catch (error) {
      toast.error(`AI 生成失败: ${error}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAutoTag = async () => {
    if (!formData.title && !formData.content) return toast.error("请先输入标题或内容");
    setIsAutoTagging(true);
    try {
      const allArticles = await StorageService.getPublishedArticlesLight();
      const allTagsSet = new Set<string>();
      allArticles.forEach(a => {
        if (a.tags) {
          a.tags.forEach(t => allTagsSet.add(t));
        }
      });
      const allTags = Array.from(allTagsSet);

      const newTags = await AIService.generateTags(formData.title, formData.content, formData.tags, allTags, defaultAIProvider);
      if (newTags.length > 0) setFormData(prev => ({ ...prev, tags: [...prev.tags, ...newTags] }));
    } catch (e) {
      toast.error("生成标签失败");
    } finally {
      setIsAutoTagging(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 bg-[#f8f9fa] dark:bg-[#050505] flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-indigo-300/30 dark:bg-indigo-600/20 rounded-full mix-blend-normal md:mix-blend-multiply dark:md:mix-blend-screen filter blur-[60px] md:blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-pink-300/30 dark:bg-purple-600/20 rounded-full mix-blend-normal md:mix-blend-multiply dark:md:mix-blend-screen filter blur-[60px] md:blur-[100px]" />
      </div>

      {/* Top Toolbar */}
      <div className="h-16 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-6 bg-white/60 dark:bg-white/5 backdrop-blur-md relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"><X size={24} /></button>
          <h2 className="text-xl font-bold dark:text-white hidden sm:block">{article ? '编辑文章' : '写文章'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.isPublished ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10'}`}>{formData.isPublished ? '已发布' : '草稿'}</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 font-bold disabled:opacity-50"><Save size={18} /> {saving ? '保存中...' : '保存'}</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">

        {/* Left Editor - Unified Scroll */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto border-r border-gray-200/50 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm custom-scrollbar">
          <div className="p-6 md:p-8 min-h-full flex flex-col">

            {/* Title Input */}
            <input
              placeholder="请输入标题..."
              className="text-4xl font-extrabold bg-transparent border-none outline-none mb-6 dark:text-white placeholder-gray-400/50 leading-tight"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />

            {/* Summary Section (with Button in Label Line) */}
            <div className="relative mb-8 group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">文章摘要</label>
                {/* AI Summary Button - Moved Outside */}
                <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm border bg-white dark:bg-neutral-800 border-gray-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                  {isGeneratingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI 生成
                </button>
              </div>
              <textarea
                ref={summaryRef}
                placeholder="输入摘要..."
                className="w-full bg-white/60 dark:bg-black/20 border-l-4 border-gray-300 dark:border-white/20 rounded-r-lg outline-none resize-none px-4 py-3 text-gray-600 dark:text-gray-300 text-lg italic leading-relaxed focus:border-indigo-500 transition-all overflow-hidden"
                rows={1}
                value={formData.summary}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8 items-center">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-white dark:bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-white/10 flex items-center gap-2 dark:text-gray-200 shadow-sm">
                  {tag}
                  <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
                <Plus size={14} className="text-gray-400" />
                <input
                  className="bg-transparent text-sm outline-none w-20 py-0.5 dark:text-white placeholder-gray-400"
                  placeholder="添加标签..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }}
                />
              </div>
              <button type="button" onClick={handleAutoTag} disabled={isAutoTagging} className="flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                {isAutoTagging ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} 自动
              </button>
            </div>

            {/* Content Area - Auto Expanding */}
            <div className="flex-1 relative">
              <textarea
                ref={contentRef}
                className="w-full min-h-[500px] bg-transparent border-none outline-none resize-none font-mono text-base leading-relaxed dark:text-gray-200 p-0 placeholder-gray-400/50 overflow-hidden"
                placeholder="# 开始写作 (Markdown)..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Right Preview */}
        <div className="hidden md:block w-1/2 p-10 overflow-y-auto bg-white/40 dark:bg-white/5 backdrop-blur-md custom-scrollbar">
          <div className="max-w-2xl mx-auto prose dark:prose-invert">
            <div className="mb-10 pb-6 border-b border-gray-200/50 dark:border-white/10">
              <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight">{formData.title || '预览标题'}</h1>
              {formData.summary && <div className="p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm"><p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed italic m-0">{formData.summary}</p></div>}
            </div>
            <MarkdownRenderer content={formData.content || '暂无内容...'} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
