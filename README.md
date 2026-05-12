# Triangle ACT Handbook (Astro)

Internal handbook: **Markdown in `content/pages/`** (GitHub + optional **[Pages CMS](https://pagescms.org/)** UI), **Google sign-in** (Auth.js via `auth-astro`), **role-based access** (`HANDBOOK_ROLE_MAP`), and **server-side search** (Fuse.js). No database—content lives in the repo; deploys build from Git.

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

Open [http://localhost:4321](http://localhost:4321). During **`astro dev`**, you are **signed in automatically** as **`tim.matthews@triangleact.com`** (no Google OAuth). Roles come from **`HANDBOOK_ROLE_MAP`** in `.env`, same as production—add that email to the map to mirror prod access; if the email is missing, local dev grants **`admin`** and logs a warning. Override the email with **`DEV_AUTH_EMAIL`**. Google OAuth is still used whenever the app runs **without** dev mode and **without** `DISABLE_AUTH` (set `AUTH_GOOGLE_*` and use redirect `{AUTH_URL}/api/auth/callback/google` in Google Cloud Console). There is **no Google Search Console HTML verification** in this project.

To test a **production build or Cloudflare preview** without configuring Google OAuth, set **`DISABLE_AUTH=true`** in that environment (see `.env.example`). You get a synthetic admin and all pages. **Remove `DISABLE_AUTH` for real production** if the site must require Google sign-in.

## Content (GitHub)

Editors add or change **Markdown under `content/pages/`** in this repository (nested folders are fine, e.g. `content/pages/clinical/guide.md` → slug `clinical/guide`). Merge to the branch your host builds from (e.g. `main`) to publish.

### Pages CMS (optional UI)

This repo includes **[`.pages.yml`](.pages.yml)** for **[Pages CMS](https://pagescms.org/)** — a free, open-source editor that commits directly to GitHub (see [introduction](https://pagescms.org/docs/) and [configuration](https://pagescms.org/docs/configuration)).

1. Open **[app.pagescms.org](https://app.pagescms.org/)** and sign in with GitHub.
2. Install the **Pages CMS GitHub App** for the account or org that owns this repository.
3. Open this repo and branch; Pages CMS reads **`.pages.yml`** automatically.
4. Use **Handbook pages** to edit frontmatter and page content (**rich text** in Pages CMS, stored as HTML; GitHub-only edits can stay Markdown). Use **Media** for uploads (stored under **`public/handbook-media/`**, referenced as **`/handbook-media/...`**).

Frontmatter and roles behave the same as when editing files in GitHub.

**Frontmatter** (optional fields at the top of each file):

| Field        | Purpose |
| ------------ | ------- |
| `title`      | Page title (defaults to filename if omitted) |
| `category`   | Section label on the handbook home |
| `roles`      | Who can see the page when signed in (string or array); omit or empty = any mapped user. `admin` in `HANDBOOK_ROLE_MAP` sees everything. |
| `order`      | Sort order within a category (number) |

The **page body** (below the `---` frontmatter) may be **Markdown** (legacy / GitHub edits) or **HTML** (saved from Pages CMS rich text); the site supports both.

**Deploy / automatic updates:** Astro’s current [Cloudflare deploy guide](https://docs.astro.build/en/guides/deploy/cloudflare/) targets **Cloudflare Workers** (static assets + SSR Worker), not the Pages-only upload path. This repo uses **`npm run build`** then **`npm run deploy`** (`wrangler deploy`) with **`wrangler.jsonc`** (`name` **`ta-handbook`**, **`main`**: built handler, **`assets.directory`**: `./dist`). **`public/.assetsignore`** lists **`_worker.js`** so Wrangler does not treat the server bundle as a public static file (see [withastro/astro#13582](https://github.com/withastro/astro/issues/13582)). **`nodejs_compat`** is enabled for server-side dependencies.

In Cloudflare, use **Workers Builds** (or equivalent): **Build command** `npm run build`, **Deploy command** `npm run deploy`. Set **`CLOUDFLARE_API_TOKEN`** (and **`CLOUDFLARE_ACCOUNT_ID`** if needed) to a token with **Workers Scripts: Edit** (and **KV: Edit** if you rely on Astro’s default **SESSION** KV). Env vars for Auth still go in the Worker / build settings as before. If you still have an old **Pages**–only project, migrate or create a Worker app per Cloudflare’s [Pages → Workers migration](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) so the dashboard matches **`wrangler deploy`**.

## Scripts

| Command          | Description        |
| ---------------- | ------------------ |
| `npm run dev`    | Dev server         |
| `npm run build`  | Production build   |
| `npm run preview`| Preview production |
| `npm run deploy` | Deploy Worker + static assets (`wrangler deploy` after `astro build`) |

## Stack

- [Astro](https://astro.build/) (SSR, [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) for production and local `astro build`)
- [auth-astro](https://github.com/nowaythatworked/auth-astro) + [Auth.js](https://authjs.dev/) (Google)
- [marked](https://marked.js.org/) (GFM) for article HTML
- [Fuse.js](https://fusejs.io/) for search
