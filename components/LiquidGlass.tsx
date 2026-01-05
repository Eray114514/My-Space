import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export const LiquidGlass: React.FC<Props> = ({ children, className = "", innerClassName = "", ...props }) => {
  return (
    <div className={`liquid-glass-wrapper ${className}`} {...props}>
      {/* 1. The Distorted Rim (Outer) */}
      <div className="liquid-glass-outer"></div>

      {/* 2. The Main Surface (Cover) */}
      <div className="liquid-glass-cover"></div>

      {/* 3. The Sharp Inner Border (Sharp) */}
      <div className="liquid-glass-sharp"></div>

      {/* 4. The Reflections (Reflect) */}
      <div className="liquid-glass-reflect"></div>

      {/* 5. The Content Container */}
      <div className={`liquid-glass-content ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};