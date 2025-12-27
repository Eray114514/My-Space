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

  // Handle all block-level code (both with language and without)
  if (!inline) {
    return (
      <div className="relative group rounded-lg overflow-hidden my-6 shadow-md border border-gray-200 dark:border-neutral-800 not-prose text-sm">
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
          language={match ? match[1] : 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.25rem', // Slightly reduced padding
            borderRadius: '0',
            fontSize: '0.9rem',
            lineHeight: '1.6', // Increased line height for readability
            backgroundColor: '#1e1e1e', // Ensure dark background matches vscDarkPlus
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 'inherit'
            }
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Inline code styling
  return (
    <code className={`${className} bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-neutral-700`} {...props}>
      {children}
    </code>
  );
};

// Component to strip the default <pre> wrapper from react-markdown
const PreBlock = ({ children }: any) => <>{children}</>;

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none 
      prose-headings:font-semibold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
      prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:not-italic prose-blockquote:font-normal
      prose-blockquote:border-l-4 prose-blockquote:border-gray-200 dark:prose-blockquote:border-neutral-700
      prose-img:rounded-xl prose-img:shadow-md
      prose-table:border-collapse prose-th:border-b prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-gray-800
      
      /* Disable default typography code styles as we handle them manually */
      prose-code:before:content-none prose-code:after:content-none
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkAlert]}
        components={{
          pre: PreBlock,
          code: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};