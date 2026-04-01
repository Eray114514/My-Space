import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../../../types';
import { AIModelKey, AIService } from '../../../services/ai';
import { Type, Link as LinkIcon, AlignLeft, Sparkles, Globe, Loader2, DownloadCloud, Wand2, X, Save } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LiquidGlass } from '../../../components/LiquidGlass';
import { IconPicker } from './IconPicker';
import { CURATED_ICONS } from '../constants';

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

  // Helper styles
  const inputGroupClass = "space-y-1.5";
  const labelClass = "block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1";
  const inputClass = "w-full px-4 py-3 bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl outline-none focus:bg-white/60 dark:focus:bg-black/40 focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/10 dark:text-white transition-all backdrop-blur-sm placeholder:text-gray-400/60 text-sm font-medium";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#eef2f6]/60 dark:bg-[#050505]/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <LiquidGlass className="w-full max-w-xl rounded-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col border border-white/40 dark:border-white/10">

        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/20 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project ? '编辑导航' : '新增导航'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">完善链接信息与视觉呈现</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Top Inputs */}
            <div className={inputGroupClass}>
              <label className={labelClass}><Type size={10} className="inline mr-1" /> 标题</label>
              <input required placeholder="例如：GitHub" className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}><LinkIcon size={10} className="inline mr-1" /> URL 链接</label>
              <input required type="url" placeholder="https://..." className={inputClass} value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}><AlignLeft size={10} className="inline mr-1" /> 描述</label>
              <textarea placeholder="简短的介绍..." className={`${inputClass} min-h-[80px] resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            {/* Icon Section - Reimagined */}
            <div className="pt-2">
              <label className={`${labelClass} mb-3 flex items-center gap-2`}>
                <Sparkles size={10} className="text-indigo-500" /> 图标设置
              </label>

              <div className="bg-white/30 dark:bg-white/5 rounded-2xl p-1.5 border border-white/20 dark:border-white/5 backdrop-blur-md">
                <div className="grid grid-cols-3 gap-1 mb-4 bg-gray-100/50 dark:bg-black/20 p-1 rounded-xl">
                  {['auto', 'preset', 'generated'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, iconType: type as any })}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${formData.iconType === type
                          ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm scale-[1.02]'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      {type === 'auto' ? '自动抓取' : type === 'preset' ? '预设图标' : 'AI 设计'}
                    </button>
                  ))}
                </div>

                {/* Preview Stage */}
                <div className="flex flex-col items-center justify-center p-6 relative">
                  {/* Spotlight Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none"></div>

                  <div className="relative w-20 h-20 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl flex items-center justify-center border border-white/60 dark:border-white/5 mb-4 group overflow-hidden">
                    {/* Icon Render */}
                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                      {formData.iconType === 'auto' && (
                        formData.imageBase64
                          ? <img src={formData.imageBase64} className="w-10 h-10 object-cover rounded-md shadow-sm" alt="Favicon" />
                          : <Globe className="text-gray-300 dark:text-neutral-600" size={40} />
                      )}
                      {formData.iconType === 'preset' && (
                        <SelectedIconComp className="text-indigo-600 dark:text-indigo-400 drop-shadow-md" size={40} />
                      )}
                      {formData.iconType === 'generated' && (
                        formData.customSvg
                          ? <div className="w-10 h-10 text-indigo-600 dark:text-indigo-400 [&>svg]:w-full [&>svg]:h-full drop-shadow-md" dangerouslySetInnerHTML={{ __html: formData.customSvg }} />
                          : <Wand2 className="text-gray-300 dark:text-neutral-600" size={40} />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons based on type */}
                  <div className="w-full relative z-10">
                    {formData.iconType === 'auto' && (
                      <button type="button" onClick={handleFetchFavicon} disabled={fetchingFavicon} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-white/10">
                        {fetchingFavicon ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />} {fetchingFavicon ? '抓取中...' : '抓取网站图标'}
                      </button>
                    )}

                    {formData.iconType === 'preset' && (
                      <div className="w-full">
                        <button type="button" onClick={handleRecommendIcon} disabled={recommendingIcon} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-white/10 mb-2">
                          {recommendingIcon ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 智能推荐
                        </button>
                        <IconPicker selectedIcon={formData.presetIcon || 'Globe'} onSelect={(icon) => setFormData({ ...formData, presetIcon: icon })} />
                      </div>
                    )}

                    {formData.iconType === 'generated' && (
                      <div className="w-full">
                        <button type="button" onClick={handleGenerateSvg} disabled={generatingSvg} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/20">
                          {generatingSvg ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {generatingSvg ? 'AI 正在绘制...' : 'AI 设计新图标'}
                        </button>
                        {/* Note: The shortName feature needs to be safely passed down if used. Here we keep it generic */}
                        <p className="text-[10px] text-center mt-2 text-gray-400">Powered by AI</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-4 mt-2">
              <button type="button" onClick={onCancel} className="flex-1 px-5 py-3 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors font-bold text-sm">
                取消
              </button>
              <button type="submit" disabled={saving} className="flex-[2] px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 font-bold text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </LiquidGlass>
    </div>,
    document.body
  );
};
