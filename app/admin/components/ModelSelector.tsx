"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { AIModelKey, AI_PROVIDERS, AIModelConfig } from '../../../services/ai';
import { Bot, Box, BrainCircuit, Sparkles, CheckCircle, RefreshCw, Plus, Trash2, Zap, Crown, X, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const PROVIDER_NAMES: Record<string, string> = {
  'deepseek': 'DeepSeek',
  'openrouter': 'OpenRouter'
};
const PROVIDER_ICONS: Record<string, any> = {
  'deepseek': BrainCircuit,
  'openrouter': Box
};

interface StoredModel extends AIModelConfig {
  key: string;
}

const STORAGE_KEY = 'admin_custom_models';
const SVG_MODEL_KEY = 'admin_svg_model';

export function loadStoredModels(): StoredModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredModels(models: StoredModel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

function getSvgModelKey(): string {
  try { return localStorage.getItem(SVG_MODEL_KEY) || ''; } catch { return ''; }
}
function setSvgModelKey(key: string) {
  localStorage.setItem(SVG_MODEL_KEY, key);
}

// --- Fetch Models Modal (fixed overlay, not inline) ---
const FetchModelsModal: React.FC<{
  provider: string;
  onClose: () => void;
  onAdd: (model: StoredModel) => void;
  existingKeys: Set<string>;
}> = ({ provider, onClose, onAdd, existingKeys }) => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/fetch-models?provider=${provider}`);
        const data = await res.json();
        if (data.error) setError(data.error);
        else setModels(data.models || []);
      } catch { setError('获取模型列表失败'); }
      finally { setLoading(false); }
    };
    fetchModels();
  }, [provider]);

  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const q = search.toLowerCase();
    return models.filter((m: any) =>
      (m.id || '').toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q)
    );
  }, [models, search]);

  const handleAdd = (m: any) => {
    const modelId = m.id;
    const key = `${provider}:${modelId}`;
    if (existingKeys.has(key)) { toast('该模型已添加'); return; }
    const shortName = modelId.split('/').pop()?.slice(0, 12) || modelId.slice(0, 12);
    const name = m.name || modelId.split('/').pop() || modelId;
    const description = m.description || (m.context_length ? `Context: ${m.context_length}` : '');
    onAdd({
      key, provider, modelId, name, shortName, description,
      isFree: false,
      supportsThinking: modelId.includes('reasoner') || modelId.includes('r1') || modelId.includes('thinking') || modelId.includes('pro')
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {PROVIDER_NAMES[provider] || provider} 模型
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">从 API 实时获取，点击添加</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索模型..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2">
              <RefreshCw size={18} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">获取中...</span>
            </div>
          )}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && filteredModels.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">无结果</div>
          )}
          {!loading && !error && filteredModels.map((m: any) => {
            const modelId = m.id;
            const key = `${provider}:${modelId}`;
            const isAdded = existingKeys.has(key);
            return (
              <div key={modelId} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name || modelId}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">{modelId}</div>
                </div>
                <button
                  onClick={() => handleAdd(m)}
                  disabled={isAdded}
                  className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${isAdded
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default'
                    : 'bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 active:scale-95'
                  }`}
                >
                  {isAdded ? '已添加' : '添加'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-400">{filteredModels.length} 个模型</span>
          <button onClick={onClose} className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Model Selector (clean, no glass) ---
export const ModelSelector: React.FC<{
  label: string;
  description: string;
  value: AIModelKey;
  onChange: (key: AIModelKey) => void;
}> = ({ label, description, value, onChange }) => {
  const [customModels, setCustomModels] = useState<StoredModel[]>(loadStoredModels);
  const allModels = useMemo(() => {
    const base: Record<string, AIModelConfig> = {};
    for (const m of customModels) {
      base[m.key] = { provider: m.provider, modelId: m.modelId, name: m.name, shortName: m.shortName, description: m.description, isFree: m.isFree, supportsThinking: m.supportsThinking };
    }
    return base;
  }, [customModels]);

  const currentModel = allModels[value];
  const [selectedProvider, setSelectedProvider] = useState<string>(currentModel?.provider || 'deepseek');

  const filteredModels = useMemo(() => {
    return Object.entries(allModels).filter(([_, model]) => model.provider === selectedProvider);
  }, [selectedProvider, allModels]);

  const handleToggleFree = useCallback((key: string) => {
    setCustomModels(prev => {
      const next = prev.map(m => m.key === key ? { ...m, isFree: !m.isFree } : m);
      saveStoredModels(next);
      return next;
    });
  }, []);

  const handleDelete = useCallback((key: string) => {
    setCustomModels(prev => {
      const next = prev.filter(m => m.key !== key);
      saveStoredModels(next);
      return next;
    });
    if (value === key) {
      const fallback = Object.keys(allModels).find(k => allModels[k].provider === selectedProvider && k !== key);
      if (fallback) onChange(fallback);
    }
    toast.success('已删除');
  }, [value, allModels, selectedProvider, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{label}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Provider pills */}
      <div className="flex gap-1.5">
        {AI_PROVIDERS.map(p => {
          const Icon = PROVIDER_ICONS[p.id] || Bot;
          const isActive = selectedProvider === p.id;
          return (
            <button key={p.id} onClick={() => setSelectedProvider(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)]'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              <Icon size={13} />
              {PROVIDER_NAMES[p.id]}
            </button>
          );
        })}
      </div>

      {/* Model list */}
      <div className="space-y-1">
        {filteredModels.map(([key, model]) => {
          const isSelected = value === key;
          return (
            <div key={key}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer ${isSelected
                ? 'bg-[var(--blog-fg)]/5 dark:bg-white/5 ring-1 ring-[var(--blog-fg)]/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => onChange(key as AIModelKey)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {isSelected && <CheckCircle size={14} className="text-[var(--blog-fg)] shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{model.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFree(key); }}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${model.isFree
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {model.isFree ? '免费' : '付费'}
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono truncate">{model.modelId}</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(key); }}
                className="shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
        {filteredModels.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-6">该服务商下暂无模型，请先在"模型管理"中添加。</div>
        )}
      </div>
    </div>
  );
};

// --- Provider Manager (clean, no glass) ---
export const ProviderManager: React.FC = () => {
  const [customModels, setCustomModels] = useState<StoredModel[]>(loadStoredModels);
  const [fetchModalProvider, setFetchModalProvider] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const [form, setForm] = useState({ provider: 'deepseek', modelId: '', name: '', shortName: '', description: '', isFree: false });

  const existingKeys = useMemo(() => new Set(customModels.map(m => m.key)), [customModels]);

  const handleAddFromFetch = useCallback((model: StoredModel) => {
    setCustomModels(prev => {
      if (prev.some(m => m.key === model.key)) { toast('该模型已添加'); return prev; }
      const next = [...prev, model];
      saveStoredModels(next);
      toast.success(`已添加: ${model.name}`);
      return next;
    });
  }, []);

  const handleAddCustom = () => {
    if (!form.modelId.trim() || !form.name.trim()) { toast.error('请填写模型 ID 和名称'); return; }
    const key = `${form.provider}:${form.modelId.trim()}`;
    setCustomModels(prev => {
      if (prev.some(m => m.key === key)) { toast.error('该模型已存在'); return prev; }
      const next = [...prev, {
        key, provider: form.provider, modelId: form.modelId.trim(),
        name: form.name.trim(), shortName: form.shortName.trim() || form.name.trim().slice(0, 8),
        description: form.description.trim() || '自定义添加的模型', isFree: form.isFree,
        supportsThinking: form.modelId.includes('reasoner') || form.modelId.includes('r1') || form.modelId.includes('thinking') || form.modelId.includes('pro')
      }];
      saveStoredModels(next);
      toast.success('添加成功');
      return next;
    });
    setForm({ provider: 'deepseek', modelId: '', name: '', shortName: '', description: '', isFree: false });
    setIsAdding(false);
  };

  const handleDelete = (key: string) => {
    setCustomModels(prev => { const next = prev.filter(m => m.key !== key); saveStoredModels(next); toast.success('已删除'); return next; });
  };

  const handleToggleFree = (key: string) => {
    setCustomModels(prev => { const next = prev.map(m => m.key === key ? { ...m, isFree: !m.isFree } : m); saveStoredModels(next); return next; });
  };

  const groupedModels = useMemo(() => {
    const groups: Record<string, StoredModel[]> = {};
    for (const m of customModels) {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [customModels]);

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} /> 模型管理
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">获取服务商模型列表并添加，或手动添加</p>
        </div>
        <div className="flex items-center gap-2">
          {AI_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setFetchModalProvider(p.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
              <RefreshCw size={12} />
              获取 {p.name}
            </button>
          ))}
          <button onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 transition-opacity">
            <Plus size={12} /> 手动添加
          </button>
        </div>
      </div>

      {/* Fetch Modal */}
      {fetchModalProvider && (
        <FetchModelsModal provider={fetchModalProvider} onClose={() => setFetchModalProvider(null)} onAdd={handleAddFromFetch} existingKeys={existingKeys} />
      )}

      {/* Manual Add Form */}
      {isAdding && (
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20">
              {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.modelId} onChange={e => setForm(f => ({ ...f, modelId: e.target.value }))}
              placeholder="模型 ID (如 deepseek-v4-flash)" className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20" />
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="显示名称" className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20" />
            <input value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
              placeholder="短名称 (可选)" className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20" />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="描述 (可选)" className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20 sm:col-span-2" />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} className="rounded" />
            标记为免费层级（未登录用户可用，有速率限制）
          </label>
          <button onClick={handleAddCustom} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 transition-opacity">确认添加</button>
        </div>
      )}

      {/* Model list by provider */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Object.entries(groupedModels).map(([providerId, models]) => {
          const Icon = PROVIDER_ICONS[providerId] || Bot;
          const isExpanded = expandedProvider === providerId || Object.keys(groupedModels).length === 1;
          return (
            <div key={providerId}>
              <button
                onClick={() => setExpandedProvider(isExpanded && Object.keys(groupedModels).length > 1 ? null : providerId)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{PROVIDER_NAMES[providerId] || providerId}</span>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-medium text-gray-500">{models.length}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-5 pb-3 space-y-0.5">
                  {models.map(m => (
                    <div key={m.key} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleFree(m.key)}
                          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${m.isFree
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                          title={m.isFree ? '点击标记为付费' : '点击标记为免费'}
                        >
                          {m.isFree ? '免费' : '付费'}
                        </button>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono truncate">{m.modelId}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(m.key)}
                        className="shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {customModels.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          暂无模型，点击上方按钮获取或手动添加
        </div>
      )}
    </div>
  );
};

// --- SVG Model Selector (clean, no glass) ---
export const SvgModelSelector: React.FC = () => {
  const [svgModel, setSvgModel] = useState<string>(getSvgModelKey);
  const [customModels] = useState<StoredModel[]>(loadStoredModels);
  const allModels = useMemo(() => {
    const base: Record<string, AIModelConfig> = {};
    for (const m of customModels) {
      base[m.key] = { provider: m.provider, modelId: m.modelId, name: m.name, shortName: m.shortName, description: m.description, isFree: m.isFree, supportsThinking: m.supportsThinking };
    }
    return base;
  }, [customModels]);

  const handleChange = (key: string) => { setSvgModel(key); setSvgModelKey(key); toast.success('SVG 绘图模型已更新'); };
  const current = allModels[svgModel];

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles size={16} /> SVG 绘图模型
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">选择用于生成 SVG 图标的 AI 模型</p>
      </div>
      {Object.keys(allModels).length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">请先在"模型管理"中添加模型</div>
      ) : (
        <div className="p-3 space-y-0.5">
          {Object.entries(allModels).map(([key, model]) => {
            const isSelected = svgModel === key;
            return (
              <div key={key}
                onClick={() => handleChange(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isSelected
                  ? 'bg-[var(--blog-fg)]/5 dark:bg-white/5 ring-1 ring-[var(--blog-fg)]/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}>
                {isSelected && <CheckCircle size={14} className="text-[var(--blog-fg)] shrink-0" />}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{model.modelId}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {current && (
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
          当前: <span className="font-medium text-gray-900 dark:text-white">{current.name}</span>
        </div>
      )}
    </div>
  );
};
