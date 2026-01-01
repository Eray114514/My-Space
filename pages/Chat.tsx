import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Trash2, StopCircle, Sparkles, ChevronDown, Plus, MessageSquare, Edit2, Copy, RotateCcw, Save, Settings, FileText } from 'lucide-react';
import { AIService, AI_MODELS, AIModelKey } from '../services/ai';
import { StorageService, ChatSession, ChatMessage } from '../services/storage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const DEFAULT_SYSTEM_PROMPT = "你是一个智能助手，名字叫 My AI。请用简洁、优雅的 Markdown 格式回答用户的问题。";

export const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('articleId');

  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

  // Model
  const [selectedModel, setSelectedModel] = useState<AIModelKey | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Context
  const [contextArticleTitle, setContextArticleTitle] = useState<string | null>(null);

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

  // 1. Load Model
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

  // 2. Load History List
  useEffect(() => {
    const loadSessions = async () => {
      const list = await StorageService.getChatSessions(isAdmin);
      setSessions(list);
    };
    loadSessions();
  }, [isAdmin]);

  // 3. Handle Article Context (New Session from Article)
  useEffect(() => {
    const initContext = async () => {
      if (articleId && !currentSessionId) {
        const article = await StorageService.getArticleById(articleId);
        if (article) {
          setContextArticleTitle(article.title);
          setSystemPrompt(`${DEFAULT_SYSTEM_PROMPT}\n\n你正在根据以下文章回答用户的问题：\n\n标题：${article.title}\n内容：\n${article.content.substring(0, 8000)}... (截取部分)`);
          createNewSession(`关于 "${article.title}" 的讨论`, article.id);
          setIsSystemPromptOpen(true); // Let user see the context
        }
      }
    };
    initContext();
  }, [articleId]);

  // 4. Load Messages when Session Changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        const msgs = await StorageService.getChatMessages(currentSessionId, isAdmin);
        setMessages(msgs);

        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
          setSystemPrompt(session.systemPrompt || DEFAULT_SYSTEM_PROMPT);
          if (session.articleContextId) {
            const article = await StorageService.getArticleById(session.articleContextId);
            setContextArticleTitle(article ? article.title : null);
          } else {
            setContextArticleTitle(null);
          }
        }
      } else {
        setMessages([]);
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        setContextArticleTitle(null);
      }
    };
    loadMessages();
  }, [currentSessionId, sessions, isAdmin]);

  // --- Core Logic ---

  const createNewSession = async (title = '新对话', articleId?: string) => {
    const newId = Date.now().toString();
    const session: ChatSession = {
      id: newId,
      title,
      systemPrompt: systemPrompt,
      articleContextId: articleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSessions(prev => [session, ...prev]);
    setCurrentSessionId(newId);
    setMessages([]); // Clear view
    await StorageService.saveChatSession(session, [], isAdmin);
    return newId;
  };

  const updateCurrentSession = async (newMessages: ChatMessage[]) => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    // Auto-title for first message
    let updatedSession = { ...session, updatedAt: new Date().toISOString(), systemPrompt };
    if (session.title === '新对话' && newMessages.length > 0) {
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      if (firstUserMsg) {
        updatedSession.title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '');
      }
    }

    setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
    await StorageService.saveChatSession(updatedSession, newMessages, isAdmin);
  };

  /**
   * Internal function to stream AI response based on a given history.
   * DOES NOT add the user message (it assumes user message is already in history).
   * It appends the AI message placeholder and streams content.
   */
  const triggerAIResponse = async (history: ChatMessage[]) => {
    if (!selectedModel || !currentSessionId) return;

    setIsLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    // Placeholder ID for AI
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: ChatMessage = {
      id: aiMsgId,
      sessionId: currentSessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };

    // Update UI with placeholder
    const messagesWithPlaceholder = [...history, aiMsgPlaceholder];
    setMessages(messagesWithPlaceholder);

    // Prepare API Payload
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

      // Final save
      const finalAiMsg = { ...aiMsgPlaceholder, content: fullResponse };
      const finalHistory = [...history, finalAiMsg];

      setMessages(finalHistory);
      await updateCurrentSession(finalHistory);

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
    if (!input.trim() || isLoading) return;

    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      activeSessionId = await createNewSession();
      // Wait for React state update frame or assume it works
      // We use the variable activeSessionId to ensure we have it
    }

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sessionId: activeSessionId!,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update for user message
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');

    // 2. Trigger AI
    await triggerAIResponse(nextMessages);
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

  // --- Message Actions ---

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRegenerate = (index: number) => {
    // Fix: Don't remove the user message.
    // If index is the AI response, index-1 is the user message.
    // We want to keep everything UP TO index (exclusive), which includes the user message.
    if (index <= 0) return;
    const historyToKeep = messages.slice(0, index);

    // We do NOT add a new user message. We just re-trigger AI based on existing history.
    triggerAIResponse(historyToKeep);
  };

  const handleEditUserMessage = (index: number) => {
    setEditingMessageId(messages[index].id);
    setEditContent(messages[index].content);
  };

  const submitEdit = (index: number) => {
    // Keep everything before this message
    const historyPrefix = messages.slice(0, index);

    // Create modified user message
    const modifiedMsg = { ...messages[index], content: editContent };

    // New history base
    const newHistory = [...historyPrefix, modifiedMsg];

    setEditingMessageId(null);

    // Trigger AI with this new history
    triggerAIResponse(newHistory);
  };

  // --- UI Helpers ---

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  };
  useEffect(() => { scrollToBottom(); }, [messages, editingMessageId]);

  if (availableModels.length === 0) return <div className="p-10 text-center text-gray-400">Loading Configuration...</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto gap-4 animate-in fade-in duration-500">

      {/* Sidebar (History) */}
      <div className="hidden md:flex flex-col w-64 liquid-glass rounded-3xl overflow-hidden shadow-lg h-full">
        <div className="p-4 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-white/5 backdrop-blur-md">
          <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">历史对话</span>
          <button onClick={() => { setCurrentSessionId(null); setMessages([]); setSystemPrompt(DEFAULT_SYSTEM_PROMPT); setContextArticleTitle(null); }} className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-indigo-600 dark:text-indigo-400">
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
                {session.articleContextId && <FileText size={10} />}
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
          {sessions.length === 0 && <div className="text-center text-xs text-gray-400 mt-10">暂无历史记录</div>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col liquid-glass rounded-3xl overflow-hidden shadow-xl h-full relative">

        {/* Header */}
        <div className="h-14 px-4 sm:px-6 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                <Sparkles size={14} className="text-indigo-500" />
                {/* @ts-ignore */}
                {selectedModel ? AI_MODELS[selectedModel]?.shortName : 'Loading...'}
                <ChevronDown size={14} className="opacity-50" />
              </button>
              {isModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 liquid-glass-high rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                  {availableModels.map(([key, model]) => (
                    <button key={key} onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                      {/* @ts-ignore */}
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {contextArticleTitle && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/30 truncate max-w-[200px]">
                <FileText size={10} /> 引用: {contextArticleTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)} className={`p-2 rounded-full transition-colors ${isSystemPromptOpen ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5 dark:hover:bg-white/10'}`} title="系统设定">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* System Prompt Panel */}
        {isSystemPromptOpen && (
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-black/20 border-b border-gray-200/50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
            <label className="text-xs font-bold text-gray-500 mb-2 block">系统提示词 / 角色设定</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full h-24 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
              placeholder="定义 AI 的行为..."
            />
            <div className="flex justify-end mt-2">
              <button onClick={() => setIsSystemPromptOpen(false)} className="text-xs text-indigo-600 hover:underline">收起面板</button>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth scrollbar-hide">
          {messages.length === 0 && !contextArticleTitle && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
              <Bot size={48} strokeWidth={1} />
              <p className="font-light">开始一段新的对话...</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`group flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-white/5 mt-1 ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                  : 'bg-white/80 dark:bg-white/10 text-indigo-600 dark:text-indigo-300'
                }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Content Area */}
              <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                {/* Edit Mode for User */}
                {editingMessageId === msg.id ? (
                  <div className="w-full bg-white dark:bg-white/10 rounded-2xl border border-indigo-500 p-3 shadow-lg animate-in zoom-in-95 duration-200 min-w-[300px]">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 resize-none h-24 mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 rounded-md text-xs text-gray-500 hover:bg-black/5">取消</button>
                      <button onClick={() => submitEdit(index)} className="px-3 py-1 rounded-md text-xs bg-indigo-600 text-white shadow-sm">保存并重新生成</button>
                    </div>
                  </div>
                ) : (
                  <div className={`px-5 py-3.5 shadow-sm text-[15px] leading-7 relative group/bubble ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-[1.5rem] rounded-tr-sm'
                      : 'bg-white/60 dark:bg-white/5 text-gray-800 dark:text-gray-100 rounded-[1.5rem] rounded-tl-sm border border-white/30 dark:border-white/5'
                    }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-chat">
                        <MarkdownRenderer content={msg.content || 'Thinking...'} />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Bar (Hover) */}
                {!editingMessageId && !isLoading && (
                  <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <button onClick={() => handleCopy(msg.content)} className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="复制"><Copy size={12} /></button>

                    {msg.role === 'user' && (
                      <button onClick={() => handleEditUserMessage(index)} className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="编辑"><Edit2 size={12} /></button>
                    )}

                    {msg.role === 'assistant' && (
                      <button onClick={() => handleRegenerate(index)} className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="重新生成"><RotateCcw size={12} /></button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white/40 dark:bg-white/5 backdrop-blur-md border-t border-white/20 dark:border-white/5">
          <div className="bg-white dark:bg-black/20 rounded-[1.5rem] shadow-inner border border-gray-200/50 dark:border-white/10 flex items-end p-2 gap-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 min-h-[48px] max-h-[120px] resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-full mb-1 transition-all ${!input.trim() || isLoading
                  ? 'text-gray-300 bg-transparent'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                }`}
            >
              {isLoading ? <StopCircle size={18} className="animate-pulse" /> : <Send size={18} />}
            </button>
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-2 font-light">
            {/* Footer text */}
            AI 生成内容可能包含错误，请注意甄别。
          </div>
        </div>
      </div>
    </div>
  );
};