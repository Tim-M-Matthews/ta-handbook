# Triangle ACT Handbook (Astro)

Internal handbook: **Markdown in `content/pages/`** (managed in **GitHub**), **Google sign-in** (Auth.js via `auth-astro`), **role-based access** (`HANDBOOK_ROLE_MAP`), and **server-side search** (Fuse.js). No database and no separate CMS—editors use the GitHub web UI or Desktop; deploys (e.g. **Cloudflare Pages**) build from the repo.

## Requirements

- Node 18.18+

## Setup

1. Copy `.env.example` to `.env`. You must set **`AUTH_SECRET`** (Auth.js will show a generic “server configuration” error in the browser until this is set). Also set:

   - `AUTH_URL` — e.g. `http://localhost:4321` for local dev
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client  
     Authorized redirect URI: `{AUTH_URL}/api/auth/callback/google`
   - `HANDBOOK_ROLE_MAP` — JSON map of lowercase email → role string or array (see `.env.example`)

2. Install and run:

```bash
rm -rf node_modules
npm install
npm run dev
```

If you previously used another framework in this folder, delete `node_modules` (and optionally `package-lock.json`) before `npm install` so dependencies match Astro only.

Open [http://localhost:4321](http://localhost:4321). During **`astro dev`**, Google sign-in is **skipped** automatically (see `src/lib/dev-auth.ts`). There is **no Google Search Console HTML verification** in this project—only optional **Google OAuth** for sign-in when auth is enabled.

To test a **production build or Cloudflare Pages preview** without configuring Google OAuth, set **`DISABLE_AUTH=true`** in that environment (see `.env.example`). The handbook behaves like dev: no login, synthetic admin, all pages visible. **Remove `DISABLE_AUTH` for real production** if the site must require Google sign-in.

## Content (GitHub)

Editors add or change **Markdown under `content/pages/`** in this repository (nested folders are fine, e.g. `content/pages/clinical/guide.md` → slug `clinical/guide`). Use the **GitHub** “Edit” flow or **GitHub Desktop**; merge to the branch your host builds from (e.g. `main`) to publish.

**Frontmatter** (optional fields at the top of each file):

| Field        | Purpose |
| ------------ | ------- |
| `title`      | Page title (defaults to filename if omitted) |
| `category`   | Section label on the handbook home |
| `roles`      | Who can see the page when signed in (string or array); omit or empty = any mapped user. `admin` in `HANDBOOK_ROLE_MAP` sees everything. |
| `order`      | Sort order within a category (number) |

**Deploy / automatic updates:** **Cloudflare Pages → Connect to Git** → production branch (e.g. `main`). Every **push** runs **`npm run build`**. If your Pages setup **requires a deploy command**, use **`npm run deploy`** (runs **`wrangler pages deploy`**, which uploads `dist` including Astro’s `dist/_worker.js`). Do **not** use `wrangler deploy`—that targets a standalone Worker and fails without a Worker `main` entry. **`wrangler.jsonc`** must use **`name`** equal to your **Pages project name** in the dashboard (change `handbook` if yours differs), and **`pages_build_output_dir`** `./dist` must match Astro’s output. To sync bindings from Cloudflare, run **`npx wrangler pages download config`** locally (see [Wrangler configuration for Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)). Build output directory in the UI can stay **`dist`**, **Node** 20.x. Set production env vars (see `.env.example`). For a smoke test without Google, use **`DISABLE_AUTH=true`** on a preview branch only.

## Scripts

| Command          | Description        |
| ---------------- | ------------------ |
| `npm run dev`    | Dev server         |
| `npm run build`  | Production build   |
| `npm run preview`| Preview production |
| `npm run deploy` | Upload `dist` to Cloudflare Pages via Wrangler (when deploy step is required) |

## Stack

- [Astro](https://astro.build/) (SSR, [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) for production and local `astro build`)
- [auth-astro](https://github.com/nowaythatworked/auth-astro) + [Auth.js](https://authjs.dev/) (Google)
- [marked](https://marked.js.org/) (GFM) for article HTML
- [Fuse.js](https://fusejs.io/) for search
