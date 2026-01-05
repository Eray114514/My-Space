import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus,
    Settings, FileText, Hash, X, ArrowLeft, Copy, RefreshCw, Edit2, Check, Save, History, Clock
} from 'lucide-react';
import { AIService, AI_MODELS, AIModelKey } from '../services/ai';
import { StorageService, ChatSession, ChatMessage } from '../services/storage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Article } from '../types';
import { LiquidGlass } from '../components/LiquidGlass';

const DEFAULT_SYSTEM_PROMPT = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";
const CONTEXT_TAG_START = "<hidden_context>";
const CONTEXT_TAG_END = "</hidden_context>";

// Helper for unique IDs
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString() + Math.random().toString(36).substring(2);
};

// --- Helper Components ---

interface MessageActionsProps {
    role: 'user' | 'assistant';
    content: string;
    isLast: boolean;
    onCopy: () => void;
    onRegenerate?: () => void;
    onEdit?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ role, isLast, onCopy, onRegenerate, onEdit }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1.5 ${role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
            <button onClick={handleCopy} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="复制">
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>

            {role === 'user' && onEdit && (
                <button onClick={onEdit} className="p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="编辑">
                    <Edit2 size={12} />
                </button>
            )}

            {role === 'assistant' && onRegenerate && (
                <button onClick={onRegenerate} className="p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="重新生成">
                    <RefreshCw size={12} />
                </button>
            )}
        </div>
    );
};

// --- Main Component ---

export const Chat: React.FC = () => {
    const [searchParams] = useSearchParams();
    const articleId = searchParams.get('articleId');
    const navigate = useNavigate();

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
        if (Object.keys(AI_MODELS).length === 0) return [];
        return Object.entries(AI_MODELS).filter(([_, model]) => {
            // @ts-ignore
            if (isAdmin) return true;
            // @ts-ignore
            return model.isFree;
        });
    }, [isAdmin]);

    // Model Initialization Logic (Updated for Admin Default)
    useEffect(() => {
        const initModel = async () => {
            if (!selectedModel && availableModels.length > 0) {
                let targetModel: AIModelKey | null = null;
                if (isAdmin) {
                    const settingModel = await StorageService.getGeneralAIModel();
                    // @ts-ignore
                    if (settingModel && AI_MODELS[settingModel]) {
                        targetModel = settingModel;
                    }
                }
                if (!targetModel) {
                    const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
                    targetModel = (defaultFree || availableModels[0][0]) as AIModelKey;
                }
                setSelectedModel(targetModel);
            }
        };
        initModel();
    }, [availableModels, selectedModel, isAdmin]);

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
            const articles = await StorageService.getArticles();
            setAvailableArticles(articles.filter(a => a.isPublished));
            const list = await StorageService.getChatSessions(isAdmin);
            setSessions(list);
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
        try {
            await AIService.chatStream(apiMessages, selectedModel, (chunk) => {
                fullResponse += chunk;
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullResponse } : m));
            });

            const finalMsgs = [...history, { ...aiPlaceholder, content: fullResponse }];
            setMessages(finalMsgs);

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
        if (window.confirm("删除此会话？")) {
            await StorageService.deleteChatSession(id, isAdmin);
            setSessions(p => p.filter(s => s.id !== id));
            if (currentSessionId === id) {
                setCurrentSessionId(null);
                setMessages([]);
            }
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

    const getDisplayContent = (content: string) => {
        const regex = new RegExp(`${CONTEXT_TAG_START}([\\s\\S]*?)${CONTEXT_TAG_END}`);
        const match = regex.exec(content);

        if (match) {
            const innerText = match[1];
            const clean = content.replace(match[0], '').trim();

            // Parse all titles
            const titles: string[] = [];
            const chunks = innerText.split('\n---\n');
            chunks.forEach(c => {
                const t = c.match(/标题：(.*?)\n/);
                if (t) titles.push(t[1].trim());
            });

            return (
                <>
                    {clean}
                    {titles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {titles.map((title, i) => (
                                <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-300 select-none hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20">
                                    <FileText size={12} />
                                    <span className="opacity-70">引用:</span>
                                    <span className="font-bold border-b border-indigo-500/30">{title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            );
        }
        return <span className="whitespace-pre-wrap">{content}</span>;
    };

    const handleCopy = (text: string) => {
        const clean = text.replace(new RegExp(`${CONTEXT_TAG_START}[\\s\\S]*?${CONTEXT_TAG_END}`, 'g'), '').trim();
        navigator.clipboard.writeText(clean);
    };

    // --- Render ---

    if (availableModels.length === 0) return <div className="h-[100dvh] flex items-center justify-center text-gray-400">Loading Configuration...</div>;

    return (
        <div className="flex h-full w-full overflow-hidden bg-transparent relative">

            {/* --- Top Floating Glass Bar (Navigation & Controls) --- */}
            <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
                <LiquidGlass
                    className="pointer-events-auto rounded-full shadow-xl transition-all min-w-[300px]"
                    innerClassName="flex items-center gap-1 sm:gap-2 px-1.5 py-1.5"
                >

                    {/* 1. Home Button */}
                    <button
                        onClick={() => navigate('/')}
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
                        onClick={() => { setCurrentSessionId(null); setMessages([]); }}
                        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        title="新对话"
                    >
                        <Plus size={18} />
                    </button>
                </LiquidGlass>
            </div>

            {/* --- History Drawer (Floating Glass Panel) --- */}
            <div
                ref={historyRef}
                className={`fixed top-20 left-4 bottom-24 w-72 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isHistoryOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}`}
            >
                <LiquidGlass className="h-full rounded-[2rem] shadow-2xl border border-white/40 dark:border-white/10 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/20 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm"><Clock size={16} /> 历史记录</h3>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {sessions.length === 0 && <div className="text-center text-xs text-gray-400 py-10">暂无记录</div>}
                        {sessions.map(s => (
                            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); if (window.innerWidth < 768) setIsHistoryOpen(false); }}
                                className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-white/60 dark:bg-white/10 border-indigo-200 dark:border-white/20 text-indigo-700 dark:text-white shadow-sm backdrop-blur-md' : 'border-transparent hover:bg-white/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
                                <div className="text-sm font-medium truncate pr-6">{s.title}</div>
                                <div className="text-[10px] opacity-50 mt-1 font-mono">{new Date(s.updatedAt).toLocaleDateString()}</div>
                                <button onClick={(e) => handleDeleteSession(e, s.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 bg-white/50 dark:bg-black/40 rounded-full transition-all backdrop-blur-sm">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </LiquidGlass>
            </div>

            {/* --- Main Chat Area --- */}
            <div className="flex-1 flex flex-col h-full min-w-0 relative pt-20">

                {/* System Prompt Panel (Absolute Overlay) */}
                {isSystemPromptOpen && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 animate-in slide-in-from-top-2 fade-in">
                        <LiquidGlass className="p-4 rounded-2xl shadow-xl">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">系统提示词 (System Prompt)</label>
                                <button onClick={() => setIsSystemPromptOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="w-full h-24 bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors resize-none backdrop-blur-sm" />
                        </LiquidGlass>
                    </div>
                )}

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-0 pb-28 pt-4 custom-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {isMessagesLoading ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-3 animate-pulse">
                                <LiquidGlass className="w-12 h-12 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </LiquidGlass>
                                <span className="text-xs font-medium tracking-wide">同步历史记录...</span>
                            </div>
                        ) : (
                            <>
                                {messages.length === 0 && attachedArticles.length === 0 && (
                                    <div className="h-[50vh] flex flex-col items-center justify-center text-gray-400 space-y-6 animate-in fade-in duration-700">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl">
                                            <Bot size={48} className="text-indigo-400/80 drop-shadow-lg" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="font-light tracking-wide text-lg text-gray-600 dark:text-gray-300">How can I help you today?</p>
                                            <p className="text-xs text-gray-400 font-mono">Powered by {selectedModel ? (AI_MODELS[selectedModel] as any)?.shortName : 'AI'}</p>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isLast = index === messages.length - 1;
                                    const isUser = msg.role === 'user';
                                    const isEditing = editingMessageId === msg.id;

                                    return (
                                        <div key={msg.id} className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : ''} ${isEditing ? 'relative z-50' : 'relative'}`}>
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg backdrop-blur-md transition-transform hover:scale-105 ${isUser ? 'bg-indigo-600 text-white' : 'bg-white/60 dark:bg-white/10 text-indigo-500'}`}>
                                                {isUser ? <User size={20} /> : <Bot size={22} />}
                                            </div>

                                            {/* Message Bubble */}
                                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                {isEditing ? (
                                                    <LiquidGlass className="w-full min-w-[300px] rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-indigo-500/30">
                                                        {/* Edit Mode Content */}
                                                        <textarea
                                                            value={editContent}
                                                            onChange={e => setEditContent(e.target.value)}
                                                            className="w-full bg-transparent outline-none text-[15px] resize-none mb-2 min-h-[100px] p-1 text-gray-800 dark:text-gray-100 font-mono"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                                            <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">取消</button>
                                                            <button onClick={submitEdit} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
                                                                <Save size={12} /> 保存
                                                            </button>
                                                        </div>
                                                    </LiquidGlass>
                                                ) : (
                                                    <>
                                                        <LiquidGlass className={`px-5 py-4 shadow-sm text-[15px] leading-7 relative border backdrop-blur-xl ${isUser
                                                                ? 'bg-indigo-600/90 text-white rounded-2xl rounded-tr-sm border-indigo-400/30 shadow-indigo-500/20'
                                                                : 'bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border-white/40 dark:border-white/10'
                                                            }`}>
                                                            {isUser ? <p className="whitespace-pre-wrap">{getDisplayContent(msg.content)}</p> : <MarkdownRenderer content={msg.content} />}
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
                                    <LiquidGlass key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50 bg-white/80 dark:bg-black/40">
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
                                <LiquidGlass className="rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                                    <div className="p-3 border-b border-black/5 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2"><Hash size={12} /> 引用文章上下文</div>
                                    <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                        {availableArticles.map(article => {
                                            const isSelected = attachedArticles.some(a => a.id === article.id);
                                            return (
                                                <button key={article.id} onClick={() => handleArticleClick(article)} className={`w-full text-left px-3 py-2.5 text-sm rounded-xl truncate transition-all flex items-center gap-2 group ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'border-white bg-transparent' : 'border-gray-400 dark:border-gray-600'}`}>
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
                            className="rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] border border-white/50 dark:border-white/10 bg-white/70 dark:bg-[#121212]/80 backdrop-blur-[40px] transition-all duration-300 focus-within:scale-[1.01] focus-within:bg-white/90 dark:focus-within:bg-black/90 focus-within:border-indigo-500/40 focus-within:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.2)]"
                            innerClassName="flex items-end gap-2 p-2"
                        >
                            <button
                                onClick={() => setIsArticlePickerOpen(!isArticlePickerOpen)}
                                className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-all ${attachedArticles.length > 0 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'}`}
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
                                className="flex-1 bg-transparent border-none outline-none py-3 max-h-[150px] min-h-[46px] resize-none text-[15px] text-gray-900 dark:text-white placeholder-gray-500/50 custom-scrollbar font-medium"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading}
                                className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-all duration-300 ${(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading ? 'text-gray-300 dark:text-gray-600 bg-transparent' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'}`}
                            >
                                {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} className="ml-0.5" />}
                            </button>
                        </LiquidGlass>
                    </div>
                </div>

            </div>
        </div>
    );
};