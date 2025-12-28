# My Space - 个人空间与 AI 助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)](https://tailwindcss.com/)

**My Space** 是一个基于 React 和 Vite 构建的现代化个人主页项目。它不仅展示了个人博客和作品集，还集成了一个强大的多模型 AI 聊天助手，支持 Google Gemini、DeepSeek 和 OpenRouter 等多种 AI 服务。项目设计极简、高端，并配备了完整的后台管理系统。

## ✨ 功能特性

- **🤖 多模型 AI 对话**:
  - 集成 **Google Gemini** (Flash Preview)
  - 集成 **DeepSeek** 官方 API (V3, R1 Reasoner)
  - 集成 **OpenRouter** (支持免费版 DeepSeek R1/V3)
  - 支持流式响应 (Streaming) 和 Markdown 渲染
- **📝 个人博客系统**:
  - 支持 Markdown 撰写文章
  - 代码高亮 (`react-syntax-highlighter`)
  - 支持 GFM (GitHub Flavored Markdown) 和引用块警告
- **🎨 现代化 UI/UX**:
  - 响应式设计，适配移动端和桌面端
  - 使用 **Tailwind CSS** 构建精美界面
  - 极简主义风格
- **🔐 后台管理**:
  - 安全的管理员登录 (`/login`)
  - 文章管理与发布
  - 环境变量配置管理
- **🔎 全局搜索**: 快速检索文章和内容
- **☁️ 云端数据库**: 使用 **Neon PostgreSQL** (Serverless) 存储数据

## 🛠️ 技术栈

- **前端框架**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **路由**: [React Router](https://reactrouter.com/)
- **AI SDK**:
  - `@google/genai` (Gemini)
  - `openai` (DeepSeek & OpenRouter 兼容)
- **Markdown**: `react-markdown`, `remark-gfm`
- **图标**: `lucide-react`
- **数据库**: `@neondatabase/serverless` (PostgreSQL)

## 🚀 快速开始

### 环境要求

- Node.js (推荐 v18 或更高版本)
- npm 或 yarn / pnpm

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-space
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 3. 配置环境变量

项目根目录下有一个 `.env.example` 文件，请将其复制为 `.env` 并填入你的配置信息：

```bash
cp .env.example .env
```

**`.env` 配置项说明:**

```env
# --- 数据库配置 ---
# Neon PostgreSQL 连接字符串
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# --- AI 服务配置 ---
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# DeepSeek API Key (可选)
DEEPSEEK_API_KEY=sk-your_deepseek_key

# OpenRouter API Key (可选)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key

# --- 管理员账号配置 ---
ADMIN_USERNAME=Eray
ADMIN_PASSWORD=your_secure_password
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可预览项目。

### 5. 构建生产版本

```bash
npm run build
```

## 📂 项目结构

```
my-space/
├── components/          # 可复用的 UI 组件 (Layout, MarkdownRenderer 等)
├── pages/               # 页面组件
│   ├── admin/           # 后台管理相关页面
│   ├── Blog.tsx         # 博客列表页
│   ├── ArticleDetail.tsx# 文章详情页
│   ├── Chat.tsx         # AI 对话页
│   ├── Home.tsx         # 首页
│   ├── Login.tsx        # 管理员登录页
│   └── Search.tsx       # 搜索页
├── services/            # 服务层逻辑
│   ├── ai.ts            # AI 模型调用封装 (Gemini, DeepSeek, OpenRouter)
│   └── storage.ts       # 数据存储服务
├── App.tsx              # 主应用组件与路由配置
├── types.ts             # TypeScript 类型定义
├── vite.config.ts       # Vite 配置文件
└── tailwind.config.js   # Tailwind CSS 配置
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。
