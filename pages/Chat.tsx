import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus, MessageSquare, Edit2, Copy, RotateCcw, Save, Settings, FileText, Hash, X, History } from 'lucide-react';
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

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check Auth
  const isAdmin = useMemo(() => {
    return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
  }, []);

  // --- Initialization ---

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

  useEffect(() => {
    const handleArticleEntry = async () => {
      if (articleId) {
        if (!currentSessionId) {
          const article = await StorageService.getArticleById(articleId);
          if (article) {
            setAttachedArticles([article]);
          }
        }
      }
    };
    handleArticleEntry();
  }, [articleId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        const msgs = await StorageService.getChatMessages(currentSessionId, isAdmin);
        setMessages(msgs);

        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
          setSystemPrompt(session.systemPrompt || DEFAULT_SYSTEM_PROMPT);
          setAttachedArticles([]);
        }
      } else {
        if (!articleId) {
          setMessages([]);
          setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
          setAttachedArticles([]);
        }
      }
    };
    loadMessages();
  }, [currentSessionId, isAdmin, sessions]);

  // --- Core Logic ---

  const createNewSession = async (firstMessageContent: string) => {
    const newId = Date.now().toString();
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

  const triggerAIResponse = async (history: ChatMessage[], targetSessionId: string) => {
    if (!selectedModel || !targetSessionId) return;

    setIsLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

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

    const apiHistory = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
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

      const finalHistory = [...history, { ...aiMsgPlaceholder, content: fullResponse }];
      setMessages(finalHistory);

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

    if (!activeSessionId) {
      activeSessionId = await createNewSession(input || "新对话");
    }

    let finalContent = input;
    if (attachedArticles.length > 0) {
      const refs = attachedArticles.map(a => `\n\n---\n引用文章标题：${a.title}\n文章摘要：${a.summary}\n文章正文：\n${a.content}\n---`).join('');
      finalContent = `${input}\n${refs}`;
    }

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
    setAttachedArticles([]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.endsWith('#')) setIsArticlePickerOpen(true);
  };

  const addArticleReference = (article: Article) => {
    if (!attachedArticles.find(a => a.id === article.id)) {
      setAttachedArticles([...attachedArticles, article]);
    }
    setIsArticlePickerOpen(false);
    if (input.endsWith('#')) setInput(input.slice(0, -1));
    textareaRef.current?.focus();
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  if (availableModels.length === 0) return <div className="p-10 text-center text-gray-400">Loading Configuration...</div>;

  return (
    <div className="flex h-full max-w-full mx-auto gap-0 animate-in fade-in duration-500 relative bg-white/50 dark:bg-black/20 backdrop-blur-3xl overflow-hidden rounded-t-[2rem] border-t border-white/20 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none mx-2 sm:mx-6 mt-2">

      {/* Sidebar (History) */}
      <div className="hidden md:flex flex-col w-72 border-r border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0c0c0c]/60 backdrop-blur-md h-full shrink-0">
        <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <History size={16} />
            <span className="text-sm">历史对话</span>
          </div>
          <button
            onClick={() => { setCurrentSessionId(null); setMessages([]); setSystemPrompt(DEFAULT_SYSTEM_PROMPT); setAttachedArticles([]); }}
            className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            title="新对话"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === session.id
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border-gray-200 dark:border-white/10 shadow-sm'
                  : 'hover:bg-gray-200/50 dark:hover:bg-white/5 border-transparent text-gray-600 dark:text-gray-400'
                }`}
            >
              <div className="text-sm font-medium truncate pr-6">{session.title}</div>
              <div className="text-[10px] opacity-50 mt-1">
                {new Date(session.updatedAt).toLocaleDateString()}
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-white/60 dark:bg-[#050505]/60 backdrop-blur-sm">

        {/* Header */}
        <header className="h-16 px-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl z-20 shrink-0">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
            >
              <Sparkles size={16} className="text-indigo-500" />
              {/* @ts-ignore */}
              {selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading...'}
              <ChevronDown size={14} className="opacity-50" />
            </button>

            {isModelMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 liquid-glass-high rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 z-50 border border-gray-100 dark:border-white/10">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-white/5">Available Models</div>
                {availableModels.map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex justify-between items-center ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    {/* @ts-ignore */}
                    <span>{model.name}</span>
                    {/* @ts-ignore */}
                    {model.isFree && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded">FREE</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* System Settings Toggle */}
          <button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            className={`p-2 rounded-lg transition-all ${isSystemPromptOpen ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* System Prompt (Slide down) */}
        {isSystemPromptOpen && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#0c0c0c] border-b border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300 shrink-0 z-10">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full h-24 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none font-mono leading-relaxed"
              placeholder="Define AI behavior..."
            />
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth pb-32"
        >
          {messages.length === 0 && attachedArticles.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2">
                <Bot size={32} />
              </div>
              <p className="font-light text-lg">How can I help you today?</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-white/10 text-indigo-500 border border-gray-100 dark:border-transparent'
                }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-white dark:bg-[#151515] text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-white/5'
                  }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content.replace(/---[\s\S]*---/, '(附带了引用文章)').trim()}</p>
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

        {/* Input Area (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#050505] dark:via-[#050505]/95 dark:to-transparent z-30">
          <div className="max-w-4xl mx-auto space-y-3">

            {/* Tags */}
            {attachedArticles.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 px-1">
                {attachedArticles.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800/50">
                    <FileText size={12} />
                    <span className="truncate max-w-[150px]">{a.title}</span>
                    <button onClick={() => setAttachedArticles(prev => prev.filter(item => item.id !== a.id))} className="hover:text-red-500 ml-1 rounded-full hover:bg-black/5 p-0.5"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Popover */}
            {isArticlePickerOpen && (
              <div className="absolute bottom-full left-4 mb-4 w-72 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 border border-gray-200 dark:border-white/10 z-50">
                <div className="p-3 border-b border-gray-100 dark:border-white/5 text-xs text-gray-500 font-bold bg-gray-50/50 dark:bg-white/5 uppercase tracking-wider">Select Article</div>
                <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {availableArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => addArticleReference(article)}
                      className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 truncate transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} className="opacity-50" />
                      {article.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Input */}
            <div className="bg-gray-100 dark:bg-[#151515] rounded-[2rem] shadow-inner border border-transparent focus-within:border-indigo-500/30 focus-within:bg-white dark:focus-within:bg-[#0a0a0a] focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all flex items-end p-2 gap-2">

              <button
                onClick={() => setIsArticlePickerOpen(!isArticlePickerOpen)}
                className={`p-3 rounded-full mb-0.5 transition-colors ${attachedArticles.length > 0 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                title="Reference Article (#)"
              >
                <Hash size={20} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isLoading ? "AI is thinking..." : "Type a message... (Use # to reference)"}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none px-2 py-3.5 min-h-[52px] max-h-[160px] resize-none text-[15px] text-gray-900 dark:text-white placeholder-gray-400"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachedArticles.length === 0) || isLoading}
                className={`p-3 rounded-full mb-0.5 transition-all duration-300 ${(!input.trim() && attachedArticles.length === 0) || isLoading
                    ? 'text-gray-300 dark:text-gray-600 bg-transparent cursor-not-allowed'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                  }`}
              >
                {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};