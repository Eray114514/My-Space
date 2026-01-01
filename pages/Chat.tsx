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
  
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Auth Status independently
  const isAuthenticated = useMemo(() => {
    return localStorage.getItem('my_session') === 'active' || sessionStorage.getItem('my_session') === 'active';
  }, []);

  // Filter Models
  const availableModels = useMemo(() => {
    // If no models available (all filtered out by 'None'), return empty
    if (Object.keys(AI_MODELS).length === 0) return [];

    return Object.entries(AI_MODELS).filter(([_, model]) => {
      // @ts-ignore
      if (isAuthenticated) return true; 
      // @ts-ignore
      return model.isFree;
    });
  }, [isAuthenticated]);

  // Set default model
  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      const defaultFree = availableModels.find(([k]) => k.includes('openrouter-v3'))?.[0];
      setSelectedModel((defaultFree || availableModels[0][0]) as AIModelKey);
    }
  }, [availableModels, selectedModel]);

  // Auto scroll logic
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    }
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

  // @ts-ignore
  const currentModelConfig = selectedModel ? AI_MODELS[selectedModel] : null;

  if (availableModels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 rounded-full bg-white/30 dark:bg-white/5 backdrop-blur-md">
                <Sparkles size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">系统未配置可用的 AI 模型。</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-in fade-in duration-500 relative">
      
      {/* 
        Glass Header 
        Using bg-white/30 instead of /60 for more transparency 
      */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/5 mx-4 sm:mx-0 rounded-2xl mt-0 sm:mt-2 shadow-lg shadow-black/5">
        <div className="relative">
          <button 
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/10 border border-white/40 dark:border-white/10 text-sm font-medium hover:bg-white/60 dark:hover:bg-white/20 transition-all shadow-sm backdrop-blur-sm group"
          >
            <Sparkles size={14} className="text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span className="text-gray-700 dark:text-gray-200">{currentModelConfig?.shortName || 'Select Model'}</span>
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>

          {isModelMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)}></div>
              <div className="absolute top-full left-0 mt-3 w-64 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {isAuthenticated ? 'Available Models' : 'Free Models Only'}
                </div>
                {availableModels.map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                    // @ts-ignore
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${selectedModel === key ? 'bg-indigo-50/50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                  >
                    {/* @ts-ignore */}
                    <span className="group-hover:translate-x-1 transition-transform">{model.name}</span>
                    {selectedModel === key && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button 
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-white/50 dark:hover:bg-white/10"
          title="Clear Chat"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-6 pt-24 pb-4 scroll-smooth scrollbar-hide"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar - Glassy */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 shadow-md backdrop-blur-md border border-white/20 dark:border-white/10 ${
                msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20' 
                : 'bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-400'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
            </div>

            {/* Bubble - High Glass Effect */}
            <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 shadow-md backdrop-blur-md text-[15px] leading-relaxed border ${
              msg.role === 'user' 
                ? 'bg-indigo-600/90 dark:bg-indigo-600/80 text-white rounded-2xl rounded-tr-sm border-indigo-500/50 shadow-indigo-500/10' 
                : 'bg-white/40 dark:bg-black/40 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border-white/30 dark:border-white/5'
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

      {/* Input Area - Floating Glass Capsule */}
      <div className="mt-2 px-4 sm:px-0 pb-6 relative z-30">
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-black/5 dark:shadow-black/20 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white/60 dark:focus-within:bg-black/60 transition-all duration-300 flex items-end p-2 gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 min-h-[52px] max-h-[150px] resize-none text-gray-900 dark:text-white placeholder-gray-500/70 dark:placeholder-gray-400/50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-full transition-all duration-300 shrink-0 mb-1 ${
              !input.trim() || isLoading 
                ? 'text-gray-400 dark:text-neutral-500 bg-transparent scale-90' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-110 active:scale-95'
            }`}
          >
            {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} className={input.trim() ? "translate-x-0.5" : ""} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400/80 dark:text-gray-500/80 mt-3 font-medium tracking-wide">
            AI GENERATED CONTENT
        </p>
      </div>
    </div>
  );
};