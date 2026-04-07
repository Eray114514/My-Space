"use client";

import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export const LiquidGlass: React.FC<Props> = ({ children, className = "", innerClassName = "", ...props }) => {
  return (
    <div className={`liquid-glass-wrapper ${className}`} {...props}>
      <div className={`liquid-glass-content ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};