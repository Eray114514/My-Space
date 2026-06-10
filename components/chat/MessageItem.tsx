"use client";

import React, { useState } from 'react';
import { Copy, Edit2, RefreshCw, Check, FileText } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { LiquidGlass } from '../LiquidGlass';
import { ChatMessage } from '../../services/storage';

export const CONTEXT_TAG_START = "<hidden_context>";
export const CONTEXT_TAG_END = "</hidden_context>";

export const getDisplayContent = (content: string) => {
    const regex = new RegExp(`${CONTEXT_TAG_START}([\\s\\S]*?)${CONTEXT_TAG_END}`);
    const match = regex.exec(content);

    if (match) {
        const innerText = match[1];
        const clean = content.replace(match[0], '').trim();

        // Parse all titles
        const titles: string[] = [];
        const chunks = innerText.split('\n---\n');
        chunks.forEach(c => {
            const t = c.match(/标题：(.*?)\n/);
            if (t) titles.push(t[1].trim());
        });

        return (
            <>
                {clean}
                {titles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {titles.map((title, i) => (
                            <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--blog-fg-soft)] border border-[var(--blog-line)] text-xs font-medium text-[var(--blog-fg)] select-none">
                                <FileText size={12} />
                                <span className="opacity-70">引用:</span>
                                <span className="font-bold border-b border-[var(--blog-line)]">{title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    }
    return <span className="whitespace-pre-wrap">{content}</span>;
};

interface MessageActionsProps {
    role: 'user' | 'assistant';
    content: string;
    isLast: boolean;
    onCopy: () => void;
    onRegenerate?: () => void;
    onEdit?: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ role, isLast, onCopy, onRegenerate, onEdit }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1.5 ${role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
            <button onClick={handleCopy} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="复制">
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>

            {role === 'user' && onEdit && (
                <button onClick={onEdit} className="p-1.5 rounded-full text-gray-400 hover:text-[var(--blog-fg)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="编辑">
                    <Edit2 size={12} />
                </button>
            )}

            {role === 'assistant' && onRegenerate && (
                <button onClick={onRegenerate} className="p-1.5 rounded-full text-gray-400 hover:text-[var(--blog-fg)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="重新生成">
                    <RefreshCw size={12} />
                </button>
            )}
        </div>
    );
};
