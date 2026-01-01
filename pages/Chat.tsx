import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus, 
  Settings, FileText, Hash, X, ArrowLeft, Copy, RefreshCw, Edit2, Check, Save, Menu
} from 'lucide-react';
import { AIService, AI_MODELS, AIModelKey } from '../services/ai';
import { StorageService, ChatSession, ChatMessage } from '../services/storage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Article } from '../types';

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

// --- Types & Helper Components ---

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
    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 ${role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
      <button onClick={handleCopy} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="复制">
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
      
      {role === 'user' && onEdit && (
        <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="编辑">
          <Edit2 size={12} />
        </button>
      )}

      {role === 'assistant' && onRegenerate && (
        <button onClick={onRegenerate} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="重新生成">
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
  
  // Responsive Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
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
  const [editContext, setEditContext] = useState<string | null>(null); // Stores the hidden context string
  const [editContextTitle, setEditContextTitle] = useState<string | null>(null); // Stores title for UI

  // Refs
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
            
            // 2. 对于管理员，chat要默认选择系统设置-全局 AI 写作模型
            if (isAdmin) {
                const settingModel = await StorageService.getGeneralAIModel();
                // Verify if the setting model is actually available/valid in current environment
                // @ts-ignore
                if (settingModel && AI_MODELS[settingModel]) {
                    targetModel = settingModel;
                }
            }

            // Fallback if not admin or setting invalid
            if (!targetModel) {
                const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
                targetModel = (defaultFree || availableModels[0][0]) as AIModelKey;
            }
            
            setSelectedModel(targetModel);
        }
    };
    initModel();
  }, [availableModels, selectedModel, isAdmin]);

  // Handle Resize for Sidebar
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth > 768) {
              // On desktop, default to open if it was previously undefined, or keep current state
              // Logic simplified: Just don't auto-close on resize to desktop
          } else {
              setIsSidebarOpen(false);
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Load Messages (Critical Fix: Removed 'sessions' from dependencies to prevent clearing during generation)
  useEffect(() => {
      let isMounted = true;
      const loadMsgs = async () => {
          if (currentSessionId) {
              setIsMessagesLoading(true);
              // BUG FIX: Do not setMessages([]) here immediately if we want to preserve UI during transitions,
              // but for a clean switch between sessions, we usually want to clear.
              // However, since 'sessions' is removed from deps, this only runs when ID changes, which is correct.
              setMessages([]); 
              
              try {
                  const msgs = await StorageService.getChatMessages(currentSessionId, isAdmin);
                  if (isMounted) {
                      setMessages(msgs);
                      // We need to fetch the session specific info (system prompt) here since we removed 'sessions' from deps
                      // We can assume 'sessions' state is relatively fresh or fetch again if critical
                      const list = await StorageService.getChatSessions(isAdmin);
                      const session = list.find(s => s.id === currentSessionId);
                      if (session) {
                          setSystemPrompt(session.systemPrompt || DEFAULT_SYSTEM_PROMPT);
                          // Do not clear attached articles if we are just loading history, unless it's a fresh load logic
                          // setAttachedArticles([]); // Removed to be safe, logic handled elsewhere
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
  }, [currentSessionId, isAdmin, articleId]); // Removed 'sessions'

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
      // We update sessions state, but since it's not in loadMsgs deps, it won't trigger reload/clear
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
          
          // Save Final State
          const finalMsgs = [...history, { ...aiPlaceholder, content: fullResponse }];
          setMessages(finalMsgs);
          
          // Update session timestamp in background
          const updatedSession = sessions.find(s => s.id === sessionId);
          if (updatedSession) {
             const newSessionData = { ...updatedSession, updatedAt: new Date().toISOString() };
             setSessions(prev => prev.map(s => s.id === sessionId ? newSessionData : s));
             await StorageService.saveChatSession(newSessionData, finalMsgs, isAdmin);
          } else {
             // Fallback if session state isn't synced yet
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
      
      const regex = new RegExp(`${CONTEXT_TAG_START}([\\s\\S]*?)${CONTEXT_TAG_END}`, 'g');
      const match = regex.exec(msg.content);
      
      if (match) {
          // Found hidden context, separate it
          const fullContext = match[0];
          const innerText = match[1];
          const textOnly = msg.content.replace(fullContext, '').trim();
          
          const titleMatch = innerText.match(/标题：(.*?)\n/);
          const title = titleMatch ? titleMatch[1].trim() : '文章引用';
          
          setEditContent(textOnly);
          setEditContext(innerText); // Save inner content to restore later if not deleted
          setEditContextTitle(title);
      } else {
          setEditContent(msg.content);
          setEditContext(null);
          setEditContextTitle(null);
      }
  };

  const submitEdit = async () => {
      if (!currentSessionId || !editingMessageId) return;
      
      const msgIndex = messages.findIndex(m => m.id === editingMessageId);
      if (msgIndex === -1) return;

      const historyPrefix = messages.slice(0, msgIndex);
      
      // Reconstruct content
      let finalContent = editContent;
      if (editContext) {
          finalContent = `${editContent}\n\n${CONTEXT_TAG_START}${editContext}${CONTEXT_TAG_END}`;
      }

      const updatedMsg: ChatMessage = {
          ...messages[msgIndex],
          content: finalContent, 
          createdAt: new Date().toISOString()
      };

      const newHistory = [...historyPrefix, updatedMsg];
      setMessages(newHistory);
      setEditingMessageId(null);
      setEditContext(null);
      
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
      // 3. 要可以一次性引用多个文章，而不是只能一个
      // Logic: Append if not exists, Toggle off if exists? Or just Append.
      // Current implementation: Toggle.
      setAttachedArticles(prev => {
          const exists = prev.some(a => a.id === article.id);
          if (exists) {
              return prev.filter(a => a.id !== article.id);
          } else {
              return [...prev, article];
          }
      });
      // Do not close picker automatically to allow multiple selections
      // Do not remove # automatically
      textareaRef.current?.focus();
  };

  // --- 3. UI Helpers ---

  const getDisplayContent = (content: string) => {
      const regex = new RegExp(`${CONTEXT_TAG_START}([\\s\\S]*?)${CONTEXT_TAG_END}`, 'g');
      const match = regex.exec(content);
      
      if (match) {
          const fullContextBlock = match[0];
          const innerText = match[1];
          // Try to extract title
          const titleMatch = innerText.match(/标题：(.*?)\n/);
          const title = titleMatch ? titleMatch[1].trim() : '文章上下文';
          
          const clean = content.replace(fullContextBlock, '').trim();
          
          return (
              <>
                  {clean}
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-300 select-none group/badge transition-all hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20">
                      <FileText size={12} />
                      <span className="opacity-70">已引用:</span> 
                      <span className="font-bold border-b border-indigo-500/30">{title}</span>
                  </div>
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-transparent relative">
        
        {/* Mobile Overlay for Sidebar */}
        <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`
            fixed md:relative z-50 h-full shrink-0 transition-transform duration-300 ease-in-out
            w-72 border-r border-white/10 bg-white/80 dark:bg-black/80 md:bg-white/10 md:dark:bg-black/20 backdrop-blur-xl flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:-translate-x-full'}
        `}>
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:opacity-70 transition-opacity">
                    <ArrowLeft size={16} /> Home
                </button>
                <div className="flex gap-2">
                    <button onClick={() => { setCurrentSessionId(null); setMessages([]); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className="p-2 rounded-lg hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors">
                        <Plus size={18} />
                    </button>
                    {/* Mobile Close Button */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-500">
                        <X size={18} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {sessions.map(s => (
                    <div key={s.id} onClick={() => { setCurrentSessionId(s.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }} 
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-white/40 dark:bg-white/10 border-white/20 text-gray-900 dark:text-white shadow-sm' : 'border-transparent hover:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                        <div className="text-sm font-medium truncate pr-6">{s.title}</div>
                        <div className="text-[10px] opacity-50 mt-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                        <button onClick={(e) => handleDeleteSession(e, s.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Chat (Flex Column) */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
            
            {/* Header */}
            <header className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
                        {isSidebarOpen ? <ArrowLeft size={20} className="hidden md:block" /> : <Menu size={20} />}
                    </button>
                    <div className="relative">
                        <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                            <Sparkles size={16} className="text-indigo-500" />
                            {/* @ts-ignore */}
                            <span className="truncate max-w-[100px] md:max-w-none">{selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading...'}</span>
                            <ChevronDown size={14} className="opacity-50" />
                        </button>
                        {isModelMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 liquid-glass-high rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                {availableModels.map(([key, m]) => (
                                    <button key={key} onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm rounded-lg flex justify-between ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'hover:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
                                        {/* @ts-ignore */}
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)} className={`p-2 rounded-lg transition-colors ${isSystemPromptOpen ? 'bg-white/20 text-indigo-500' : 'text-gray-500 hover:bg-white/10'}`}>
                    <Settings size={20} />
                </button>
            </header>

            {/* System Prompt Panel */}
            {isSystemPromptOpen && (
                <div className="px-6 py-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-white/10 animate-in slide-in-from-top-2 z-10">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">System Prompt</label>
                    <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="w-full h-24 bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors resize-none" />
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar scroll-smooth">
                {isMessagesLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 animate-pulse">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        <span className="text-xs font-medium">Syncing History...</span>
                    </div>
                ) : (
                    <>
                    {messages.length === 0 && attachedArticles.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-md">
                                <Bot size={32} />
                            </div>
                            <p className="font-light tracking-wide">How can I help you today?</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isLast = index === messages.length - 1;
                        const isUser = msg.role === 'user';
                        const isEditing = editingMessageId === msg.id;

                        return (
                            <div key={msg.id} className={`group flex gap-4 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm ${isUser ? 'bg-indigo-600 text-white' : 'bg-white/40 dark:bg-white/10 text-indigo-500 backdrop-blur-md'}`}>
                                    {isUser ? <User size={18} /> : <Bot size={20} />}
                                </div>

                                <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                                    {isEditing ? (
                                        <div className="w-full min-w-[300px] liquid-glass-high rounded-2xl p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                            {/* Deletable Context Tag in Edit Mode */}
                                            {editContext && (
                                                <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                                    <FileText size={12} />
                                                    <span className="truncate max-w-[200px]">{editContextTitle || '引用上下文'}</span>
                                                    <button onClick={() => setEditContext(null)} className="ml-2 hover:text-red-500 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <textarea 
                                                value={editContent} 
                                                onChange={e => setEditContent(e.target.value)}
                                                className="w-full bg-transparent outline-none text-[15px] resize-none mb-2 min-h-[100px] p-2 text-gray-800 dark:text-gray-100"
                                                autoFocus
                                            />
                                            <div className="flex justify-between items-center px-2 pb-1 border-t border-black/5 dark:border-white/5 pt-2">
                                                <span className="text-[10px] text-gray-400">支持 Markdown</span>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">取消</button>
                                                    <button onClick={submitEdit} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
                                                        <Save size={12} /> 保存
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`px-5 py-3.5 shadow-sm text-[15px] leading-7 relative backdrop-blur-md border ${
                                                isUser 
                                                ? 'bg-indigo-600/90 text-white rounded-2xl rounded-tr-sm border-indigo-500/50' 
                                                : 'bg-white/60 dark:bg-black/40 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border-white/30 dark:border-white/10'
                                            }`}>
                                                {isUser ? <p className="whitespace-pre-wrap">{getDisplayContent(msg.content)}</p> : <MarkdownRenderer content={msg.content} />}
                                            </div>
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

            {/* Input Area (Fixed Bottom) */}
            <div className="shrink-0 p-4 pb-6 z-20">
                <div className="max-w-4xl mx-auto relative">
                     {/* Tags */}
                     {attachedArticles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 px-1 animate-in slide-in-from-bottom-2">
                            {attachedArticles.map(a => (
                                <div key={a.id} className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800/50 backdrop-blur-md">
                                    <FileText size={12} />
                                    <span className="truncate max-w-[150px]">{a.title}</span>
                                    <button onClick={() => setAttachedArticles(prev => prev.filter(x => x.id !== a.id))} className="hover:text-red-500 ml-1"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Article Picker (Glass Design) */}
                    {isArticlePickerOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-72 liquid-glass-high rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                            <div className="p-3 border-b border-black/5 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400">引用文章上下文 (可多选)</div>
                            <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                                {availableArticles.map(article => {
                                    const isSelected = attachedArticles.some(a => a.id === article.id);
                                    return (
                                        <button key={article.id} onClick={() => handleArticleClick(article)} className={`w-full text-left px-3 py-2.5 text-sm rounded-xl truncate transition-colors flex items-center gap-2 group ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'}`}>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                            <span className="truncate">{article.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Capsule */}
                    <div className="bg-white/60 dark:bg-white/5 rounded-[2rem] shadow-lg border border-white/40 dark:border-white/10 backdrop-blur-xl flex items-end p-1.5 gap-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white/80 dark:focus-within:bg-black/40">
                         <button onClick={() => setIsArticlePickerOpen(!isArticlePickerOpen)} className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-colors ${attachedArticles.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                            <Hash size={20} />
                         </button>
                         <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => { setInput(e.target.value); if (e.target.value.endsWith('#')) setIsArticlePickerOpen(true); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isLoading ? "AI is thinking..." : "Send a message..."}
                            disabled={isLoading || isMessagesLoading}
                            className="flex-1 bg-transparent border-none outline-none py-3 max-h-[150px] min-h-[46px] resize-none text-[15px] text-gray-900 dark:text-white placeholder-gray-400/60"
                            rows={1}
                        />
                        <button onClick={handleSend} disabled={(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading} className={`p-3 rounded-full h-[46px] w-[46px] flex items-center justify-center transition-all ${(!input.trim() && attachedArticles.length === 0) || isLoading || isMessagesLoading ? 'text-gray-300 dark:text-gray-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'}`}>
                            {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} className="ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};