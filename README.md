# panwar_client_dash

React 19 + Vite SPA — the pharma client portal for the Panwar Portals project. Clients sign in via magic link and view their own media performance dashboards, branded per client.

**Production:** `https://portal.panwarhealth.com.au`
**Local dev:** `http://localhost:5173`

## Quick start

```bash
npm install
# Make sure panwar_api is running on :7071 in another shell
cd ../panwar_api && func start
# Then in this folder:
npm run dev
```

Open http://localhost:5173 — you'll be redirected to /login. Sign in with an email that exists as a client user in `panwar_portals.app_user`.

See `CLAUDE.md` for the full architecture, conventions, and route reference.

## Stack

- Vite 6 + React 19 + TypeScript strict
- Tailwind CSS + hand-rolled shadcn-style primitives
- TanStack Router (file-based) + TanStack Query
- React Hook Form + Zod
- Recharts (Tremor v3 still pins React 18, blocks React 19)

## Build conventions

- Strict TypeScript — `tsc -b` must pass clean
- No raw `fetch` in components — use `src/api/`
- No tokens in JavaScript — auth is HttpOnly cookies on `.panwarhealth.com.au`
- All API calls use `credentials: 'include'`
- Path alias `@/` for `src/`

## Repo siblings

- [`panwar_api`](../panwar_api) — C# backend
- [`panwar_employee_dash`](../panwar_employee_dash) — employee portal
- [`panwar_portals`](../panwar_portals) — project manager folder
