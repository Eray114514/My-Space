"use client";
import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus,
    Settings, FileText, Hash, X, ArrowLeft, Copy, RefreshCw, Edit2, Check, Save, History, Clock
} from 'lucide-react';
import { AIService, AIModelKey, AIModelConfig } from '../../services/ai';
import { StorageService, ChatSession, ChatMessage } from '../../services/storage';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { confirmToast } from '../../utils/toast';
import toast from 'react-hot-toast';
import { Article } from '../../types';
import { LiquidGlass } from '../../components/LiquidGlass';
import { MessageActions, getDisplayContent, CONTEXT_TAG_START, CONTEXT_TAG_END } from '../../components/chat/MessageItem';

const DEFAULT_SYSTEM_PROMPT = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";

import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatTopBar } from '../../components/chat/ChatTopBar';

// Helper for unique IDs
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substring(2);
};

// --- Helper Components ---

// --- Main Component ---

function ChatContent() {
    const searchParams = useSearchParams();
    const articleId = searchParams?.get('articleId') || null;
    const router = useRouter();

    // Data State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // UI State
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false); // AI Generating
    const [isMessagesLoading, setIsMessagesLoading] = useState(false); // History Fetching
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

    // Controls State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // References
    const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
    const [attachedArticles, setAttachedArticles] = useState<Article[]>([]);
    const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);

    // Model
    const [selectedModel, setSelectedModel] = useState<AIModelKey | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [allModels, setAllModels] = useState<Record<string, AIModelConfig>>({});
    const [isConfigLoading, setIsConfigLoading] = useState(true);

    // Reasoning display state
    const [reasoningMap, setReasoningMap] = useState<Record<string, string>>({});
    const [showReasoningMap, setShowReasoningMap] = useState<Record<string, boolean>>({});

    // Edit Mode State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editAttachedArticles, setEditAttachedArticles] = useState<{ title: string, summary: string, content: string }[]>([]);
    const [isEditPickerOpen, setIsEditPickerOpen] = useState(false);

    // Refs
    const scrollEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const historyToggleRef = useRef<HTMLButtonElement>(null); // Ref for the toggle button

    // Auth Check
    const isAdmin = useMemo(() => {
        return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
    }, []);

    // --- 1. Initialization & Data Loading ---

    const availableModels = useMemo(() => {
        if (Object.keys(allModels).length === 0) return [];
        return Object.entries(allModels).filter(([_, model]) => {
            if (isAdmin) return true;
            return model.isFree;
        });
    }, [isAdmin, allModels]);

    // Model Initialization Logic
    useEffect(() => {
        const initModel = async () => {
            if (!selectedModel && availableModels.length > 0) {
                let targetModel: AIModelKey | null = null;
                if (isAdmin) {
                    const settingModel = await StorageService.getGeneralAIModel();
                    if (settingModel && allModels[settingModel]) {
                        targetModel = settingModel;
                    }
                }
                if (!targetModel) {
                    const defaultFree = availableModels.find(([k, m]) => m.isFree)?.[0];
                    targetModel = (defaultFree || availableModels[0][0]) as AIModelKey;
                }
                setSelectedModel(targetModel);
            }
        };
        initModel();
    }, [availableModels, selectedModel, isAdmin, allModels]);

    // Close History when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Ignore clicks inside the drawer
            if (historyRef.current && historyRef.current.contains(event.target as Node)) {
                return;
            }
            // Ignore clicks on the toggle button itself (let onClick handle it)
            if (historyToggleRef.current && historyToggleRef.current.contains(event.target as Node)) {
                return;
            }
            // Close if currently open
            if (isHistoryOpen) {
                setIsHistoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isHistoryOpen]);

    useEffect(() => {
        const init = async () => {
            setIsConfigLoading(true);
            try {
                const [articles, list, models] = await Promise.all([
                    StorageService.getPublishedArticlesLight(),
                    StorageService.getChatSessions(isAdmin),
                    StorageService.getAIModels()
                ]);
                setAvailableArticles(articles);
                setSessions(list);
                const map: Record<string, AIModelConfig> = {};
                for (const m of models) {
                    map[m.key] = { provider: m.provider, modelId: m.modelId, name: m.name, shortName: m.shortName, description: m.description, isFree: m.isFree, supportsThinking: m.supportsThinking };
                }
                setAllModels(map);
            } catch (e) {
                console.error("Failed to load chat config", e);
            } finally {
                setIsConfigLoading(false);
            }
        };
        init();
    }, [isAdmin]);

    // Load Context from URL
    useEffect(() => {
        const loadArticleContext = async () => {
            if (articleId && !currentSessionId) {
                const article = await StorageService.getArticleById(articleId);
                if (article) setAttachedArticles([article]);
            }
        };
        loadArticleContext();
    }, [articleId, currentSessionId]);

    // Load Messages
    useEffect(() => {
        let isMounted = true;
        const loadMsgs = async () => {
            if (currentSessionId) {
                setIsMessagesLoading(true);
                setMessages([]);

                try {
                    const msgs = await StorageService.getChatMessages(currentSessionId, isAdmin);
                    if (isMounted) {
                        setMessages(msgs);
                        const list = await StorageService.getChatSessions(isAdmin);
                        const session = list.find(s => s.id === currentSessionId);
                        if (session) {
                            setSystemPrompt(session.systemPrompt || DEFAULT_SYSTEM_PROMPT);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load messages", e);
                } finally {
                    if (isMounted) setIsMessagesLoading(false);
                }
            } else {
                setMessages([]);
                if (!articleId) {
                    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
                    setAttachedArticles([]);
                }
                setIsMessagesLoading(false);
            }
        };
        loadMsgs();
        return () => { isMounted = false; };
    }, [currentSessionId, isAdmin, articleId]);

    useEffect(() => {
        if (!isMessagesLoading) {
            scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isLoading, isMessagesLoading, editingMessageId]);

    // --- 2. Core Actions ---

    const createNewSession = async (firstContent: string) => {
        const newId = generateId();
        const title = firstContent.slice(0, 20) + (firstContent.length > 20 ? '...' : '');
        const session: ChatSession = {
            id: newId,
            title: title || '新对话',
            systemPrompt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(newId);
        await StorageService.saveChatSession(session, [], isAdmin);
        return newId;
    };

    const executeAI = async (history: ChatMessage[], sessionId: string) => {
        if (!selectedModel) return;

        setIsLoading(true);
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        const aiId = generateId();
        const aiPlaceholder: ChatMessage = {
            id: aiId,
            sessionId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString()
        };

        // UI Update
        setMessages(prev => [...prev, aiPlaceholder]);

        // API Payload
        const apiMessages = history.map(m => ({ role: m.role as any, content: m.content }));
        apiMessages.unshift({ role: 'system', content: systemPrompt });

        let fullResponse = '';
        let fullReasoning = '';
        try {
            await AIService.chatStream(apiMessages, selectedModel, (chunk, reasoning) => {
                if (reasoning) fullReasoning = reasoning;
                fullResponse = chunk || fullResponse;
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullResponse } : m));
                if (fullReasoning) {
                    setReasoningMap(prev => ({ ...prev, [aiId]: fullReasoning }));
                }
            });

            const finalMsgs = [...history, { ...aiPlaceholder, content: fullResponse }];
            setMessages(finalMsgs);
            if (fullReasoning) {
                setReasoningMap(prev => ({ ...prev, [aiId]: fullReasoning }));
                setShowReasoningMap(prev => ({ ...prev, [aiId]: true }));
            }

            const updatedSession = sessions.find(s => s.id === sessionId);
            if (updatedSession) {
                const newSessionData = { ...updatedSession, updatedAt: new Date().toISOString() };
                setSessions(prev => prev.map(s => s.id === sessionId ? newSessionData : s));
                await StorageService.saveChatSession(newSessionData, finalMsgs, isAdmin);
            } else {
                await StorageService.saveChatSession({
                    id: sessionId,
                    title: 'Conversation',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    systemPrompt
                }, finalMsgs, isAdmin);
            }

        } catch (e: any) {
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: `**Error:** ${e.message}` } : m));
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading) return;

        let sessionId = currentSessionId;
        if (!sessionId) sessionId = await createNewSession(input || '新对话');

        let content = input.trim();
        if (attachedArticles.length > 0) {
            const refs = attachedArticles.map(a => `\n标题：${a.title}\n摘要：${a.summary}\n内容：\n${a.content}\n`).join('\n---\n');
            content = `${content}\n\n${CONTEXT_TAG_START}\n${refs}\n${CONTEXT_TAG_END}`;
        }

        const userMsg: ChatMessage = {
            id: generateId(),
            sessionId,
            role: 'user',
            content,
            createdAt: new Date().toISOString()
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput('');
        setAttachedArticles([]);

        await executeAI(newHistory, sessionId);
    };

    const handleRegenerate = async (msgIndex: number) => {
        if (isLoading || !currentSessionId || isMessagesLoading) return;
        const historyToKeep = messages.slice(0, msgIndex);
        setMessages(historyToKeep);
        await executeAI(historyToKeep, currentSessionId);
    };

    // --- Smart Edit Logic ---

    const handleEdit = (msg: ChatMessage) => {
        setEditingMessageId(msg.id);
        setIsEditPickerOpen(false);

        const regex = new RegExp(`${CONTEXT_TAG_START}([\\s\\S]*?)${CONTEXT_TAG_END}`);
        const match = regex.exec(msg.content);

        if (match) {
            const fullContext = match[1]; // Inner content
            const textOnly = msg.content.replace(match[0], '').trim();

            // Parse all articles from context
            const chunks = fullContext.split('\n---\n').filter(c => c.trim().length > 0);
            const parsedArticles = chunks.map(chunk => {
                const titleMatch = chunk.match(/标题：(.*?)\n/);
                const summaryMatch = chunk.match(/摘要：(.*?)\n/);
                const contentMatch = chunk.match(/内容：\n([\s\S]*?)$/); // Assuming content is last
                return {
                    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
                    summary: summaryMatch ? summaryMatch[1].trim() : '',
                    content: contentMatch ? contentMatch[1].trim() : ''
                };
            });

            setEditContent(textOnly);
            setEditAttachedArticles(parsedArticles);
        } else {
            setEditContent(msg.content);
            setEditAttachedArticles([]);
        }
    };

    const submitEdit = async () => {
        if (!currentSessionId || !editingMessageId) return;

        const msgIndex = messages.findIndex(m => m.id === editingMessageId);
        if (msgIndex === -1) return;

        const historyPrefix = messages.slice(0, msgIndex);

        let finalContent = editContent;
        if (editAttachedArticles.length > 0) {
            const refs = editAttachedArticles.map(a => `\n标题：${a.title}\n摘要：${a.summary}\n内容：\n${a.content}\n`).join('\n---\n');
            finalContent = `${editContent}\n\n${CONTEXT_TAG_START}\n${refs}\n${CONTEXT_TAG_END}`;
        }

        const updatedMsg: ChatMessage = {
            ...messages[msgIndex],
            content: finalContent,
            createdAt: new Date().toISOString()
        };

        const newHistory = [...historyPrefix, updatedMsg];
        setMessages(newHistory);
        setEditingMessageId(null);
        setEditAttachedArticles([]);

        await executeAI(newHistory, currentSessionId);
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (await confirmToast("删除此会话？")) {
            await StorageService.deleteChatSession(id, isAdmin);
            setSessions(p => p.filter(s => s.id !== id));
            if (currentSessionId === id) {
                setCurrentSessionId(null);
                setMessages([]);
            }
            toast.success('会话已删除');
        }
    };

    const handleArticleClick = (article: Article) => {
        setAttachedArticles(prev => {
            const exists = prev.some(a => a.id === article.id);
            if (exists) {
                return prev.filter(a => a.id !== article.id);
            } else {
                return [...prev, article];
            }
        });
        textareaRef.current?.focus();
    };

    const handleEditArticleAdd = (article: Article) => {
        setEditAttachedArticles(prev => {
            const exists = prev.some(a => a.title === article.title); // Match by title since we might not have ID for parsed ones
            if (!exists) {
                return [...prev, { title: article.title, summary: article.summary, content: article.content }];
            }
            return prev;
        });
        setIsEditPickerOpen(false);
    };

    // --- 3. UI Helpers ---

    const handleCopy = (text: string) => {
        const clean = text.replace(new RegExp(`${CONTEXT_TAG_START}[\\s\\S]*?${CONTEXT_TAG_END}`, 'g'), '').trim();
        navigator.clipboard.writeText(clean);
    };

    // --- Render ---

    if (isConfigLoading) {
        return (
            <div className="h-dvh flex flex-col items-center justify-center text-[var(--blog-muted)] gap-3 animate-pulse">
                <div className="w-10 h-10 border-2 border-[var(--blog-fg)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium tracking-wide">正在加载模型配置…</span>
            </div>
        );
    }

    if (availableModels.length === 0) {
        return (
            <div className="h-dvh flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto text-[var(--blog-fg)]">
                        <Bot size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[var(--blog-fg)] mb-1">尚未配置 AI 模型</h2>
                        <p className="text-sm text-[var(--blog-muted)]">{isAdmin ? '请前往控制台添加至少一个可用模型。' : '管理员尚未配置可用模型，请稍后再试。'}</p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => router.push('/admin')} className="blog-button-primary px-6 py-2.5 text-sm">
                            前往控制台
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-transparent relative">

            {/* --- Top Floating Glass Bar (Navigation & Controls) --- */}
            <ChatTopBar
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
                historyToggleRef={historyToggleRef}
                isModelMenuOpen={isModelMenuOpen}
                setIsModelMenuOpen={setIsModelMenuOpen}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                availableModels={availableModels}
                allModels={allModels}
                isSystemPromptOpen={isSystemPromptOpen}
                setIsSystemPromptOpen={setIsSystemPromptOpen}
                onNewChat={() => { setCurrentSessionId(null); setMessages([]); }}
                onNavigateHome={() => router.push('/')}
            />

            {/* --- History Drawer (Floating Glass Panel) --- */}
            <ChatSidebar 
                isHistoryOpen={isHistoryOpen}
                historyRef={historyRef}
                sessions={sessions}
                currentSessionId={currentSessionId}
                isAdmin={isAdmin}
                onClose={() => setIsHistoryOpen(false)}
                onSelectSession={(id) => {
                    setCurrentSessionId(id);
                    setIsHistoryOpen(false);
                }}
                onDeleteSession={handleDeleteSession}
            />

            {/* --- Main Chat Area --- */}
            <div className="flex-1 flex flex-col h-full min-w-0 relative pt-20">

                {/* System Prompt Panel (Absolute Overlay) */}
                {isSystemPromptOpen && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-60 animate-in slide-in-from-top-2 fade-in">
                        <LiquidGlass variant="popover" className="glass-popover p-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">系统提示词 (System Prompt)</label>
                                <button onClick={() => setIsSystemPromptOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="blog-input w-full h-24 rounded-xl p-3 text-sm resize-none" />
                        </LiquidGlass>
                    </div>
                )}

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-0 pb-28 pt-4 custom-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {isMessagesLoading ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-3 animate-pulse">
                                <LiquidGlass className="w-12 h-12 rounded-full" innerClassName="flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-[var(--blog-fg)] border-t-transparent rounded-full animate-spin" />
                                </LiquidGlass>
                                <span className="text-xs font-medium tracking-wide">同步历史记录...</span>
                            </div>
                        ) : (
                            <>
                                {messages.length === 0 && attachedArticles.length === 0 && (
                                    <div className="h-[50vh] flex flex-col items-center justify-center text-[var(--blog-muted)] space-y-6 animate-in fade-in duration-700">
                                        <LiquidGlass className="glass-card w-24 h-24" innerClassName="flex items-center justify-center">
                                            <Bot size={48} className="text-[var(--blog-fg)]/80 drop-shadow-lg" />
                                        </LiquidGlass>
                                        <div className="text-center space-y-2">
                                            <p className="font-semibold tracking-wide text-lg text-[var(--blog-fg)]">How can I help you today?</p>
                                            <p className="text-xs text-[var(--blog-muted)] font-mono">Powered by {selectedModel ? (allModels[selectedModel] as any)?.shortName : 'AI'}</p>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isLast = index === messages.length - 1;
                                    const isUser = msg.role === 'user';
                                    const isEditing = editingMessageId === msg.id;
                                    const reasoning = reasoningMap[msg.id];
                                    const showReasoning = showReasoningMap[msg.id];

                                    return (
                                        <div key={msg.id} className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : ''} ${isEditing ? 'relative z-50' : 'relative'}`}>
                                            {/* Avatar */}
                                            <div className={`glass-card w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--blog-line)] shadow-lg transition-transform hover:scale-105 ${isUser ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)]' : 'bg-[var(--blog-fg-soft)] text-[var(--blog-fg)]'}`}>
                                                {isUser ? <User size={20} /> : <Bot size={22} />}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                {isEditing ? (
                                                    <LiquidGlass className="glass-card w-full min-w-[300px] p-3 animate-in fade-in zoom-in-95 duration-200">
                                                        {/* Edit Mode Content */}
                                                        <textarea
                                                            value={editContent}
                                                            onChange={e => setEditContent(e.target.value)}
                                                            className="w-full bg-transparent outline-none text-[15px] resize-none mb-2 min-h-[100px] p-1 text-[var(--blog-fg)] font-mono"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                                            <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">取消</button>
                                                            <button onClick={submitEdit} className="blog-button-primary px-4 py-1.5 text-xs">
                                                                <Save size={12} /> 保存
                                                            </button>
                                                        </div>
                                                    </LiquidGlass>
                                                ) : (
                                                    <>
                                                        {reasoning && (
                                                            <div className="w-full mb-2">
                                                                <button
                                                                    onClick={() => setShowReasoningMap(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                                                                    className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors mb-1"
                                                                >
                                                                    <Sparkles size={12} />
                                                                    {showReasoning ? '隐藏思考过程' : '查看思考过程'}
                                                                </button>
                                                                {showReasoning && (
                                                                    <LiquidGlass className="glass-card p-3 text-[13px] leading-6 text-amber-800 dark:text-amber-200 bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
                                                                        <p className="whitespace-pre-wrap font-mono opacity-90">{reasoning}</p>
                                                                    </LiquidGlass>
                                                                )}
                                                            </div>
                                                        )}
                                                        <LiquidGlass className={`px-5 py-4 text-[15px] leading-7 relative overflow-x-auto ${isUser
                                                                ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] rounded-2xl rounded-tr-sm'
                                                                : 'glass-card text-[var(--blog-fg)] rounded-2xl rounded-tl-sm'
                                                            }`}>
                                                            {isUser ? <p className="whitespace-pre-wrap wrap-break-word">{getDisplayContent(msg.content)}</p> : <MarkdownRenderer content={msg.content} />}
                                                        </LiquidGlass>
                                                        <MessageActions
                                                            role={msg.role as any}
                                                            content={msg.content}
                                                            isLast={isLast}
                                                            onCopy={() => handleCopy(msg.content)}
                                                            onEdit={isUser ? () => handleEdit(msg) : undefined}
                                                            onRegenerate={(isLast && !isUser) ? () => handleRegenerate(index) : undefined}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollEndRef} className="h-4" />
                            </>
                        )}
                    </div>
                </div>

                {/* --- Floating Input Area (FIXED BOTTOM) --- */}
                <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
                    <div className="w-full max-w-3xl relative pointer-events-auto">
                        {/* Context Tags (Floating above input) */}
                        {attachedArticles.length > 0 && (
                            <div className="absolute bottom-full left-4 mb-3 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                                {attachedArticles.map(a => (
                                    <LiquidGlass key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--blog-fg)]">
                                        <FileText size={12} />
                                        <span className="truncate max-w-[150px]">{a.title}</span>
                                        <button onClick={() => setAttachedArticles(prev => prev.filter(x => x.id !== a.id))} className="hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><X size={12} /></button>
                                    </LiquidGlass>
                                ))}
                            </div>
                        )}

                        {/* Article Picker Popover */}
                        {isArticlePickerOpen && (
                            <div className="absolute bottom-full left-0 mb-3 w-72 z-50">
                                <LiquidGlass variant="popover" className="glass-popover overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-3 border-b border-[var(--blog-line)] text-xs font-bold text-[var(--blog-muted)] flex items-center gap-2"><Hash size={12} /> 引用文章上下文</div>
                                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                        {availableArticles.map(article => {
                                            const isSelected = attachedArticles.some(a => a.id === article.id);
                                            return (
                                                <button key={article.id} onClick={() => handleArticleClick(article)} className={`w-full text-left px-3 py-2.5 text-sm rounded-xl truncate transition-all flex items-center gap-2 group ${isSelected ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-md' : 'hover:bg-[var(--blog-fg-soft)] text-[var(--blog-fg)]'}`}>
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'border-[var(--blog-bg)] bg-transparent' : 'border-[var(--blog-line)]'}`}>
                                                        {isSelected && <Check size={10} />}
                                                    </div>
                                                    <span className="truncate font-medium">{article.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </LiquidGlass>
                            </div>
                        )}

                        {/* Input Capsule - High Quality Texture */}
                        <LiquidGlass
                            variant="panel"
                            className="rounded-[2.5rem] transition-all duration-300 focus-within:scale-[1.01]"
                            innerClassName="flex items-end gap-2 p-2"
                        >
                            <button
                                onClick={() => setIsArticlePickerOpen(!isArticlePickerOpen)}
                                className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-all ${attachedArticles.length > 0 ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)]' : 'text-[var(--blog-muted)] hover:text-[var(--blog-fg)] hover:bg-[var(--blog-fg-soft)]'}`}
                                title="引用文章 (#)"
                            >
                                <Hash size={20} />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => { setInput(e.target.value); if (e.target.value.endsWith('#')) setIsArticlePickerOpen(true); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
                                disabled={isLoading || isMessagesLoading}
                                className="flex-1 bg-transparent border-none outline-none py-3 max-h-[150px] min-h-[46px] resize-none text-[15px] text-[var(--blog-fg)] placeholder:text-[var(--blog-muted)]/60 custom-scrollbar font-medium"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading}
                                className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-all duration-300 ${(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading ? 'text-[var(--blog-muted)]/45 bg-transparent' : 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-lg hover:scale-105 active:scale-95'}`}
                            >
                                {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} className="ml-0.5" />}
                            </button>
                        </LiquidGlass>
                    </div>
                </div>

            </div>
        </div>
    );
};export default function Chat() { return <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}><ChatContent /></Suspense>; }
