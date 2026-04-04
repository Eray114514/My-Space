# Tasks
- [x] Task 1: Initialize Next.js dependencies and configuration
  - [x] SubTask 1.1: Remove Vite, `react-router-dom` and Vite-specific configurations (`vite.config.ts`, `index.html`).
  - [x] SubTask 1.2: Install Next.js and its peer dependencies.
  - [x] SubTask 1.3: Update `package.json` scripts (`dev`, `build`, `start`, `lint`) and configure `next.config.mjs` (if needed) and `tsconfig.json`.

- [x] Task 2: Setup App Router layout and global configurations
  - [x] SubTask 2.1: Create `app/layout.tsx` (the root layout) replacing `App.tsx` and `index.tsx`.
  - [x] SubTask 2.2: Migrate global CSS and Tailwind CSS configuration.
  - [x] SubTask 2.3: Configure `next/font` for optimized custom fonts.

- [x] Task 3: Migrate Shared Components to Next.js specific features
  - [x] SubTask 3.1: Replace `react-router-dom`'s `Link` and `useNavigate` with `next/link` and `useRouter` across all components (e.g., `ChatTopBar`, `Layout`, `MessageItem`).
  - [x] SubTask 3.2: Use `next/image` to optimize any static or external images in components (if applicable).
  - [x] SubTask 3.3: Mark components requiring browser APIs or interactivity with `"use client"` (e.g., MarkdownRenderer, Mermaid, ChatSidebar, LiquidGlass).

- [x] Task 4: Migrate Pages to App Router with Server Components
  - [x] SubTask 4.1: Migrate `Home.tsx` to `app/page.tsx`.
  - [x] SubTask 4.2: Migrate `Blog.tsx` to `app/blog/page.tsx` and implement server-side data fetching for the blog list.
  - [x] SubTask 4.3: Migrate `ArticleDetail.tsx` to `app/article/[id]/page.tsx` using Server Components to fetch data directly (removing `useEffect` and loading states). Use ISR if applicable (e.g., `revalidate`).
  - [x] SubTask 4.4: Migrate `Chat.tsx` to `app/chat/page.tsx` (ensure it remains a Client Component as it needs state).
  - [x] SubTask 4.5: Migrate `Search.tsx` to `app/search/page.tsx`.
  - [x] SubTask 4.6: Migrate `Login.tsx` to `app/login/page.tsx`.
  - [x] SubTask 4.7: Migrate Admin pages (`pages/admin/*`) to `app/admin/*` and preserve admin functionality.

- [x] Task 5: Enhance SEO with Next.js Metadata API
  - [x] SubTask 5.1: Add dynamic `generateMetadata` to `app/article/[id]/page.tsx` to ensure search engines and AI bots get the correct title and description.
  - [x] SubTask 5.2: Add static metadata to root `layout.tsx`, `blog/page.tsx`, etc.

- [x] Task 6: Testing and Cleanup
  - [x] SubTask 6.1: Run `npm run build` to ensure the project builds correctly without Vite or React Router errors.
  - [x] SubTask 6.2: Test Next.js server locally with `npm run start` and verify SEO elements (e.g., View Page Source on an article shows actual content).
  - [x] SubTask 6.3: Delete redundant files from the old `pages/` and Vite setup.

- [x] Task 7: Commit and Push to `main`
  - [x] SubTask 7.1: Stage all changes.
  - [x] SubTask 7.2: Create a structured commit following the project's commit rules (e.g., `refactor(build): 迁移到 Next.js 架构以支持服务端渲染和 SEO 优化`).
  - [x] SubTask 7.3: Push the changes to the `main` branch to trigger a Vercel deployment.

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 6]
