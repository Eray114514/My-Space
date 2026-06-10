"use client";

import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { ChatSession } from '../../services/storage';
import { LiquidGlass } from '../LiquidGlass';

interface ChatSidebarProps {
    isHistoryOpen: boolean;
    historyRef: React.RefObject<HTMLDivElement | null>;
    sessions: ChatSession[];
    currentSessionId: string | null;
    isAdmin: boolean;
    onClose: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isHistoryOpen,
    historyRef,
    sessions,
    currentSessionId,
    isAdmin,
    onClose,
    onSelectSession,
    onDeleteSession
}) => {
    return (
        <div
            ref={historyRef}
            className={`fixed top-20 left-4 bottom-24 w-72 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isHistoryOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}`}
        >
            <LiquidGlass className="glass-panel h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[var(--blog-line)] flex justify-between items-center">
                    <h3 className="font-black text-[var(--blog-fg)] flex items-center gap-2 text-sm"><Clock size={16} /> 历史记录</h3>
                    <button onClick={onClose} className="blog-control h-7 w-7 p-0"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && <div className="text-center text-xs text-[var(--blog-muted)] py-10">暂无记录</div>}
                    {sessions.map(s => (
                        <div key={s.id} onClick={() => { onSelectSession(s.id); if (window.innerWidth < 768) onClose(); }}
                            className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] border-[var(--blog-fg)] shadow-sm' : 'border-transparent hover:bg-[var(--blog-fg-soft)] text-[var(--blog-muted)]'}`}>
                            <div className="text-sm font-medium truncate pr-6">{s.title}</div>
                            <div className="text-[10px] opacity-50 mt-1 font-mono">{new Date(s.updatedAt).toLocaleDateString()}</div>
                            {isAdmin && (
                                <button onClick={(e) => onDeleteSession(e, s.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 bg-[var(--blog-bg)]/70 rounded-full transition-all">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </LiquidGlass>
        </div>
    );
};
