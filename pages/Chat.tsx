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
    { role: 'assistant', content: '你好！我是你的 AI 助手。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelKey | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAuthenticated = useMemo(() => {
    return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
  }, []);

  const availableModels = useMemo(() => {
    if (Object.keys(AI_MODELS).length === 0) return [];
    return Object.entries(AI_MODELS).filter(([_, model]) => {
      // @ts-ignore
      if (isAuthenticated) return true;
      // @ts-ignore
      return model.isFree;
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
      setSelectedModel((defaultFree || availableModels[0][0]) as AIModelKey);
    }
  }, [availableModels, selectedModel]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

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

    const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);
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

  const clearChat = () => { setMessages([{ role: 'assistant', content: '对话已清除。' }]); };
  // @ts-ignore
  const currentModelConfig = selectedModel ? AI_MODELS[selectedModel] : null;

  if (availableModels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-6 rounded-full liquid-glass shadow-lg">
          <Sparkles size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">系统未配置可用的 AI 模型</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-in fade-in duration-500 relative">

      {/* Floating Glass Settings Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 mx-4 sm:mx-0 mt-0 sm:mt-2 liquid-glass-high rounded-full shadow-lg">
        <div className="relative">
          <button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all font-medium text-sm text-gray-800 dark:text-gray-100"
          >
            <Sparkles size={14} className="text-indigo-500" />
            <span>{currentModelConfig?.shortName || 'Select Model'}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isModelMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)}></div>
              <div className="absolute top-full left-0 mt-4 w-64 liquid-glass-high rounded-3xl shadow-2xl z-20 overflow-hidden py-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {isAuthenticated ? 'All Models' : 'Free Models'}
                </div>
                {availableModels.map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                    // @ts-ignore
                    className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between ${selectedModel === key ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                  >
                    {/* @ts-ignore */}
                    <span>{model.name}</span>
                    {selectedModel === key && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-8 pt-28 pb-6 scroll-smooth scrollbar-hide"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 animate-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-lg backdrop-blur-xl border border-white/20 dark:border-white/10 ${msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30'
                : 'bg-white/40 dark:bg-white/5 text-gray-700 dark:text-gray-300'
              }`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={20} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] sm:max-w-[75%] px-6 py-4 shadow-lg backdrop-blur-2xl text-[15px] leading-7 border ${msg.role === 'user'
                ? 'bg-indigo-600/80 dark:bg-indigo-600/60 text-white rounded-[1.5rem] rounded-tr-md border-indigo-400/30'
                : 'liquid-glass text-gray-800 dark:text-gray-100 rounded-[1.5rem] rounded-tl-md'
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
        ))}
      </div>

      {/* Input Capsule */}
      <div className="mt-2 px-4 sm:px-0 pb-6 relative z-30">
        <div className="liquid-glass-high rounded-[2.5rem] shadow-2xl dark:shadow-black/50 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-300 flex items-end p-2 gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 正在思考..." : "Ask anything..."}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none px-6 py-4 min-h-[56px] max-h-[160px] resize-none text-gray-900 dark:text-white placeholder-gray-500/60 text-lg"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3.5 rounded-full transition-all duration-300 shrink-0 mb-1.5 ${!input.trim() || isLoading
                ? 'text-gray-400 bg-transparent scale-95 opacity-50'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:scale-110 active:scale-95'
              }`}
          >
            {isLoading ? <StopCircle size={22} className="animate-pulse" /> : <Send size={22} className={input.trim() ? "translate-x-0.5" : ""} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4 font-medium tracking-widest opacity-60 uppercase">
          Liquid AI • 2025
        </p>
      </div>
    </div>
  );
};