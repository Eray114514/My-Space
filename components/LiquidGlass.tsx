"use client";

import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export const LiquidGlass: React.FC<Props> = ({ children, className = "", innerClassName = "", ...props }) => {
  return (
    <div className={`liquid-glass-wrapper glass-surface ${className}`} {...props}>
      <span className="glass-material-grid" aria-hidden="true" />
      <div className={`liquid-glass-content ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
