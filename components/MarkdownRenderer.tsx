import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface Props {
  content: string;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!inline && match) {
    return (
      <div className="relative group rounded-lg overflow-hidden my-6 shadow-md border border-gray-200 dark:border-neutral-800">
        {/* Copy Button */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 backdrop-blur-sm transition-colors border border-gray-600/30"
            title="Copy code"
          >
            {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Syntax Highlighter */}
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            borderRadius: '0',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            backgroundColor: '#1e1e1e', // Ensure dark background matches vscDarkPlus
          }}
          codeTagProps={{
            style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none 
      prose-headings:font-semibold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
      prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:not-italic prose-blockquote:font-normal
      prose-code:bg-gray-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-none
      prose-img:rounded-xl prose-img:shadow-md
      prose-table:border-collapse prose-th:border-b prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-gray-800
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkAlert]}
        components={{
          code: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};