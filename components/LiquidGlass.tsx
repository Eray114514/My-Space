"use client";

import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: 'panel' | 'card' | 'popover' | 'nav';
  allowOverflow?: boolean;
}

export const LiquidGlass: React.FC<Props> = ({
  children,
  className = "",
  innerClassName = "",
  variant,
  allowOverflow = false,
  ...props
}) => {
  const variantClass = variant ? `liquid-glass-${variant}` : "";
  const overflowClass = allowOverflow || variant === 'popover' ? "liquid-glass-overflow" : "";

  return (
    <div className={`liquid-glass-wrapper glass-surface ${variantClass} ${overflowClass} ${className}`} {...props}>
      <span className="glass-material-grid" aria-hidden="true" />
      <div className={`liquid-glass-content ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
