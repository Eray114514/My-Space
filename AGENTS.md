# AGENTS.md

## Commands

```bash
npm run dev          # dev server on port 5173
npm run build        # production build
npm run lint         # next lint
npm run check:glass  # enforces liquid-glass design system (see below)
```

No test framework is configured. No CI workflows exist.

## Architecture

**Next.js 16 + React 19 + TypeScript 6 + Tailwind CSS 4.**

Dual routing model:
- **`app/`** — App Router for all pages (server components by default)
- **`pages/api/`** — Pages Router for all API routes (this is intentional, not legacy)

Key directories:
- `services/ai.ts` — client-side AI facade (calls `/api/ai` and `/api/ai-stream`)
- `services/storage.ts` — client-side DB facade (calls `/api/storage` via RPC pattern)
- `services/server-storage.ts` — direct Neon SQL for server components (app/page.tsx, etc.)
- `components/` — shared UI; `components/chat/` — chat-specific UI
- `app/admin/` — admin dashboard (requires auth cookie)
- `scripts/check-glass-material.mjs` — design system linter

## Critical conventions

**Tailwind CSS v4** — uses `@import 'tailwindcss'` and `@plugin` syntax, NOT the v3 `@tailwind` directives or `tailwind.config.js`. PostCSS plugin is `@tailwindcss/postcss`.

**Liquid glass design system** — `backdrop-blur` is banned in new code. Use `<LiquidGlass>` component or `.glass-card`/`.glass-panel`/`.glass-popover` CSS classes. A handful of legacy files are exempt (see `scripts/check-glass-material.mjs` allowed list). Run `npm run check:glass` to verify.

**Path alias** — `@/*` maps to project root (e.g. `@/components/LiquidGlass`).

**AI model keys** — format is `"provider:modelId"` (e.g. `"deepseek:deepseek-chat"`, `"openrouter:google/gemini-3-flash-preview"`). Parsed by splitting on first `:`.

**Streaming** — `/api/ai-stream` uses Edge runtime and SSE format (`data: {content, reasoning}\n\n`). Only chat enables thinking/reasoning; summary/icon generation does not.

**Auth** — cookie-based: `admin_session=active` (HttpOnly). Checked server-side in API routes via `req.headers.cookie`. Admin actions in storage API: `initDB`, `saveArticle`, `deleteArticle`, `saveProject`, `deleteProject`, `saveSystemSetting`.

## Environment

Required env vars (see `.env.example`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin login
- `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY` — AI providers (at least one)

`NEXT_PUBLIC_ADMIN_USERNAME` is used client-side for display name in nav/layout.

## Database

Neon PostgreSQL with 5 tables: `articles`, `projects`, `settings`, `chat_sessions`, `chat_messages`. Schema is created lazily via `initDB` action (admin-only). Tags stored as JSON string in `articles.tags`. Chat uses `ON DELETE CASCADE` from sessions to messages.

## Project types

`types.ts` at root defines `Article`, `Project`, `Theme`, `User`. `Project.iconType` is `'auto' | 'preset' | 'generated'` — `generated` uses AI-created SVG stored in `customSvg`.
