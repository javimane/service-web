# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run start     # Start the production server
npm run lint      # ESLint
npm run test      # Run all tests once (Vitest)
```

To run a single test file:

```bash
npx vitest run src/views/Login/LoginPage.test.tsx
```

## Environment Variables

Requires `.env` / `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

**Framework:** Next.js 15 App Router.

**App entry:** `src/app/layout.tsx` wraps the app in providers, and `src/app/providers.tsx` wires theme, auth, and data providers.

**Routing:** App routes live under `src/app/` and use folder-based routing. Dynamic SEO pages are under folders like `src/app/perfil/[seoPath]`, `src/app/productos/[seoPath]`, `src/app/promociones/[seoPath]`, and `src/app/promociones-bancarias/[seoPath]`.

**Compatibility hooks:** `src/hooks/compat-router.ts` provides Next.js wrappers for navigation/search params so older React Router-style code can keep working during the migration.

**Auth:** `src/services/supabaseClient.ts` exports the shared Supabase client. Auth flows use Supabase directly from pages and contexts.

**Theme:** `src/context/ThemeContext.tsx` stores theme in `localStorage` and applies it through `data-theme` on `document.documentElement`.

**UI colocation:** Components and view sections keep their CSS alongside the TSX files.

**Legacy code:** `src/views/` contains the current app screens. Avoid reintroducing new routes under `src/pages/`; the project is App Router based.

## Testing Conventions

- Tests use Vitest + Testing Library with jsdom.
- `src/setupTests.ts` imports `@testing-library/jest-dom`.
- Supabase and other services should be mocked in tests when a page or hook depends on them.
- Components that use `next/navigation` hooks should be tested with the Next-compatible setup used in this repo, not React Router wrappers.
