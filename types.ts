export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string; // Markdown
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  iconType: 'auto' | 'preset' | 'generated'; // 新增 generated 类型
  presetIcon?: string; // name of lucide icon
  imageBase64?: string; // 新增：存储 Favicon 的 Base64 数据
  customSvg?: string;   // 新增：存储 AI 生成的 SVG 代码
}

export type Theme = 'light' | 'dark';

export interface User {
  username: string;
  isAdmin: boolean;
}