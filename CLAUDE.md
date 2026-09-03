# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check (tsc -b) then bundle with Vite
npm run lint      # ESLint over all files
npm run preview   # Preview the production build locally
```

There is no test runner configured yet.

## Stack

- **React 19** with TypeScript 6, bundled by **Vite 8**
- **Tailwind CSS v4** — imported via a single `@import "tailwindcss"` in `src/index.css` (no config file; uses the `@tailwindcss/vite` plugin)
- **shadcn/ui** (new-york style) for UI primitives; **`@tabler/icons-react`** for icons
- **React Router** (`react-router-dom`) for navigation
- **Axios** (`src/services/api.ts`) for the future Spring Boot API
- ESLint with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`

## Architecture

A task-manager UI. `src/main.tsx` mounts `<App>` into `#root`, wrapping it in
`ThemeProvider` then `TasksProvider`. `src/App.tsx` defines the React Router
routes under a shared `AppLayout` (sidebar + routed main column).

Source layout (`src/`):

- `components/ui/` — shadcn/ui primitives. **Do not hand-edit**; regenerate via `npx shadcn add <name>`. Excluded from the `react-refresh/only-export-components` lint rule (see `eslint.config.js`) because generated files co-export variant helpers.
- `components/layout/` — app shell: `AppLayout`, `Sidebar`, `Topbar`, `PageContent`
- `components/tasks/` — task-domain UI: `TaskItem`, `TaskSection`, `CategoryBadge`, `ProgressCard`
- `pages/` — one default-exported component per route (`TodayPage`, `AllTasksPage`, `CompletedPage`, `CategoryPage`)
- `context/` — React context. The context object + its `use*` hook live in a `*-context.ts` file; the provider component lives in a separate `*Provider.tsx` file (keeps Fast Refresh happy — a file must export only components). `ThemeProvider` toggles a `.dark` class on `<html>` and persists to `localStorage`; `TasksProvider` holds task state.
- `services/` — Axios instance & API calls (`api.ts`, `baseURL: /api`)
- `data/` — `mockTasks.ts` seed data; swap point for the real API is marked `TODO(api)` in `TasksProvider.tsx`
- `lib/` — pure helpers: `utils.ts` (`cn`), `date.ts` (due-date labels), `tasks.ts` (selectors/counts)
- `types/` — shared types (`Task`, `Category`), intended to mirror the backend JSON
- `index.css` — Tailwind import + light/dark theme tokens (CSS variables exposed to Tailwind via `@theme inline`)
- `public/` — static assets served at `/`

Import via the `@/` alias (configured in `vite.config.ts` and `tsconfig.app.json`) rather than long relative paths. `vite.config.ts` also proxies `/api` → `http://localhost:8080` in dev.

## TypeScript strictness

`tsconfig.app.json` enforces `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`. Keep all declared variables and parameters used; remove them rather than prefixing with `_`. Avoid runtime-only TS syntax (e.g. `enum`) — use union types and `const` arrays. Note `baseUrl` was removed (deprecated in TS 6); `paths` resolves relative to the config file.
