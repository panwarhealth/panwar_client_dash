# Panwar Client Dashboard

The pharma client portal — clients log in via magic link to view their own media performance dashboards. Branded per client (logo + colours from the database). Read-only for data, but clients can leave comments and approve/query months.

**Production:** `https://portal.panwarhealth.com.au`
**Local dev:** `http://localhost:5173`

## Tech stack

- **Build:** Vite 6
- **Framework:** React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS 3 + small set of hand-rolled shadcn-style primitives
- **Routing:** TanStack Router (file-based, generated route tree)
- **Data fetching:** TanStack Query 5
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts (no Tremor — Tremor v3 still pins React 18, blocks React 19)
- **Icons:** lucide-react
- **Hosting:** Cloudflare Pages

## Project structure

```
panwar_client_dash/
├── public/                       # Static assets (PH logo, favicon)
├── src/
│   ├── api/                      # Fetch wrapper + endpoint clients
│   │   ├── client.ts             # apiFetch wrapper (credentials: 'include')
│   │   └── auth.ts               # /auth/* endpoint clients
│   ├── components/
│   │   ├── ui/                   # shadcn-style primitives (Button, Card, Input)
│   │   ├── AuthShell.tsx         # Layout for unauthed pages (login, verify)
│   │   └── DashboardShell.tsx    # Layout for authed pages (header + Outlet)
│   ├── hooks/
│   │   └── useAuth.ts            # /me query hook + per-client branding side effect
│   ├── lib/
│   │   └── utils.ts              # cn() class helper + hexToRgbString()
│   ├── routes/                   # File-based routes (TanStack Router)
│   │   ├── __root.tsx
│   │   ├── index.tsx             # / → redirect to /dashboard or /login
│   │   ├── login.tsx             # /login (email form)
│   │   ├── auth.verify.tsx       # /auth/verify (token verification)
│   │   ├── dashboard.tsx         # /dashboard layout (auth guard + shell)
│   │   ├── dashboard.index.tsx   # /dashboard (client overview stub)
│   │   ├── dashboard.brands.$brandSlug.tsx
│   │   ├── dashboard.brands.$brandSlug.audiences.$audienceSlug.tsx
│   │   ├── dashboard.education.tsx
│   │   └── dashboard.utm.tsx
│   ├── routeTree.gen.ts          # GENERATED — do not edit
│   ├── index.css                 # Tailwind directives + CSS variables
│   ├── main.tsx                  # QueryClient + RouterProvider
│   └── vite-env.d.ts
├── index.html                    # Loads Museo Sans from Adobe Typekit
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── .env.local                    # VITE_API_BASE_URL (gitignored)
└── .env.example
```

## Theming

Two layers:

1. **Panwar Health brand colours** (`ph-purple`, `ph-pink`, `ph-coral`, `ph-sky`, `ph-charcoal`, `ph-grey`) — fixed across the app, used for chrome and unauthed pages.
2. **Per-client palette** (`client-primary`, `client-accent`) — read from CSS variables that the auth bootstrap (`useAuth`) sets at runtime based on `clientPrimaryColor` / `clientAccentColor` from `/api/auth/me`. Defaults to PH purple. The same React components paint themselves with whichever client's colours are loaded.

To use them in components:
```tsx
<button className="bg-client-primary text-white">Per-client</button>
<button className="bg-ph-purple text-white">Always PH purple</button>
```

Both work with Tailwind opacity modifiers (`bg-client-primary/20`) because the CSS variables are stored as RGB triples.

## Local development setup

```bash
# 1. Install
npm install

# 2. Configure (already done if you cloned this — env points to local API)
# .env.local:
#   VITE_API_BASE_URL=http://localhost:7071/api

# 3. Make sure panwar_api is running on :7071 in another shell
cd ../panwar_api && func start

# 4. Run the dev server
npm run dev
```

Open http://localhost:5173 — you'll be redirected to /login. Enter an email that exists as a client user in the DB and you'll get a magic link.

To create a test user, insert into `panwar_portals.app_user` with `Type=0` (Client) and a `ClientId` pointing at the seeded Reckitt row.

## Common commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Generate route tree, type-check, production build to dist/
npm run preview      # Serve dist/ locally to test the production build
npm run routes       # Regenerate src/routeTree.gen.ts only
npm run typecheck    # tsc --noEmit
npm run lint         # eslint with --max-warnings 0
npm run format       # prettier write
```

## Auth flow

1. User goes to `/` → root loader checks `/api/auth/me` → 401 → redirect to `/login`
2. User enters email on `/login` → `POST /api/auth/magic-link` → success screen
3. User clicks link in email → opens `/auth/verify?token=…`
4. SPA reads `token` from URL → `POST /api/auth/magic-link/verify`
5. API mints JWT, sets `panwar_session` HttpOnly cookie on `.panwarhealth.com.au` (or just `localhost` in dev)
6. SPA caches the user in TanStack Query under `['me']` and redirects to `/dashboard`
7. The dashboard shell's `beforeLoad` re-checks `/api/auth/me` for protection
8. `useAuth` reads the user, applies their brand colours via CSS variables side effect

**No tokens in JavaScript.** The cookie is HttpOnly, all `apiFetch` calls use `credentials: 'include'`.

## Convention notes

- **Strict TypeScript** — `tsc -b` must pass clean. No `any`, no `@ts-ignore` without a comment explaining why.
- **No raw `fetch`** in components — always go through `src/api/`.
- **No tokens in localStorage** — never. The cookie handles everything.
- **Path alias `@/`** is configured in both Vite and tsconfig — use `@/components/...` not relative paths.
- **Route IDs in `createFileRoute(...)` must NOT have trailing slashes** for non-index files. The `tsr generate` CLI will normalize them but build will fail if you forget.

## Related repos

- **`F:/Github/panwar_api`** — backend (provides `/api/auth/*`, dashboard data endpoints)
- **`F:/Github/panwar_employee_dash`** — employee portal (separate SPA, same API, same cookie domain)
- **`F:/Github/panwar_portals`** — project manager folder + brief

## Reference

- `F:/Github/panwar_portals/CLAUDE.md` — cross-repo standards
- `F:/Github/panwar_portals/PANWAR_PORTALS_PROJECT_BRIEF.md` — original brief (section 8 covers client portal features)
- Project memory at `C:/Users/User/.claude/projects/F--Github-panwar-portals/memory/` — running decisions
