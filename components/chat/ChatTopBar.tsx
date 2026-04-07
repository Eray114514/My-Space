"use client";

import React from 'react';
import { ArrowLeft, History, Sparkles, ChevronDown, Check, Settings, Plus } from 'lucide-react';
import { AIModelKey, AI_MODELS } from '../../services/ai';
import { LiquidGlass } from '../LiquidGlass';

interface ChatTopBarProps {
    isHistoryOpen: boolean;
    setIsHistoryOpen: (open: boolean) => void;
    historyToggleRef: React.RefObject<HTMLButtonElement>;
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
                className="pointer-events-auto rounded-full shadow-xl transition-all sm:min-w-[300px]"
                innerClassName="flex items-center gap-1 sm:gap-2 px-1.5 py-1.5"
            >

                {/* 1. Home Button */}
                <button
                    onClick={onNavigateHome}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="返回主页"
                >
                    <ArrowLeft size={18} />
                </button>

                <div className="w-px h-4 bg-gray-300/50 dark:bg-white/10 mx-1"></div>

                {/* 2. History Toggle */}
                <button
                    ref={historyToggleRef}
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all ${isHistoryOpen ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                    <History size={16} />
                    <span className="hidden sm:inline">历史</span>
                </button>

                {/* 3. Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/10"
                    >
                        <Sparkles size={16} className="text-indigo-500" />
                        {/* @ts-ignore */}
                        <span className="max-w-[80px] sm:max-w-xs truncate">{selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading'}</span>
                        <ChevronDown size={14} className="opacity-50" />
                    </button>

                    {/* Model Dropdown */}
                    {isModelMenuOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 z-[60]">
                            <LiquidGlass className="rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2">
                                {availableModels.map(([key, m]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded-xl flex justify-between items-center transition-colors ${selectedModel === key ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-transparent'}`}
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
                <button onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)} className={`p-2 rounded-full transition-colors ${isSystemPromptOpen ? 'text-indigo-600 bg-indigo-50 dark:bg-white/10' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                    <Settings size={18} />
                </button>

                <button
                    onClick={onNewChat}
                    className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                    title="新对话"
                >
                    <Plus size={18} />
                </button>
            </LiquidGlass>
        </div>
    );
};
