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
  iconType: 'auto' | 'preset';
  presetIcon?: string; // name of lucide icon
}

export type Theme = 'light' | 'dark';

export interface User {
  username: string;
  isAdmin: boolean;
}