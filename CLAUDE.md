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

**Fonts:** Outfit (400-900) and JetBrains Mono (400,500,700) loaded via `next/font/google` in `layout.tsx` as CSS variables `--font-primary` and `--font-mono`.

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

---

# STYLE GUIDE

## Mandatory Rules

### Rule 1: Always use plain CSS co-located

- Every component has its own `.css` file in the same directory.
- Import pattern: `import "./ComponentName.css"`

### Rule 2: Never hardcode colors

- **FORBIDDEN** to use hex/rgba values like `#e94823`, `#ef4444`, `#4ade80`.
- Always use `var(--variable)` from `:root` in `src/index.css`.

### Rule 3: Never use inline styles

- **FORBIDDEN** to use `style={{...}}` in JSX. Everything goes in CSS files.
- Only exception: truly dynamic values (e.g. `style={{ height: dynamicPx }}`).

### Rule 4: Use the defined spacing scale

- Use `var(--space-N)` instead of arbitrary values like `8px`, `16px`, `2rem`.
- Use `gap: var(--space-N)` for element gaps.

### Rule 5: Use the defined typography scale

- Use `var(--text-xs)` through `var(--text-4xl)` instead of ad-hoc values.
- Use `var(--weight-N)` for font-weight.

### Rule 6: Use the defined border-radius scale

- Use `var(--radius-sm)` through `var(--radius-full)`.

### Rule 7: BEM naming convention

```
.block                      → main component
.block__element             → internal element
.block__element--modifier   → variant
.block--modifier            → block variant
```

- Use kebab-case for blocks/elements.
- NO camelCase, snake_case, or flat names without prefix.

### Rule 8: Standardized breakpoints

Use ONLY these media queries:

```css
@media (max-width: 640px) {
  /* mobile */
}
@media (max-width: 768px) {
  /* tablet */
}
@media (max-width: 1024px) {
  /* small desktop */
}
@media (max-width: 1280px) {
  /* wide */
}
```

### Rule 9: Consistent transitions

- Cards/elements hover: `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Buttons/links hover: `transition: all 0.2s ease`
- Card hover: `transform: translateY(-6px)` + `box-shadow: var(--shadow-xl)` and `var(--highlight-glow)`.

### Rule 10: No external CSS dependencies

- NO Tailwind, styled-components, CSS Modules, Sass/SCSS.
- Plain CSS with `var()` only.
- `clsx` and `tailwind-merge` are installed but NOT used.

### Rule 11: Typography fonts

- `var(--font-primary)` → 'Outfit' (regular, medium, semibold, bold, extrabold, black).
- `var(--font-mono)` → 'JetBrains Mono'.
- DO NOT reference other fonts not loaded.
- DO NOT add @import or @font-face.

### Rule 12: Cards and main containers

- Background: `var(--bg-card)`
- Border: `1px solid var(--border-color)`
- Shadow: `var(--shadow-card)` or `var(--shadow-md)`
- Border-radius: `var(--radius-lg)`, `var(--radius-xl)` or `var(--radius-2xl)`
- Hover: `transform: translateY(-6px)` + `box-shadow` with `var(--highlight-glow)`

## Design Tokens

### Colors

| Token                  | Value                  | Usage             |
| ---------------------- | ---------------------- | ----------------- |
| `--bg-color`           | `#ded9d9c1`            | Page background   |
| `--bg-card`            | `#f8f9fa`              | Card background   |
| `--surface-soft`       | `#f1f3f5`              | Secondary surface |
| `--text-primary`       | `#000000`              | Primary text      |
| `--text-secondary`     | `#5e6b7d`              | Secondary text    |
| `--accent-color`       | `#e94823`              | Main accent color |
| `--accent-hover`       | `#d13d1c`              | Accent hover      |
| `--accent-transparent` | `rgba(233,72,35,0.08)` | Subtle accent bg  |
| `--brand-blue`         | `#1d5fbf`              | Brand blue        |
| `--border-color`       | `#808485`              | General borders   |
| `--error-color`        | `#fa5252`              | Errors            |
| `--success-color`      | `#40c057`              | Success/verified  |
| `--input-bg`           | `#ffffff`              | Input background  |

### Typography

| Token         | Value             | Usage                  |
| ------------- | ----------------- | ---------------------- |
| `--text-xs`   | `0.625rem` (10px) | Badges, minimal labels |
| `--text-sm`   | `0.75rem` (12px)  | Metadata, timestamps   |
| `--text-base` | `0.875rem` (14px) | Small body             |
| `--text-md`   | `1rem` (16px)     | Normal body            |
| `--text-lg`   | `1.125rem` (18px) | Large body             |
| `--text-xl`   | `1.5rem` (24px)   | Subtitles              |
| `--text-2xl`  | `2rem` (32px)     | Small titles           |
| `--text-3xl`  | `2.5rem` (40px)   | Large titles           |
| `--text-4xl`  | `3.25rem` (52px)  | Hero titles            |

### Spacing

| Token        | Value            |
| ------------ | ---------------- |
| `--space-1`  | `0.25rem` (4px)  |
| `--space-2`  | `0.5rem` (8px)   |
| `--space-3`  | `0.75rem` (12px) |
| `--space-4`  | `1rem` (16px)    |
| `--space-5`  | `1.25rem` (20px) |
| `--space-6`  | `1.5rem` (24px)  |
| `--space-8`  | `2rem` (32px)    |
| `--space-10` | `2.5rem` (40px)  |
| `--space-12` | `3rem` (48px)    |
| `--space-16` | `4rem` (64px)    |

### Border Radius

| Token           | Value  | Usage                     |
| --------------- | ------ | ------------------------- |
| `--radius-sm`   | 8px    | Small buttons, inputs     |
| `--radius-md`   | 12px   | Main buttons, small cards |
| `--radius-lg`   | 16px   | Cards, modals             |
| `--radius-xl`   | 24px   | Large cards, panels       |
| `--radius-2xl`  | 28px   | Hero cards, features      |
| `--radius-full` | 9999px | Pills, badges, avatars    |

### Shadows

| Token           | Value                          |
| --------------- | ------------------------------ |
| `--shadow-sm`   | `0 1px 3px rgba(0,0,0,0.05)`   |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,0.05)`  |
| `--shadow-md`   | `0 4px 12px rgba(0,0,0,0.05)`  |
| `--shadow-lg`   | `0 10px 30px rgba(0,0,0,0.04)` |
| `--shadow-xl`   | `0 20px 40px rgba(0,0,0,0.12)` |

## Component Template

```tsx
// ComponentName.tsx
import "./ComponentName.css";

interface ComponentNameProps {
  title: string;
  variant?: "default" | "featured";
}

export default function ComponentName({
  title,
  variant = "default",
}: ComponentNameProps) {
  return (
    <div className={`component-name component-name--${variant}`}>
      <h2 className="component-name__title">{title}</h2>
      <p className="component-name__description">...</p>
    </div>
  );
}
```

```css
/* ComponentName.css */
.component-name {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.component-name:hover {
  transform: translateY(-6px);
  border-color: var(--accent-color);
  box-shadow: var(--shadow-xl);
}

.component-name--featured {
  border-color: var(--accent-color);
}

.component-name__title {
  font-size: var(--text-xl);
  font-weight: var(--weight-extrabold);
  color: var(--text-primary);
}

.component-name__description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .component-name {
    padding: var(--space-4);
  }
}
```

## Button Patterns

### Primary button (`.btn-primary`)

- Background: `var(--accent-color)`, text: white
- Padding: `14px` vertical
- Border-radius: `var(--radius-md)`
- Hover: `var(--accent-hover)`, `translateY(-1px)`, shadow `var(--accent-transparent)`
- Disabled: `opacity: 0.7`, `cursor: not-allowed`

### Secondary / social button (`.btn-secondary` / `.btn-social`)

- Background: `var(--input-bg)`, border: `var(--border-color)`
- Hover: `var(--border-color)` background

### Link button (`.link-btn`)

- `background: none`, `border: none`, `color: var(--accent-color)`
- `font-weight: var(--weight-semibold)`

## Input Patterns

- Background: `var(--input-bg)`
- Border: `1px solid var(--border-color)`
- Padding: `14px 44px 14px 16px` (with icon on right)
- Focus: `border-color: var(--accent-color)`, `box-shadow: 0 0 0 3px var(--accent-transparent)`
- Error: `border-color: var(--error-color)`, bg: `rgba(239, 68, 68, 0.05)`
- Label: `--text-sm`, `--weight-semibold`, `--text-secondary`, uppercase, `letter-spacing: 0.05em`

## Reference Files

See real well-styled components:

- `src/components/Navbar/Navbar.css` — dropdowns, navigation
- `src/views/Home/HomePage.css` — hero, search
- `src/views/Login/LoginPage.css` — forms, cards
- `src/components/Cards/ServiceCard.css` — card hover effects
- `src/components/Cards/ProductCard.css` — product cards
