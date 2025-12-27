# Eray's Space

一个极简设计的个人博客与导航网站，支持 Markdown 文章、AI 辅助写作和暗色主题。

## 功能特性

- 📝 **博客系统** - 支持 Markdown 格式文章，代码高亮，标签分类

- 🎨 **极简设计** - 现代化 UI，流畅的动画效果

- 🌓 **主题切换** - 支持亮色/暗色模式

- 🤖 **AI 辅助** - 集成 Google Gemini 和 DeepSeek，自动生成摘要和标签

- 📱 **响应式** - 完美适配桌面和移动设备

- 🔐 **管理后台** - 简单的登录验证，管理文章和导航链接

- 🗄️ **数据持久化** - 使用 Neon PostgreSQL 数据库存储

## 技术栈

- **前端框架**: React 18 + TypeScript

- **构建工具**: Vite 5

- **样式**: Tailwind CSS 3

- **路由**: React Router 6

- **Markdown**: react-markdown + remark-gfm

- **代码高亮**: react-syntax-highlighter

- **数据库**: Neon PostgreSQL (Serverless)

- **AI 服务**: Google Gemini 3 Flash, DeepSeek Chat

- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 为 `.env` 并配置以下变量：

```env
VITE_DATABASE_URL=postgresql://your-database-url
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
eray's-space/
├── components/
│   ├── Layout.tsx          # 主布局组件
│   └── MarkdownRenderer.tsx # Markdown 渲染器
├── pages/
│   ├── Home.tsx            # 主页
│   ├── Blog.tsx            # 文章列表
│   ├── ArticleDetail.tsx   # 文章详情
│   ├── Login.tsx           # 登录页面
│   └── admin/
│       └── AdminDashboard.tsx # 管理后台
├── services/
│   ├── storage.ts          # 数据存储服务
│   └── ai.ts               # AI 服务
├── App.tsx                 # 应用入口
├── types.ts                # TypeScript 类型定义
└── vite.config.ts          # Vite 配置
```

## 数据库表结构

### articles 表

|字段|类型|说明|
|-|-|-|
|id|TEXT|主键|
|title|TEXT|标题|
|summary|TEXT|摘要|
|content|TEXT|Markdown 内容|
|created_at|TEXT|创建时间|
|updated_at|TEXT|更新时间|
|is_published|BOOLEAN|是否发布|
|tags|TEXT|标签（JSON 数组）|

### projects 表

|字段|类型|说明|
|-|-|-|
|id|TEXT|主键|
|title|TEXT|标题|
|description|TEXT|描述|
|url|TEXT|链接地址|
|icon_type|TEXT|图标类型 (auto/preset)|
|preset_icon|TEXT|预设图标名称|

## AI 功能

### 自动生成摘要

在管理后台编辑文章时，点击"AI 摘要"按钮，AI 会根据文章内容自动生成 60-120 字的中文摘要。

### 自动生成标签

点击"自动标签"按钮，AI 会根据文章标题和内容生成相关的技术标签。

### AI 提供商切换

支持在 Google Gemini 和 DeepSeek 之间切换，可在管理后台设置中选择。

## 页面说明

### 主页 (/)

展示个人介绍、网站导航和最近更新的文章。

### 文章列表 (/blog)

按时间线展示所有已发布的文章。

### 文章详情 (/blog/:id)

展示完整的文章内容，支持 Markdown 渲染和代码高亮。

### 管理后台 (/admin)

- 文章管理：创建、编辑、删除文章

- 导航管理：添加、编辑、删除网站链接

- AI 设置：选择 AI 提供商

## 开发说明

### 添加新功能

1. 在 `pages/` 目录创建新页面组件

2. 在 `App.tsx` 中添加路由

3. 如需全局状态，使用 React Context 或状态管理库

### 样式约定

- 使用 Tailwind CSS 类名

- 遵循亮色/暗色主题适配

- 保持组件样式一致性

### 类型定义

所有类型定义在 `types.ts` 中，确保类型安全。

## 许可证

MIT