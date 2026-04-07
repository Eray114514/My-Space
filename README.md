# My Space - 个人空间与 AI 助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)
[![OpenAI SDK](https://img.shields.io/badge/OpenAI-6-412991)](https://platform.openai.com/)

**My Space** 是一个基于 React 19 和 Next.js 16 构建的现代化个人主页项目。它不仅展示了个人博客和作品集，还集成了一个强大的多模型 AI 聊天助手，支持 Google Gemini、DeepSeek 和 OpenRouter 等多种 AI 服务。项目设计极简、高端，并配备了完整的后台管理系统，支持云端数据同步。

## ✨ 功能特性

- **🤖 多模型 AI 对话**:
  - **多模型支持**:
    - **Google Gemini**: 支持最新的 **Gemini 3 Flash Preview** 模型，响应极快。
    - **DeepSeek**: 集成官方 API，支持 **DeepSeek V3** (高性价比) 和 **DeepSeek R1** (推理/思考模型)。
    - **OpenRouter**: 支持免费版 DeepSeek R1/V3 接口，降低使用门槛。
  - **云端记忆**: 所有对话记录（会话与消息）自动同步至 **Neon PostgreSQL** 云端数据库，多端无缝切换。
  - **流式响应**: 支持打字机效果的流式回复与 Markdown 实时渲染。
  - **上下文关联**: 支持在对话中引用博客文章作为上下文进行问答。

- **📝 个人博客系统**:
  - **Markdown 渲染**: 支持 GFM (GitHub Flavored Markdown)、代码高亮 (`react-syntax-highlighter`) 和引用块警告 (Alerts)。
  - **AI 辅助创作**: 集成 AI 自动生成文章摘要和标签功能。
  - **分类与标签**: 灵活的文章分类管理。

- **🚀 项目/作品集管理**:
  - **项目展示**: 优雅地展示个人项目或作品。
  - **智能图标**:
    - **自动获取**: 根据项目 URL 自动抓取网站 Favicon。
    - **AI 推荐**: 根据项目描述，AI 智能推荐合适的 Lucide 图标。
    - **AI 生成 SVG**: 使用推理模型 (DeepSeek R1) 为项目生成独一无二的 SVG 图标代码。

- **🔐 后台管理**:
  - **安全登录**: 简单的管理员认证机制。
  - **内容管理**: 全功能的文章与项目增删改查 (CRUD) 界面。
  - **全局配置**:
    - **AI 偏好设置**: 可配置默认的“通用对话模型”和“SVG 生成模型”。
    - **配置同步**: 系统设置存储在云端，跨设备保持一致。

- **🎨 现代化 UI/UX**:
  - **响应式设计**: 完美适配移动端和桌面端。
  - **玻璃拟态**: 运用现代化的玻璃拟态 (Glassmorphism) 风格组件。
  - **暗色/亮色模式**: 自动跟随系统或手动切换。

## 🛠️ 技术栈

- **前端框架**: [React 19](https://react.dev/) + [Next.js 16](https://nextjs.org/)
- **语言**: [TypeScript 6](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **路由**: [Next.js App Router](https://nextjs.org/docs/app)
- **AI SDK**:
  - `@google/genai` (Google Gemini)
  - `openai@6` (DeepSeek & OpenRouter 兼容客户端)
- **数据存储**: `@neondatabase/serverless` (Neon PostgreSQL)
- **图标**: `lucide-react`

## 🚀 快速开始

### 环境要求

- Node.js (推荐 v18 或更高版本)
- npm / yarn / pnpm

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-space
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

项目根目录下有一个 `.env.example` 文件，请将其复制为 `.env` 并填入你的配置信息：

```bash
cp .env.example .env
```

**`.env` 关键配置项:**

```env
# --- 数据库配置 (Neon PostgreSQL) ---
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# --- AI 服务配置 ---
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_key

# DeepSeek API Key (可选)
DEEPSEEK_API_KEY=sk-your_deepseek_key

# OpenRouter API Key (可选)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key

# --- 管理员账号 ---
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
├── components/          # UI 组件 (MarkdownRenderer, Layout, etc.)
├── pages/               # 页面组件
│   ├── admin/           # 后台管理 (AdminDashboard)
│   ├── Blog.tsx         # 博客列表
│   ├── ArticleDetail.tsx# 文章详情
│   ├── Chat.tsx         # AI 对话
│   ├── Home.tsx         # 首页 (含项目展示)
│   └── ...
├── services/            # 核心服务
│   ├── ai.ts            # AI 客户端与模型配置
│   └── storage.ts       # 数据库服务 (Neon PostgreSQL)
├── types.ts             # TypeScript 类型定义
└── App.tsx              # 路由配置
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。
