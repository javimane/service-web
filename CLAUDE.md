# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run test      # Run all tests once (Vitest)
```

To run a single test file:
```bash
npx vitest run src/pages/Login/LoginPage.test.jsx
```

## Environment Variables

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Entry point:** `src/main.jsx` wraps the app in `<StrictMode>`, `<BrowserRouter>`, and `<ThemeProvider>` (in that order).

**Routing** (`src/App.jsx`): React Router v7. Current routes: `/login`, `/register`. Any unmatched path redirects to `/login`. The `<ThemeToggle>` component renders outside routes, always visible.

**Auth** (`src/services/supabaseClient.js`): A single exported `supabase` instance used directly in pages. Login uses `supabase.auth.signInWithPassword`; Register uses `supabase.auth.signUp` with `full_name` in user metadata.

**Theme** (`src/context/ThemeContext.jsx`): Dark/light mode stored in `localStorage` under `app-theme`. Applied by setting `data-theme` attribute on `document.documentElement`. `useTheme()` hook exposes `{ theme, toggleTheme }`.

**File colocation:** Each page/component has its CSS file alongside it (e.g. `LoginPage.jsx` + `LoginPage.css`).

## Testing Conventions

- Tests use Vitest + Testing Library with jsdom (configured in `vite.config.js`).
- `src/setupTests.js` imports `@testing-library/jest-dom` for DOM matchers.
- Supabase is always mocked via `vi.mock('../../services/supabaseClient', ...)`.
- Pages that use React Router hooks must be wrapped in `<BrowserRouter>` in tests.
