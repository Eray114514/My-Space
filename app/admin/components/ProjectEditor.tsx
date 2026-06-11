"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../../../types';
import { AIModelKey, AIService } from '../../../services/ai';
import { Type, Link as LinkIcon, AlignLeft, Sparkles, Globe, Loader2, DownloadCloud, Wand2, X, Save } from 'lucide-react';
import * as Icons from 'lucide-react';
import { IconPicker } from './IconPicker';
import { CURATED_ICONS } from '../constants';
import toast from 'react-hot-toast';

export const ProjectEditor: React.FC<{
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
    if (!formData.title) return toast.error('请输入名称');
    if (!formData.url) return toast.error('请输入链接');
    setSaving(true);
    await onSave({ ...formData, id: formData.id || Date.now().toString() });
    setSaving(false);
  };

  const SelectedIconComp = formData.presetIcon && (Icons as any)[formData.presetIcon]
    ? (Icons as any)[formData.presetIcon]
    : Icons.Globe;

  const handleFetchFavicon = async () => {
    if (!formData.url) { toast.error("请先填写 URL"); return; }
    setFetchingFavicon(true);
    setFormData(prev => ({ ...prev, iconType: 'auto' }));
    try {
      try { new URL(formData.url); } catch { toast.error("URL 格式无效"); setFetchingFavicon(false); return; }
      const iconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(formData.url)}&size=128`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(iconUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageBase64: reader.result as string }));
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      toast.error("获取图标失败，该网站可能没有公开的高清图标。");
    } finally {
      setFetchingFavicon(false);
    }
  };

  const handleRecommendIcon = async () => {
    if (!formData.title && !formData.description) return toast.error("请先填写标题或描述");
    setRecommendingIcon(true);
    setFormData(prev => ({ ...prev, iconType: 'preset' }));
    try {
      const recommended = await AIService.recommendIcon(formData.title, formData.description, CURATED_ICONS, defaultAiProvider);
      if (recommended && (Icons as any)[recommended]) {
        setFormData(prev => ({ ...prev, presetIcon: recommended }));
      } else {
        setFormData(prev => ({ ...prev, presetIcon: 'Globe' }));
        toast.error("AI 推荐结果不明确，已为您选择通用图标。");
      }
    } catch (e) {
      toast.error("AI 服务暂时不可用。");
    } finally {
      setRecommendingIcon(false);
    }
  };

  const handleGenerateSvg = async () => {
    if (!formData.title && !formData.description) return toast.error("请先填写标题或描述");
    setGeneratingSvg(true);
    try {
      const svgCode = await AIService.generateSVGIcon(formData.title, formData.description, defaultSvgProvider);
      if (svgCode && svgCode.trim().startsWith('<svg')) {
        setFormData(prev => ({ ...prev, customSvg: svgCode, iconType: 'generated' }));
      } else {
        toast.error("SVG 生成失败，请重试。");
      }
    } catch (e) {
      toast.error("生成出错。");
    } finally {
      setGeneratingSvg(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20 placeholder:text-gray-400/60 transition-all";
  const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#111] rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/10">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{project ? '编辑导航' : '新增导航'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">完善链接信息与图标</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className={labelClass}>标题</label>
              <input required placeholder="例如：GitHub" className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>URL 链接</label>
              <input required type="url" placeholder="https://..." className={inputClass} value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>描述</label>
              <textarea placeholder="简短的介绍..." className={`${inputClass} min-h-[80px] resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            {/* Icon Section */}
            <div>
              <label className={labelClass}>图标设置</label>

              {/* Type Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-4">
                {['auto', 'preset', 'generated'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setFormData({ ...formData, iconType: type as any })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${formData.iconType === type
                        ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}>
                    {type === 'auto' ? '自动抓取' : type === 'preset' ? '预设图标' : 'AI 设计'}
                  </button>
                ))}
              </div>

              {/* Preview + Actions */}
              <div className="flex flex-col items-center p-5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-[#1a1a1a] shadow-md flex items-center justify-center border border-gray-100 dark:border-white/5 mb-4">
                  {formData.iconType === 'auto' && (
                    formData.imageBase64
                      ? <img src={formData.imageBase64} className="w-8 h-8 object-cover rounded" alt="Favicon" />
                      : <Globe className="text-gray-300 dark:text-neutral-600" size={32} />
                  )}
                  {formData.iconType === 'preset' && (
                    <SelectedIconComp className="text-[var(--blog-fg)]" size={32} />
                  )}
                  {formData.iconType === 'generated' && (
                    formData.customSvg
                      ? <div className="w-8 h-8 text-[var(--blog-fg)]" dangerouslySetInnerHTML={{ __html: formData.customSvg }} />
                      : <Wand2 className="text-gray-300 dark:text-neutral-600" size={32} />
                  )}
                </div>

                {formData.iconType === 'auto' && (
                  <button type="button" onClick={handleFetchFavicon} disabled={fetchingFavicon}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                    {fetchingFavicon ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} {fetchingFavicon ? '抓取中...' : '抓取网站图标'}
                  </button>
                )}

                {formData.iconType === 'preset' && (
                  <div className="w-full space-y-3">
                    <button type="button" onClick={handleRecommendIcon} disabled={recommendingIcon}
                      className="w-full px-4 py-2.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                      {recommendingIcon ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 智能推荐
                    </button>
                    <IconPicker selectedIcon={formData.presetIcon || 'Globe'} onSelect={(icon) => setFormData({ ...formData, presetIcon: icon })} />
                  </div>
                )}

                {formData.iconType === 'generated' && (
                  <div className="w-full">
                    <button type="button" onClick={handleGenerateSvg} disabled={generatingSvg}
                      className="w-full px-4 py-2.5 text-xs font-bold rounded-lg bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      {generatingSvg ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {generatingSvg ? 'AI 正在绘制...' : 'AI 设计新图标'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex gap-3 shrink-0 bg-white dark:bg-[#111]">
          <button type="button" onClick={onCancel} className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">
            取消
          </button>
          <button type="submit" form="project-form" disabled={saving}
            className="flex-[2] px-5 py-2.5 text-sm font-bold rounded-xl bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
