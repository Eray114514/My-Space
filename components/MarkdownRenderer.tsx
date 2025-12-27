import React, { useState, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface Props {
  content: string;
}

// 1. 专门处理代码块 (替换默认的 pre 标签)
// 这里的 children 通常是 react-markdown 生成的 `code` 元素
const PreBlock = ({ children }: any) => {
  const [isCopied, setIsCopied] = useState(false);

  // 安全地提取 code 元素及其属性
  const codeElement = isValidElement(children) ? children : null;
  
  // 如果 pre 内部不是 code 元素（极少情况），直接渲染原始内容
  if (!codeElement) {
    return <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">{children}</pre>;
  }

  const { className, children: codeContent } = codeElement.props as any;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const codeString = String(codeContent).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-6 shadow-lg border border-gray-200 dark:border-neutral-800 not-prose bg-[#1e1e1e]">
      {/* 顶部栏：显示语言和复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-xs text-gray-400 font-mono">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="复制"
        >
          {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* 代码高亮区域 */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 0,
          fontSize: '0.9rem',
          lineHeight: '1.6',
          backgroundColor: 'transparent', // 背景色由外层容器控制
        }}
        codeTagProps={{
          style: {
            fontFamily: '"Fira Code", "JetBrains Mono", "SFMono-Regular", Consolas, monospace',
          }
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

// 2. 专门处理行内代码 (替换默认的 code 标签)
// 只有当 code 标签没有被 pre 包裹时（即行内代码），react-markdown 才会调用此组件
// 注意：被 PreBlock 处理过的 code 内容不会再经过这里
const InlineCode = ({ children, className, ...props }: any) => {
  return (
    <code 
      className={`${className || ''} bg-gray-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-neutral-700 align-middle`} 
      {...props}
    >
      {children}
    </code>
  );
};

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none 
      prose-headings:font-bold prose-headings:tracking-tight
      prose-p:leading-relaxed
      prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-gray-500 dark:prose-blockquote:text-gray-400
      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-neutral-900/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
      prose-img:rounded-xl prose-img:shadow-md
      prose-table:border-collapse prose-th:border-b prose-th:border-gray-200 dark:prose-th:border-neutral-800 prose-th:bg-gray-50 dark:prose-th:bg-neutral-900 prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-neutral-800
      
      /* 移除默认的 code 样式，完全由自定义组件控制 */
      prose-code:before:content-none prose-code:after:content-none prose-code:font-normal
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkAlert]}
        components={{
          pre: PreBlock,   // 拦截代码块
          code: InlineCode // 拦截行内代码
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};