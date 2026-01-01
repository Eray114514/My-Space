# My Space - 个人空间与 AI 助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)](https://tailwindcss.com/)

**My Space** 是一个基于 React 和 Vite 构建的现代化个人主页项目。它不仅展示了个人博客和作品集，还集成了一个强大的多模型 AI 聊天助手，支持 Google Gemini、DeepSeek 和 OpenRouter 等多种 AI 服务。项目设计极简、高端，并配备了完整的后台管理系统，支持云端数据同步。

## ✨ 功能特性

- **🤖 多模型 AI 对话**:
  - **多模型支持**:
    - **Google Gemini** (Flash Preview)
    - **DeepSeek** 官方 API (V3, R1 Reasoner)
    - **OpenRouter** (支持免费版 DeepSeek R1/V3)
  - **云端记忆**: 所有对话记录（会话与消息）自动同步至云端数据库，多端无缝切换。
  - **智能配置**: 支持在后台管理默认使用的 AI 模型（通用对话/SVG 生成）。
  - **流式响应**: 支持打字机效果的流式回复与 Markdown 实时渲染。

- **📝 个人博客系统**:
  - 支持 Markdown 撰写文章
  - 代码高亮 (`react-syntax-highlighter`)
  - 支持 GFM (GitHub Flavored Markdown) 和引用块警告 (Alerts)
  - 文章分类与标签管理

- **🎨 现代化 UI/UX**:
  - 响应式设计，适配移动端和桌面端
  - 使用 **Tailwind CSS** 构建精美界面
  - **暗色/亮色模式**: 自动跟随系统或手动切换，并持久化保存用户偏好。

- **🔐 后台管理**:
  - 安全的管理员登录
  - **文章管理**: 发布、编辑、删除博客文章。
  - **全局配置**: 管理 AI 模型偏好（通用模型、代码生成模型）。

- **☁️ 云端数据库**:
  - 使用 **Neon PostgreSQL** (Serverless) 存储文章、对话记录及系统配置。
  - 数据持久化，不再丢失任何灵感。

## 🛠️ 技术栈

- **前端框架**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **路由**: [React Router](https://reactrouter.com/)
- **AI SDK**:
  - `@google/genai` (Gemini)
  - `openai` (DeepSeek & OpenRouter 兼容)
- **Markdown**: `react-markdown`, `remark-gfm`, `remark-github-blockquote-alert`
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
├── components/          # 可复用的 UI 组件 (Layout, MarkdownRenderer, etc.)
├── pages/               # 页面组件
│   ├── admin/           # 后台管理 (AdminDashboard - 文章与配置管理)
│   ├── Blog.tsx         # 博客列表
│   ├── ArticleDetail.tsx# 文章详情
│   ├── Chat.tsx         # AI 对话 (包含历史记录侧边栏)
│   ├── Home.tsx         # 首页
│   ├── Login.tsx        # 管理员登录
│   └── Search.tsx       # 搜索页
├── services/            # 服务层逻辑
│   ├── ai.ts            # AI 模型客户端配置 (Gemini, DeepSeek, OpenRouter)
│   └── storage.ts       # 数据库服务 (Neon PostgreSQL - 文章/对话/配置)
├── App.tsx              # 主应用组件与路由
├── types.ts             # TypeScript 类型定义
├── vite.config.ts       # Vite 配置
└── tailwind.config.js   # Tailwind CSS 配置
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。
