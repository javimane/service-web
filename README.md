# service-web

## Requisitos

- Node.js 22.12+ (recomendado) o 20.19+

Si usas `nvm`, el repositorio incluye `.nvmrc` para alinear version:

```bash
nvm install
nvm use
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Payway en la web

Si la API usa Payway, configurá estas variables en `.env` y en el entorno de despliegue de Next.js:

```env
NEXT_PUBLIC_PAYWAY_PUBLIC_KEY=clave_publica_de_payway
NEXT_PUBLIC_PAYWAY_ENVIRONMENT=sandbox
```

`NEXT_PUBLIC_PAYWAY_ENVIRONMENT` admite `sandbox` o `production` y debe coincidir con `PAYWAY_ENVIRONMENT` de `cercio-api`. La clave pública debe corresponder al mismo entorno. Next.js incluye las variables `NEXT_PUBLIC_` en el navegador durante el build; la clave privada permanece solo en la API. La API sigue definiendo el proveedor activo y procesando el cobro.

La web envía los datos de tarjeta al endpoint propio `/api/payments/payway/token`, que los reenvía a Payway y devuelve solo el token. Este endpoint existe porque el gateway sandbox rechaza el preflight CORS del navegador. Los datos de tarjeta atraviesan el servidor Next.js durante esa solicitud; no deben registrarse en logs ni persistirse. Para volver a tokenizar directamente desde el navegador, Payway debe habilitar CORS para el origen de la web o proveer un formulario alojado compatible.

## Notas

- Si ejecutas con Node 18, Vite no inicia y veras errores como `CustomEvent is not defined`.
- Los botones de Agregar/Añadir y Subir usan verde claro (`data-action-tone="add"` / `"upload"`); los de Cancelar usan rojo claro (`data-action-tone="cancel"`). Los colores compartidos estan en `src/index.css` y la regla de uso en `AGENTS.md`.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
