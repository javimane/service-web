# AGENTS.md — Proyecto service-web

## Comandos

```bash
npm run dev       # Iniciar Next.js dev server
npm run build     # Build de producción
npm run start     # Iniciar servidor de producción
npm run lint      # ESLint
npm run test      # Ejecutar todos los tests (Vitest)
npx vitest run src/views/Login/LoginPage.test.tsx  # Test específico
```

## Variables de Entorno

Se requiere `.env` / `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Arquitectura

- **Framework:** Next.js 15 App Router.
- **Entry:** `src/app/layout.tsx` → providers, `src/app/providers.tsx` (theme, auth, data).
- **Routing:** `src/app/` con folder-based routing. Paginas SEO dinámicas en carpetas `src/app/perfil/[seoPath]`, `src/app/productos/[seoPath]`, etc.
- **Compatibilidad:** `src/hooks/compat-router.ts` envuelve hooks de next/navigation para codigo legacy.
- **Auth:** `src/services/supabaseClient.ts` — cliente Supabase compartido.
- **Legacy:** `src/views/` contiene las pantallas actuales. NO crear rutas en `src/pages/`.

---

# GUIA DE ESTILOS — Design System

## ═══════════════════════════════════════

## REGLAS OBLIGATORIAS PARA LA IA

## ═══════════════════════════════════════

### Regla 1: Siempre usar CSS plano colocalizado

- Cada componente lleva su archivo `.css` en el mismo directorio.
- Patrón de importacion: `import "./ComponentName.css"`

### Regla 2: Nunca hardcodear colores

- **PROHIBIDO** usar valores hex/rgba directos como `#e94823`, `#ef4444`, `#4ade80`, etc.
- Siempre usar `var(--variable)` con las variables definidas en `:root` en `src/index.css`.

### Regla 3: Nunca usar estilos inline

- **PROHIBIDO** usar `style={{...}}` en JSX. Todo va en archivos CSS.
- La unica excepcion son valores verdaderamente dinamicos (ej: `style={{ height: dynamicPx }}`).

### Regla 4: Usar la escala de spacing definida

- Usar `var(--space-N)` en vez de valores arbitrarios como `8px`, `16px`, `2rem`.
- Para gaps entre elementos usar `gap: var(--space-N)`.

### Regla 5: Usar la escala tipografica definida

- Usar `var(--text-xs)` a `var(--text-4xl)` en vez de valores ad-hoc.
- Usar `var(--weight-N)` para font-weight.

### Regla 6: Usar la escala de border-radius definida

- Usar `var(--radius-sm)` a `var(--radius-full)`.

### Regla 7: Convencion de nomenclatura BEM

```
.block                        → componente principal
.block__element               → elemento interno
.block__element--modifier     → variante
.block--modifier              → variante del bloque
```

- Usar kebab-case para bloques/elementos.
- NO usar camelCase, snake_case, ni nombres planos sin prefijo.

### Regla 8: Breakpoints estandarizados

Usar SOLO estos media queries:

```css
@media (max-width: 640px) {
  /* mobile */
}
@media (max-width: 768px) {
  /* tablet */
}
@media (max-width: 1024px) {
  /* desktop chico */
}
@media (max-width: 1280px) {
  /* wide */
}
```

### Regla 9: Transiciones consistentes

- Hover en cards/elementos: `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Hover en botones/links: `transition: all 0.2s ease`
- Hover en cards: `transform: translateY(-6px)` con sombra `var(--shadow-xl)` y `var(--highlight-glow)`.

### Regla 10: Sin dependencias CSS externas

- NO usar Tailwind, styled-components, CSS Modules, Sass/SCSS.
- Usar solo CSS plano con `var()`.
- `clsx` y `tailwind-merge` estan instalados pero NO se usan.

### Regla 11: Tipografia de fuentes

- `var(--font-primary)` se resuelve a 'Outfit' (regular, medium, semibold, bold, extrabold, black).
- `var(--font-mono)` se resuelve a 'JetBrains Mono'.
- NO referenciar otras fuentes que no esten cargadas.
- NO agregar @import ni @font-face.

### Regla 12: Cards y contenedores principales

- Fondo: `var(--bg-card)`
- Borde: `1px solid var(--border-color)`
- Sombra: `var(--shadow-card)` o `var(--shadow-md)`
- Border-radius: `var(--radius-lg)`, `var(--radius-xl)` o `var(--radius-2xl)`
- Hover: `transform: translateY(-6px)` + `box-shadow` con `var(--highlight-glow)`

---

## ═══════════════════════════════════════

## TOKENS DE DISEÑO COMPLETOS

## ═══════════════════════════════════════

### Colores

| Token                  | Valor                  | Uso                       |
| ---------------------- | ---------------------- | ------------------------- |
| `--bg-color`           | `#ded9d9c1`            | Fondo de pagina           |
| `--bg-card`            | `#f8f9fa`              | Fondo de tarjetas         |
| `--surface-soft`       | `#f1f3f5`              | Superficie secundaria     |
| `--text-primary`       | `#000000`              | Texto principal           |
| `--text-secondary`     | `#5e6b7d`              | Texto secundario          |
| `--accent-color`       | `#e94823`              | Color de acento principal |
| `--accent-hover`       | `#d13d1c`              | Hover de acento           |
| `--accent-transparent` | `rgba(233,72,35,0.08)` | Fondo sutil de acento     |
| `--brand-blue`         | `#1d5fbf`              | Azul de marca             |
| `--border-color`       | `#808485`              | Bordes generales          |
| `--error-color`        | `#fa5252`              | Errores                   |
| `--success-color`      | `#40c057`              | Exito/verificado          |
| `--input-bg`           | `#ffffff`              | Fondo de inputs           |

### Tipografia

| Token                | Valor                     | Uso                       |
| -------------------- | ------------------------- | ------------------------- |
| `--font-primary`     | Outfit, Arial, sans-serif | Texto general             |
| `--font-mono`        | JetBrains Mono, monospace | Codigo/monospace          |
| `--text-xs`          | `0.625rem` (10px)         | Badges, etiquetas minimas |
| `--text-sm`          | `0.75rem` (12px)          | Metadata, timestamps      |
| `--text-base`        | `0.875rem` (14px)         | Cuerpo pequeño            |
| `--text-md`          | `1rem` (16px)             | Cuerpo normal             |
| `--text-lg`          | `1.125rem` (18px)         | Cuerpo grande             |
| `--text-xl`          | `1.5rem` (24px)           | Subtitulos                |
| `--text-2xl`         | `2rem` (32px)             | Titulos pequeños          |
| `--text-3xl`         | `2.5rem` (40px)           | Titulos grandes           |
| `--text-4xl`         | `3.25rem` (52px)          | Hero titles               |
| `--weight-normal`    | 400                       |                           |
| `--weight-medium`    | 500                       |                           |
| `--weight-semibold`  | 600                       |                           |
| `--weight-bold`      | 700                       |                           |
| `--weight-extrabold` | 800                       |                           |
| `--weight-black`     | 900                       |                           |

### Spacing

| Token        | Valor            |
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

| Token           | Valor  | Uso                                  |
| --------------- | ------ | ------------------------------------ |
| `--radius-sm`   | 8px    | Botones chicos, inputs               |
| `--radius-md`   | 12px   | Botones principales, tarjetas chicas |
| `--radius-lg`   | 16px   | Tarjetas, modales                    |
| `--radius-xl`   | 24px   | Tarjetas grandes, paneles            |
| `--radius-2xl`  | 28px   | Tarjetas hero, features              |
| `--radius-full` | 9999px | Pills, badges, avatars               |

### Sombras

| Token           | Valor                          |
| --------------- | ------------------------------ |
| `--shadow-sm`   | `0 1px 3px rgba(0,0,0,0.05)`   |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,0.05)`  |
| `--shadow-md`   | `0 4px 12px rgba(0,0,0,0.05)`  |
| `--shadow-lg`   | `0 10px 30px rgba(0,0,0,0.04)` |
| `--shadow-xl`   | `0 20px 40px rgba(0,0,0,0.12)` |

### Layout

| Token                 | Valor    |
| --------------------- | -------- |
| `--content-max-width` | `1280px` |
| `--section-padding-x` | `1.5rem` |
| `--section-padding-y` | `3rem`   |

---

## ═══════════════════════════════════════

## PATRON DE COMPONENTE (Template)

## ═══════════════════════════════════════

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

---

## ═══════════════════════════════════════

## REGLAS PARA BOTONES

## ═══════════════════════════════════════

### Boton primario (`.btn-primary`)

- Fondo: `var(--accent-color)`, texto: white
- Padding: `14px` (o `var(--space-3)` vertical)
- Border-radius: `var(--radius-md)`
- Hover: `var(--accent-hover)`, `translateY(-1px)`, sombra `var(--accent-transparent)`
- Disabled: `opacity: 0.7`, `cursor: not-allowed`

### Boton secundario / social (`.btn-secondary` / `.btn-social`)

- Fondo: `var(--input-bg)`, borde: `var(--border-color)`
- Hover: `var(--border-color)` de fondo

### Link Button (`.link-btn`)

- `background: none`, `border: none`, `color: var(--accent-color)`
- `font-weight: var(--weight-semibold)`

---

## ═══════════════════════════════════════

## REGLAS PARA INPUTS

## ═══════════════════════════════════════

- Fondo: `var(--input-bg)`
- Borde: `1px solid var(--border-color)`
- Padding: `14px 44px 14px 16px` (con icono a la derecha)
- Focus: `border-color: var(--accent-color)`, `box-shadow: 0 0 0 3px var(--accent-transparent)`
- Error: `border-color: var(--error-color)`, fondo: `rgba(239, 68, 68, 0.05)`
- Label: `var(--text-sm)`, `var(--weight-semibold)`, `var(--text-secondary)`, uppercase, `letter-spacing: 0.05em`

---

## ═══════════════════════════════════════

## ARCHIVOS DE REFERENCIA

## ═══════════════════════════════════════

Para ver ejemplos reales de componentes bien estilados, revisar:

- `src/components/Navbar/Navbar.css` — dropdowns, navegacion
- `src/views/Home/HomePage.css` — hero, search
- `src/views/Login/LoginPage.css` — formularios, cards
- `src/components/Cards/ServiceCard.css` — cards con hover
- `src/components/Cards/ProductCard.css` — product cards

## Testing

- Tests con Vitest + Testing Library + jsdom.
- `src/setupTests.ts` importa `@testing-library/jest-dom`.
- Mockear Supabase y servicios externos en tests.
- Componentes con `next/navigation` usar setup compatible con Next.
