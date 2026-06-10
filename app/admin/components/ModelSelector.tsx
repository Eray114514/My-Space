"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { AIModelKey, AI_MODELS } from '../../../services/ai';
import { Bot, Box, BrainCircuit, Sparkles, CheckCircle } from 'lucide-react';

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

export const ModelSelector: React.FC<{
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
    <div className="glass-card border border-[var(--blog-line)] p-6">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          {label}
          <span className="blog-tag px-2 py-0.5">当前: {currentModel?.name || '未设置'}</span>
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-light leading-relaxed">{description}</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {PROVIDERS.map(p => {
          const Icon = PROVIDER_ICONS[p] || Bot;
          const isActive = selectedProvider === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${isActive
                  ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] border-[var(--blog-fg)] shadow-md'
                  : 'bg-white/50 dark:bg-white/5 border-transparent text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/10'
                }`}
            >
              <Icon size={16} />
              {PROVIDER_NAMES[p] || p}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredModels.map(([key, model]) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key as AIModelKey)}
              className={`relative text-left p-4 rounded-2xl border transition-all duration-300 ${isSelected
                  ? 'border-[var(--blog-fg)] bg-[var(--blog-fg-soft)] shadow-sm'
                  : 'border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{model.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 opacity-80">{model.description}</div>
                </div>
                {isSelected && <CheckCircle size={18} className="text-[var(--blog-fg)] shrink-0" />}
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
