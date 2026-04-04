# Migrate to Next.js Spec

## Why
当前项目使用 Vite 构建，是一个标准的客户端单页应用（SPA）。由于爬虫（如 AI 或者搜索引擎）通常不执行 JavaScript 或者不会等待异步数据拉取完成，导致爬取的总是“正在加载...”这种无用内容，SEO 极差。将项目迁移到 Next.js 能够全面解锁 Vercel 的原生能力，通过服务端渲染（SSR）或静态生成（SSG/ISR）从根本上解决 SEO 问题，并且能利用 Next.js 生态中的高级特性（如内置图像优化、字体优化、服务端组件等）提升整体性能和用户体验。

## What Changes
- 移除 Vite 和 React Router 相关依赖，安装 Next.js。
- **BREAKING**: 将现有的页面路由从 `react-router-dom` 迁移到 Next.js 最新的 App Router（`app/` 目录结构）。
- **BREAKING**: 修改数据获取方式，将原先在 `useEffect` 中的客户端请求改造为在服务端组件（Server Components）中直接拉取数据，消除首屏的 loading 状态。
- 使用 `next/link` 替换现有的 `<Link>`，以享受 Next.js 提供的自动预取（Prefetching）功能。
- 使用 `next/image` 优化项目中的静态图片加载（如果适用）。
- 利用 Next.js 的 Metadata API 为博客文章和核心页面动态生成 `<title>` 和 `<meta>` 标签，进一步优化 SEO 和社交平台分享效果。
- 引入 `next/font` 优化字体加载，减少 CLS（累积布局偏移）。
- 修改 `package.json` 中的 `dev`、`build`、`start` 脚本，并新增/修改 Vercel 相关配置（如果需要）。
- 提交并推送修改到 `main` 分支，使得 Vercel 能够自动重新部署。

## Impact
- Affected specs: 页面路由、数据获取机制、SEO 配置、图片和字体优化、构建及部署流程。
- Affected code:
  - `package.json`（依赖和脚本变更）
  - `vite.config.ts` 和 `index.html`（将被移除）
  - `pages/` 和 `components/` 目录（需适配 App Router 和 Next.js 特性，重构为 `app/` 目录结构）
  - 数据获取逻辑（由客户端转移到服务端）

## ADDED Requirements
### Requirement: SEO 和 AI 爬虫支持
系统 SHALL 在服务端直接返回包含文章正文的完整 HTML 内容，不再使用纯前端渲染。

#### Scenario: AI 爬取文章页面
- **WHEN** AI 爬虫或搜索引擎请求具体的文章链接时
- **THEN** 系统直接返回带有文章标题、内容、Metadata 的完整 HTML，无任何“Loading”占位符。

### Requirement: 性能优化与特性增强
系统 SHALL 自动利用 Next.js 的图片优化、字体优化以及路由预取机制。

#### Scenario: 用户浏览博客列表
- **WHEN** 用户在博客列表页滚动浏览时
- **THEN** `next/link` 自动预加载视口内文章页面的代码，实现丝滑跳转；页面字体无闪烁。

## MODIFIED Requirements
### Requirement: 页面路由与组件结构
现有基于 `react-router-dom` 的路由配置 SHALL 替换为 Next.js 约定式的文件系统路由（App Router），以获得更佳的服务端组件支持。

## REMOVED Requirements
### Requirement: Vite 构建与开发环境
**Reason**: Next.js 拥有自己的构建与开发工具链（基于 Webpack/Turbopack），Vite 不再适用。
**Migration**: 移除所有 Vite 相关配置文件、依赖和构建脚本。
