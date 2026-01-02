import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  // 允许传递 onClick 等标准 HTML 属性
}

export const LiquidGlass: React.FC<Props> = ({ children, className = "", ...props }) => {
  return (
    <div className={`liquid-glass-wrapper ${className}`} {...props}>
      {/* 1. 外层边框扭曲 (Outer Rim) */}
      <div className="liquid-glass-outer"></div>
      
      {/* 2. 主体模糊层 (Cover) */}
      <div className="liquid-glass-cover"></div>
      
      {/* 3. 内部锐利边框 (Sharp) */}
      <div className="liquid-glass-sharp"></div>
      
      {/* 4. 反光高光层 (Reflect) */}
      <div className="liquid-glass-reflect"></div>
      
      {/* 5. 实际内容 */}
      <div className="liquid-glass-content">
        {children}
      </div>
    </div>
  );
};