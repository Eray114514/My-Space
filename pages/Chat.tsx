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
    return <div className="flex items-center justify-center h-[60vh] text-gray-400">系统未配置可用的 AI 模型。</div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-in fade-in duration-500 relative">

      {/* Header / Model Selector - Frosted Glass Style */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 mx-4 sm:mx-0 rounded-t-2xl sm:rounded-2xl mt-0 sm:mt-2">
        <div className="relative">
          <button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 text-sm font-medium hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm backdrop-blur-sm"
          >
            <Sparkles size={14} className="text-indigo-500" />
            <span className="dark:text-white">{currentModelConfig?.shortName || 'Select Model'}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isModelMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {isAuthenticated ? 'Available Models' : 'Free Models Only'}
                </div>
                {availableModels.map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedModel(key as AIModelKey); setIsModelMenuOpen(false); }}
                    // @ts-ignore
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${selectedModel === key ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                  >
                    {/* @ts-ignore */}
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

      {/* Messages Area - Added padding-top to account for floating header */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-6 pt-20 pb-4 scroll-smooth"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-neutral-700'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 shadow-sm text-[15px] leading-relaxed ${msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-gray-100 dark:border-neutral-800 rounded-2xl rounded-tl-sm dark:text-gray-100'
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
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all flex items-end p-2 gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 min-h-[50px] max-h-[150px] resize-none dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-full transition-all shrink-0 mb-1 ${!input.trim() || isLoading
                ? 'text-gray-400 dark:text-neutral-600 bg-transparent'
                : 'bg-indigo-600 text-white shadow-lg hover:scale-105 active:scale-95'
              }`}
          >
            {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3 opacity-60">
          AI 生成内容仅供参考
        </p>
      </div>
    </div>
  );
};