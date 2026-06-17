"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { AIModelKey, AI_PROVIDERS, AIModelConfig, StoredModel } from '../../../services/ai';
import { Bot, Box, BrainCircuit, Sparkles, CheckCircle, RefreshCw, Plus, Trash2, Zap, Crown, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const PROVIDER_NAMES: Record<string, string> = {
  'deepseek': 'DeepSeek',
  'openrouter': 'OpenRouter'
};
const PROVIDER_ICONS: Record<string, any> = {
  'deepseek': BrainCircuit,
  'openrouter': Box
};

// --- Fetch Models Modal ---
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
      setLoading(true); setError('');
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
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="glass-popover relative w-full max-w-xl max-h-[70vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[var(--blog-line)] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--blog-line)]">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{PROVIDER_NAMES[provider] || provider} 模型</h3>
            <p className="text-xs text-gray-400 mt-0.5">从 API 实时获取，点击添加</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索模型..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border-0 text-sm outline-none focus:ring-2 focus:ring-[var(--blog-fg)]/20" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">获取中...</span>
            </div>
          )}
          {error && <div className="text-center py-12"><p className="text-red-500 text-sm">{error}</p></div>}
          {!loading && !error && filteredModels.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">无结果</div>
          )}
          {!loading && !error && filteredModels.map((m: any) => {
            const modelId = m.id;
            const key = `${provider}:${modelId}`;
            const isAdded = existingKeys.has(key);
            return (
              <div key={modelId} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name || modelId}</div>
                  <div className="text-xs text-gray-400 font-mono truncate">{modelId}</div>
                </div>
                <button onClick={() => handleAdd(m)} disabled={isAdded}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAdded
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default'
                    : 'bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 active:scale-95'
                  }`}>
                  {isAdded ? '已添加' : '添加'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
          <span className="text-xs text-gray-400">{filteredModels.length} 个模型</span>
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Unified Model Selector (selection only) ---
export const ModelSelector: React.FC<{
  label: string;
  description: string;
  value: AIModelKey;
  onChange: (key: AIModelKey) => void;
  models: StoredModel[];
}> = ({ label, description, value, onChange, models }) => {
  const allModels = useMemo(() => {
    const base: Record<string, AIModelConfig> = {};
    for (const m of models) {
      base[m.key] = { provider: m.provider, modelId: m.modelId, name: m.name, shortName: m.shortName, description: m.description, isFree: m.isFree, supportsThinking: m.supportsThinking };
    }
    return base;
  }, [models]);

  const currentModel = allModels[value];
  const [selectedProvider, setSelectedProvider] = useState<string>(currentModel?.provider || 'deepseek');

  const filteredModels = useMemo(() => {
    return Object.entries(allModels).filter(([_, model]) => model.provider === selectedProvider);
  }, [selectedProvider, allModels]);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-base font-bold text-[var(--blog-fg)]">{label}</h4>
        <p className="text-sm text-[var(--blog-muted)] mt-1 leading-relaxed">{description}</p>
      </div>

      {/* Provider pills */}
      <div className="flex gap-2">
        {AI_PROVIDERS.map(p => {
          const Icon = PROVIDER_ICONS[p.id] || Bot;
          const isActive = selectedProvider === p.id;
          return (
            <button key={p.id} onClick={() => setSelectedProvider(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md'
                : 'bg-[var(--blog-fg-soft)] text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-line)]'
              }`}>
              <Icon size={15} /> {PROVIDER_NAMES[p.id]}
            </button>
          );
        })}
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredModels.map(([key, model]) => {
          const isSelected = value === key;
          return (
            <div key={key}
              onClick={() => onChange(key as AIModelKey)}
              className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected
                ? 'border-[var(--blog-fg)] bg-[var(--blog-fg-soft)] shadow-sm'
                : 'border-[var(--blog-line)] bg-white/40 dark:bg-white/5 hover:bg-[var(--blog-fg-soft)] hover:border-[var(--blog-line)]'
              }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-sm text-[var(--blog-fg)] truncate">{model.name}</div>
                    <span className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${model.isFree
                      ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {model.isFree ? <><Zap size={9} /> 免费</> : <><Crown size={9} /> 付费</>}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--blog-muted)] mt-1 font-mono truncate">{model.modelId}</div>
                </div>
                {isSelected && <CheckCircle size={18} className="text-[var(--blog-fg)] shrink-0 ml-2" />}
              </div>
            </div>
          );
        })}
        {filteredModels.length === 0 && (
          <div className="col-span-full text-center text-sm text-[var(--blog-muted)] py-8">该服务商下暂无模型，请先在"模型管理"中获取并添加模型。</div>
        )}
      </div>
    </div>
  );
};

// --- Provider Manager (model list CRUD) ---
export const ProviderManager: React.FC<{
  models: StoredModel[];
  onChange: (models: StoredModel[]) => void;
}> = ({ models, onChange }) => {
  const [fetchModalProvider, setFetchModalProvider] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [form, setForm] = useState({ provider: 'deepseek', modelId: '', name: '', shortName: '', description: '', isFree: false });

  const existingKeys = useMemo(() => new Set(models.map(m => m.key)), [models]);

  const handleAddFromFetch = useCallback((model: StoredModel) => {
    if (models.some(m => m.key === model.key)) { toast('该模型已添加'); return; }
    const next = [...models, model];
    onChange(next);
    toast.success(`已添加: ${model.name}`);
  }, [models, onChange]);

  const handleAddCustom = () => {
    if (!form.modelId.trim() || !form.name.trim()) { toast.error('请填写模型 ID 和名称'); return; }
    const key = `${form.provider}:${form.modelId.trim()}`;
    if (models.some(m => m.key === key)) { toast.error('该模型已存在'); return; }
    const next = [...models, {
      key, provider: form.provider, modelId: form.modelId.trim(),
      name: form.name.trim(), shortName: form.shortName.trim() || form.name.trim().slice(0, 8),
      description: form.description.trim() || '自定义添加的模型', isFree: form.isFree,
      supportsThinking: form.modelId.includes('reasoner') || form.modelId.includes('r1') || form.modelId.includes('thinking') || form.modelId.includes('pro')
    }];
    onChange(next);
    toast.success('添加成功');
    setForm({ provider: 'deepseek', modelId: '', name: '', shortName: '', description: '', isFree: false });
    setIsAdding(false);
  };

  const handleDelete = (key: string) => {
    onChange(models.filter(m => m.key !== key));
    toast.success('已删除');
  };

  const handleToggleFree = (key: string) => {
    onChange(models.map(m => m.key === key ? { ...m, isFree: !m.isFree } : m));
  };

  const groupedModels = useMemo(() => {
    const groups: Record<string, StoredModel[]> = {};
    for (const m of models) {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [models]);

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--blog-line)] flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg text-[var(--blog-fg)] flex items-center gap-2">
            <Sparkles size={20} /> 模型管理
          </h3>
          <p className="text-sm text-[var(--blog-muted)] mt-1">获取服务商模型列表并添加，或手动添加自定义模型</p>
        </div>
        <div className="flex items-center gap-3">
          {AI_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setFetchModalProvider(p.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--blog-fg-soft)] hover:bg-[var(--blog-line)] transition-colors text-[var(--blog-fg)]">
              <RefreshCw size={14} /> {p.name}
            </button>
          ))}
          <button onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90 transition-opacity shadow-md">
            <Plus size={14} /> 手动添加
          </button>
        </div>
      </div>

      {fetchModalProvider && (
        <FetchModelsModal provider={fetchModalProvider} onClose={() => setFetchModalProvider(null)} onAdd={handleAddFromFetch} existingKeys={existingKeys} />
      )}

      {/* Manual Add Form */}
      {isAdding && (
        <div className="p-6 border-b border-[var(--blog-line)] bg-[var(--blog-fg-soft)] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              className="blog-input rounded-xl px-4 py-3 text-sm">
              {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.modelId} onChange={e => setForm(f => ({ ...f, modelId: e.target.value }))}
              placeholder="模型 ID (如 deepseek-v4-flash)" className="blog-input rounded-xl px-4 py-3 text-sm" />
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="显示名称" className="blog-input rounded-xl px-4 py-3 text-sm" />
            <input value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
              placeholder="短名称 (可选)" className="blog-input rounded-xl px-4 py-3 text-sm" />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="描述 (可选)" className="blog-input rounded-xl px-4 py-3 text-sm sm:col-span-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--blog-muted)] cursor-pointer">
            <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} className="rounded" />
            标记为免费层级（未登录用户可用，有速率限制）
          </label>
          <button onClick={handleAddCustom} className="blog-button-primary px-6 py-2.5 text-sm">确认添加</button>
        </div>
      )}

      {/* Model list by provider */}
      <div className="divide-y divide-[var(--blog-line)]">
        {Object.entries(groupedModels).map(([providerId, providerModels]) => {
          const Icon = PROVIDER_ICONS[providerId] || Bot;
          return (
            <div key={providerId}>
              <div className="flex items-center gap-3 px-6 py-3 bg-[var(--blog-fg-soft)]">
                <Icon size={16} className="text-[var(--blog-muted)]" />
                <span className="text-xs font-bold text-[var(--blog-muted)] uppercase tracking-wider">{PROVIDER_NAMES[providerId] || providerId}</span>
                <span className="blog-tag px-2 py-0.5 text-[10px]">{providerModels.length}</span>
              </div>
              <div className="px-6 py-3 space-y-1">
                {providerModels.map(m => (
                  <div key={m.key} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--blog-fg-soft)] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleFree(m.key)}
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${m.isFree
                          ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                        title={m.isFree ? '点击标记为付费' : '点击标记为免费'}
                      >
                        {m.isFree ? '免费' : '付费'}
                      </button>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--blog-fg)] truncate">{m.name}</div>
                        <div className="text-[11px] text-[var(--blog-muted)] font-mono truncate">{m.modelId}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(m.key)}
                      className="shrink-0 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {models.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--blog-muted)]">
          暂无模型，请点击上方按钮获取服务商模型列表，或手动添加
        </div>
      )}
    </div>
  );
};
