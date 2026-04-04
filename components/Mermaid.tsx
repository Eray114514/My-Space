"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  chart: string;
}

export const Mermaid: React.FC<Props> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        const isDark = document.documentElement.classList.contains('dark');
        mermaid.initialize({ 
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose'
        });
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error('Mermaid rendering failed', error);
        setSvg(`<div class="text-red-500 text-sm p-4 border border-red-500/20 rounded bg-red-500/10">Failed to render Mermaid chart</div>`);
      }
    };
    renderChart();
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className="mermaid flex justify-center my-8 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
