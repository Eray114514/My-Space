import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown } from 'lucide-react';
import { AIService, AI_MODELS, AIModelKey } from '../services/ai';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '你好！我是你的 AI 助手。有什么我可以帮你的吗？' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModelKey | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Check Auth Status independently
    const isAuthenticated = useMemo(() => {
        return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
    }, []);

    // Filter Models
    const availableModels = useMemo(() => {
        return Object.entries(AI_MODELS).filter(([_, model]) => {
            if (isAuthenticated) return true; // Admins see all
            return model.isFree; // Guests see only free
        });
    }, [isAuthenticated]);

    // Set default model
    useEffect(() => {
        if (!selectedModel && availableModels.length > 0) {
            // Prefer OpenRouter Free V3 for guests if available, or just first one
            const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
            setSelectedModel((defaultFree || availableModels[0][0]) as AIModelKey);
        }
    }, [availableModels, selectedModel]);

    // Auto scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedModel) return;

        const userMsg = input.trim();
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Update UI with user message
        const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newHistory);
        setIsLoading(true);

        // Add placeholder for AI response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        let fullResponse = '';

        try {
            await AIService.chatStream(
                newHistory,
                selectedModel,
                (chunk) => {
                    fullResponse += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'assistant', content: fullResponse };
                        return updated;
                    });
                }
            );
        } catch (error: any) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: `**Error:** ${error.message || 'Failed to generate response.'}` };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([{ role: 'assistant', content: '对话已清除。我们重新开始吧！' }]);
    };

    const currentModelConfig = selectedModel ? AI_MODELS[selectedModel] : null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-in fade-in duration-500">

            {/* Header / Model Selector */}
            <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
                <div className="relative">
                    <button
                        onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <Sparkles size={14} className="text-indigo-500" />
                        <span>{currentModelConfig?.shortName || 'Select Model'}</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>

                    {isModelMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-neutral-800/50 uppercase tracking-wider">
                                    {isAuthenticated ? 'Available Models' : 'Free Models Only'}
                                </div>
                                {availableModels.map(([key, model]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                                    >
                                        <span>{model.name}</span>
                                        {selectedModel === key && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={clearChat}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                    title="Clear Chat"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-6 pb-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'}`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800'
                            }`}>
                            {msg.role === 'user' ? (
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            ) : (
                                <div className="markdown-chat">
                                    <MarkdownRenderer content={msg.content || 'Thinking...'} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-4 px-4 sm:px-0 pb-4">
                <div className="relative bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
                        disabled={isLoading}
                        className="w-full bg-transparent border-none outline-none px-4 py-3.5 pr-12 min-h-[56px] max-h-[150px] resize-none dark:text-white placeholder-gray-400"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${!input.trim() || isLoading
                                ? 'text-gray-300 dark:text-neutral-700'
                                : 'bg-indigo-600 text-white shadow-md hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isLoading ? <StopCircle size={18} className="animate-pulse" /> : <Send size={18} />}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                    AI 可能会犯错。请核实重要信息。
                </p>
            </div>
        </div>
    );
};