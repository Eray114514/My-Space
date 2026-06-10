"use client";
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CURATED_ICONS } from '../constants';

export const IconPicker: React.FC<{
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return CURATED_ICONS;
    return CURATED_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索图标名称..."
          className="blog-input w-full pl-9 pr-3 py-2 text-xs rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
        {filteredIcons.map(name => {
          const IconComponent = (Icons as any)[name];
          if (!IconComponent) return null;

          const isSelected = selectedIcon === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={`aspect-square flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${isSelected
                  ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] shadow-lg scale-110 z-10'
                  : 'bg-white/40 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/10 hover:scale-105'
                }`}
              title={name}
            >
              <IconComponent size={18} />
            </button>
          );
        })}
        {filteredIcons.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-gray-400">
            无结果
          </div>
        )}
      </div>
    </div>
  );
};
