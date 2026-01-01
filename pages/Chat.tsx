import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus, MessageSquare, Edit2, Copy, RotateCcw, Save, Settings, FileText, Hash, X } from 'lucide-react';
import { AIService, AI_MODELS, AIModelKey } from '../services/ai';
import { StorageService, ChatSession, ChatMessage } from '../services/storage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Article } from '../types';

const DEFAULT_SYSTEM_PROMPT = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const articleId = searchParams.get('articleId');

  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

  // Article References
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [attachedArticles, setAttachedArticles] = useState<Article[]>([]);
  const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);

  // Model
  const [selectedModel, setSelectedModel] = useState<AIModelKey | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Edit Mode
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check Auth
  const isAdmin = useMemo(() => {
    return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
  }, []);

  // --- Initialization ---

  // 1. Load Model Config & Articles
  const availableModels = useMemo(() => {
    if (Object.keys(AI_MODELS).length === 0) return [];
    return Object.entries(AI_MODELS).filter(([_, model]) => {
      // @ts-ignore
      if (isAdmin) return true;
      // @ts-ignore
      return model.isFree;
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
      setSelectedModel((defaultFree || availableModels[0][0]) as AIModelKey);
    }
  }, [availableModels, selectedModel]);

  useEffect(() => {
    const initData = async () => {
      const articles = await StorageService.getArticles();
      setAvailableArticles(articles.filter(a => a.isPublished));
      const list = await StorageService.getChatSessions(isAdmin);
      setSessions(list);
    };
    initData();
  }, [isAdmin]);

  // 2. Handle Entry from Article (Lazy Initialization)
  useEffect(() => {
    const handleArticleEntry = async () => {
      if (articleId) {
        // Check if we are already in a session that matches this context to avoid reset
        // (Simplification: If user navigates via URL with articleId, we treat it as starting fresh context)

        if (!currentSessionId) {
          const article = await StorageService.getArticleById(articleId);
          if (article) {
            // Don't create session in DB yet. Just setup UI state.
            setAttachedArticles([article]);
            // setIsSystemPromptOpen(true); // Disabled auto-expand as requested

            // Remove param from URL to prevent re-triggering on refresh but keep state
            // setSearchParams({}, { replace: true }); 
            // actually keeping it might be better for "link sharing" logic, but user said "don't save history before sending"
          }
        }
      }
    };
    handleArticleEntry();
  }, [articleId]);

  // 3. Load Messages when Session Changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        const msgs = await StorageService.getChatMessages(currentSessionId, isAdmin);
        setMessages(msgs);

        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
          setSystemPrompt(session.systemPrompt || DEFAULT_SYSTEM_PROMPT);
          // Clear attached articles when switching sessions to avoid confusion, 
          // unless we parse them from history (complex), strictly, references are per-turn or system prompt embedded.
          // For now, we reset attached articles on session switch.
          setAttachedArticles([]);
        }
      } else {
        // Reset for new session
        if (!articleId) {
          setMessages([]);
          setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
          setAttachedArticles([]);
        }
      }
    };
    loadMessages();
  }, [currentSessionId, isAdmin, sessions]); // Added sessions to dependency to ensure we find the object

  // --- Core Logic ---

  const createNewSession = async (firstMessageContent: string) => {
    const newId = Date.now().toString();

    // Auto-generate title
    const title = firstMessageContent.slice(0, 30) + (firstMessageContent.length > 30 ? '...' : '');

    const session: ChatSession = {
      id: newId,
      title: title || '新对话',
      systemPrompt: systemPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSessions(prev => [session, ...prev]);
    setCurrentSessionId(newId);
    await StorageService.saveChatSession(session, [], isAdmin);
    return newId;
  };

  /**
   * Internal function to stream AI response based on a given history.
   */
  const triggerAIResponse = async (history: ChatMessage[], targetSessionId: string) => {
    if (!selectedModel || !targetSessionId) return;

    setIsLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    // Placeholder ID for AI
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: ChatMessage = {
      id: aiMsgId,
      sessionId: targetSessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };

    const messagesWithPlaceholder = [...history, aiMsgPlaceholder];
    setMessages(messagesWithPlaceholder);

    // Construct API History
    const apiHistory = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Inject System Prompt
    apiHistory.unshift({ role: 'system' as any, content: systemPrompt });

    let fullResponse = '';

    try {
      await AIService.chatStream(
        apiHistory,
        selectedModel,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.findIndex(m => m.id === aiMsgId);
            if (lastIdx !== -1) {
              updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
            }
            return updated;
          });
        }
      );

      // Final save
      const finalAiMsg = { ...aiMsgPlaceholder, content: fullResponse };
      const finalHistory = [...history, finalAiMsg];
      setMessages(finalHistory);

      // Update Session Last Updated
      const session = sessions.find(s => s.id === targetSessionId);
      if (session) {
        const updatedSession = { ...session, updatedAt: new Date().toISOString() };
        setSessions(prev => prev.map(s => s.id === targetSessionId ? updatedSession : s));
        await StorageService.saveChatSession(updatedSession, finalHistory, isAdmin);
      }

    } catch (error: any) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.findIndex(m => m.id === aiMsgId);
        if (lastIdx !== -1) {
          updated[lastIdx] = { ...updated[lastIdx], content: `**Error:** ${error.message}` };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedArticles.length === 0) || isLoading) return;

    let activeSessionId = currentSessionId;
    let isNewSession = false;

    if (!activeSessionId) {
      activeSessionId = await createNewSession(input || "新对话");
      isNewSession = true;
    }

    // Construct Content with References
    let finalContent = input;
    if (attachedArticles.length > 0) {
      const refs = attachedArticles.map(a => `\n\n---\n引用文章标题：${a.title}\n文章摘要：${a.summary}\n文章正文：\n${a.content}\n---`).join('');
      finalContent = `${input}\n${refs}`;
    }

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sessionId: activeSessionId!,
      role: 'user',
      content: finalContent,
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setAttachedArticles([]); // Clear references after sending

    // 2. Trigger AI
    await triggerAIResponse(nextMessages, activeSessionId!);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确认删除此会话？')) {
      await StorageService.deleteChatSession(id, isAdmin);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
  };

  // --- Article Picker Logic ---

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.endsWith('#')) {
      setIsArticlePickerOpen(true);
    }
  };

  const addArticleReference = (article: Article) => {
    if (!attachedArticles.find(a => a.id === article.id)) {
      setAttachedArticles([...attachedArticles, article]);
    }
    setIsArticlePickerOpen(false);
    // Remove the trailing '#' if it exists
    if (input.endsWith('#')) {
      setInput(input.slice(0, -1));
    }
    textareaRef.current?.focus();
  };

  // --- UI Helpers ---

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  if (availableModels.length === 0) return <div className="p-10 text-center text-gray-400">Loading Configuration...</div>;

  return (
    <div className="flex h-full max-w-full mx-auto gap-0 animate-in fade-in duration-500 relative">

      {/* Sidebar (History) - Hidden on mobile unless opened (TODO: Add mobile toggle) */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md h-full shrink-0">
        <div className="p-4 flex items-center justify-between">
          <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">历史对话</span>
          <button onClick={() => { setCurrentSessionId(null); setMessages([]); setSystemPrompt(DEFAULT_SYSTEM_PROMPT); setAttachedArticles([]); }} className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-indigo-600 dark:text-indigo-400">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === session.id
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'hover:bg-white/40 dark:hover:bg-white/10 border-transparent text-gray-600 dark:text-gray-300'
                }`}
            >
              <div className="text-sm font-medium truncate pr-6">{session.title}</div>
              <div className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
                {new Date(session.updatedAt).toLocaleDateString()}
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'hover:bg-indigo-600 text-white' : 'hover:bg-red-100 text-gray-500 hover:text-red-500'}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area - Full Height, Flex Col */}
      <div className="flex-1 flex flex-col h-full relative bg-white/30 dark:bg-black/10 backdrop-blur-sm">

        {/* Top Bar (Model & System) */}
        <div className="h-14 px-4 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                <Sparkles size={14} className="text-indigo-500" />
                {/* @ts-ignore */}
                {selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading...'}
                <ChevronDown size={14} className="opacity-50" />
              </button>
              {isModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 liquid-glass-high rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                  {availableModels.map(([key, model]) => (
                    <button key={key} onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                      {/* @ts-ignore */}
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)} className={`p-2 rounded-full transition-colors ${isSystemPromptOpen ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5 dark:hover:bg-white/10'}`} title="系统设定">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* System Prompt Panel (Expandable) */}
        {isSystemPromptOpen && (
          <div className="px-6 py-4 bg-gray-50/90 dark:bg-[#0a0a0a]/90 border-b border-gray-200/50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300 shrink-0 backdrop-blur-sm z-10">
            <label className="text-xs font-bold text-gray-500 mb-2 block">系统提示词 / 角色设定</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full h-24 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
              placeholder="定义 AI 的行为..."
            />
          </div>
        )}

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-10 pb-40 space-y-8 scroll-smooth"
        >
          {messages.length === 0 && attachedArticles.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
              <Bot size={48} strokeWidth={1} />
              <p className="font-light">与我交谈，或引用文章开始讨论...</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`group flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-white/5 mt-1 ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                  : 'bg-white/80 dark:bg-white/10 text-indigo-600 dark:text-indigo-300'
                }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Content */}
              <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 shadow-sm text-[15px] leading-7 relative group/bubble ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-[1.5rem] rounded-tr-sm'
                    : 'bg-white/80 dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 rounded-[1.5rem] rounded-tl-sm border border-white/30 dark:border-white/5'
                  }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-chat">
                      <MarkdownRenderer content={msg.content || 'Thinking...'} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Input Area (Fixed) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black dark:to-transparent pt-10 pb-6 z-30">
          <div className="max-w-4xl mx-auto space-y-3">

            {/* Attached Context Tags */}
            {attachedArticles.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                {attachedArticles.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                    <FileText size={12} />
                    <span className="truncate max-w-[150px]">{a.title}</span>
                    <button onClick={() => setAttachedArticles(prev => prev.filter(item => item.id !== a.id))} className="hover:text-red-500 ml-1"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Article Picker Popover */}
            {isArticlePickerOpen && (
              <div className="absolute bottom-full left-4 sm:left-auto mb-2 w-72 liquid-glass-high rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 border border-indigo-100 dark:border-indigo-900/50">
                <div className="p-2 border-b border-gray-100 dark:border-white/5 text-xs text-gray-500 font-bold bg-gray-50 dark:bg-white/5">选择引用文章</div>
                <div className="max-h-48 overflow-y-auto">
                  {availableArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => addArticleReference(article)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-200 truncate transition-colors"
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[1.5rem] shadow-xl border border-gray-200/80 dark:border-white/10 flex items-end p-2 gap-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">

              <button
                onClick={() => setIsArticlePickerOpen(!isArticlePickerOpen)}
                className={`p-2.5 rounded-full mb-1 transition-colors ${attachedArticles.length > 0 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                title="引用文章 (#)"
              >
                <Hash size={18} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isLoading ? "AI 正在思考..." : "输入消息... (输入 # 引用文章)"}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none px-2 py-3 min-h-[48px] max-h-[160px] resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachedArticles.length === 0) || isLoading}
                className={`p-2.5 rounded-full mb-1 transition-all ${(!input.trim() && attachedArticles.length === 0) || isLoading
                    ? 'text-gray-300 bg-transparent'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                  }`}
              >
                {isLoading ? <StopCircle size={18} className="animate-pulse" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};