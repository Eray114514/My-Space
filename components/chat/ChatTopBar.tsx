"use client";

import React from 'react';
import { ArrowLeft, History, Sparkles, ChevronDown, Check, Settings, Plus } from 'lucide-react';
import { AIModelKey, AI_MODELS } from '../../services/ai';
import { LiquidGlass } from '../LiquidGlass';

interface ChatTopBarProps {
    isHistoryOpen: boolean;
    setIsHistoryOpen: (open: boolean) => void;
    historyToggleRef: React.RefObject<HTMLButtonElement | null>;
    isModelMenuOpen: boolean;
    setIsModelMenuOpen: (open: boolean) => void;
    selectedModel: AIModelKey | null;
    setSelectedModel: (model: AIModelKey) => void;
    availableModels: [string, any][];
    isSystemPromptOpen: boolean;
    setIsSystemPromptOpen: (open: boolean) => void;
    onNewChat: () => void;
    onNavigateHome: () => void;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
    isHistoryOpen,
    setIsHistoryOpen,
    historyToggleRef,
    isModelMenuOpen,
    setIsModelMenuOpen,
    selectedModel,
    setSelectedModel,
    availableModels,
    isSystemPromptOpen,
    setIsSystemPromptOpen,
    onNewChat,
    onNavigateHome
}) => {
    return (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
            <LiquidGlass
                className="pointer-events-auto rounded-full transition-all sm:min-w-[300px]"
                innerClassName="flex items-center gap-1 sm:gap-2 px-1.5 py-1.5"
            >

                {/* 1. Home Button */}
                <button
                    onClick={onNavigateHome}
                    className="blog-icon-button"
                    title="返回主页"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="w-px h-4 bg-[var(--blog-line)] mx-1"></div>

                {/* 2. History Toggle */}
                <button
                    ref={historyToggleRef}
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${isHistoryOpen ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'text-[var(--blog-muted)] hover:bg-[var(--blog-fg-soft)] hover:text-[var(--blog-fg)]'}`}
                >
                    <History size={16} />
                    <span className="hidden sm:inline">历史</span>
                </button>

                {/* 3. Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)] transition-all border border-transparent hover:border-[var(--blog-line)]"
                    >
                        <Sparkles size={16} className="text-[var(--blog-fg)]" />
                        {/* @ts-ignore */}
                        <span className="max-w-[80px] sm:max-w-xs truncate">{selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading'}</span>
                        <ChevronDown size={14} className="opacity-50" />
                    </button>

                    {/* Model Dropdown */}
                    {isModelMenuOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 z-60">
                            <LiquidGlass className="glass-popover p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2">
                                {availableModels.map(([key, m]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded-xl flex justify-between items-center transition-colors ${selectedModel === key ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] border border-[var(--blog-fg)]' : 'hover:bg-[var(--blog-fg-soft)] text-[var(--blog-muted)] border border-transparent'}`}
                                    >
                                        {/* @ts-ignore */}
                                        {m.name}
                                        {selectedModel === key && <Check size={14} />}
                                    </button>
                                ))}
                            </LiquidGlass>
                        </div>
                    )}
                </div>

                <div className="flex-1"></div>

                {/* 4. Actions */}
                <button onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)} className={`p-2 rounded-full transition-colors ${isSystemPromptOpen ? 'text-[var(--blog-bg)] bg-[var(--blog-fg)]' : 'text-[var(--blog-muted)] hover:bg-[var(--blog-fg-soft)] hover:text-[var(--blog-fg)]'}`}>
                    <Settings size={18} />
                </button>

                <button
                    onClick={onNewChat}
                    className="blog-button-primary h-9 w-9 p-0"
                    title="新对话"
                >
                    <Plus size={18} />
                </button>
            </LiquidGlass>
        </div>
    );
};
