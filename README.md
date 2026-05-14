# Triangle ACT Handbook (Astro)

Internal handbook: **Markdown under `content/pages/`** (including per-folder **`_category-meta.md`** for category and subcategory settings—those files are not published as pages) (GitHub + optional **[GitCMS](https://gitcms.dev/)**), **Google sign-in** (Auth.js via `auth-astro`), **role-based access** ([`src/lib/handbook-role-map.ts`](src/lib/handbook-role-map.ts)), and **search** (substring / word match on titles and excerpts). No database—content lives in the repo; deploys build from Git.

## Requirements

- Node 18.18+

## Setup

1. Copy `.env.example` to `.env` and set the variables described in **[Google OAuth and environment variables](#google-oauth-and-environment-variables)** (at minimum **`AUTH_SECRET`**, **`AUTH_URL`**, **`AUTH_GOOGLE_ID`**, and **`AUTH_GOOGLE_SECRET`** for any environment where Google sign-in should work). **Who may sign in and their roles** live in **[`src/lib/handbook-role-map.ts`](src/lib/handbook-role-map.ts)** (edit that file and redeploy—no env var).

2. Install and run:

```bash
rm -rf node_modules
npm install
npm run dev
```

If you previously used another framework in this folder, delete `node_modules` (and optionally `package-lock.json`) before `npm install` so dependencies match Astro only.

Open [http://localhost:4321](http://localhost:4321). During **`astro dev`**, you are **signed in automatically** as **`tim.matthews@triangleact.com`** (no Google OAuth). Roles come from **[`src/lib/handbook-role-map.ts`](src/lib/handbook-role-map.ts)**—add that email there to mirror prod access; if the email is missing, local dev grants **`admin`** and logs a warning. Override the email with **`DEV_AUTH_EMAIL`** in `.env`. Google OAuth runs only when the app is **not** in dev mode and **`DISABLE_AUTH`** is not set. There is **no Google Search Console HTML verification** in this project.

To test a **production build or Cloudflare preview** without configuring Google OAuth, set **`DISABLE_AUTH=true`** in that environment (see `.env.example`). You get a synthetic admin and all pages. **Remove `DISABLE_AUTH` for real production** if the site must require Google sign-in.

## Google OAuth and environment variables

OAuth credentials for this handbook are created and managed in **Google Cloud Console** under the Google account **`triangle.act.accts@gmail.com`**. If you need a new OAuth client, new redirect URIs, or access to the project, use that account (or ask whoever administers it).

### Values that come from Google

In [Google Cloud Console](https://console.cloud.google.com/) → select the handbook project → **APIs & Services** → **Credentials** → open the **OAuth 2.0 Client ID** (type **Web application**).

| Environment variable | Where it appears in Google |
| ---------------------- | --------------------------- |
| **`AUTH_GOOGLE_ID`** | **Client ID** |
| **`AUTH_GOOGLE_SECRET`** | **Client secret** (copy when created or after reset; Google does not show the previous secret again after you rotate it) |

### Values you set yourself (not from Google)

| Environment variable | What it is |
| ---------------------- | ----------- |
| **`AUTH_SECRET`** | A long random string used by Auth.js to sign sessions (e.g. `openssl rand -base64 32`). Not from Google. |
| **`AUTH_URL`** | The public base URL of the site for that environment, with scheme and no trailing path—e.g. `https://your-handbook.example.com` in production, or `http://localhost:4321` if you ever test OAuth locally without dev bypass. |
| **`DISABLE_AUTH`** | Optional. Set to `true` only for previews/smoke tests to skip Google entirely; omit or `false` for real production if the site must stay private. |

**Who may sign in:** edit **[`src/lib/handbook-role-map.ts`](src/lib/handbook-role-map.ts)** in the repo (lowercase email keys → role string or array). Commit and redeploy; no `HANDBOOK_ROLE_MAP` environment variable. If you previously set **`HANDBOOK_ROLE_MAP`** in Cloudflare (or `.env`), remove it—it is no longer read.

### What you configure inside Google (not pasted as env vars)

On the same OAuth client:

- **Authorized redirect URIs:** add exactly  
  **`{AUTH_URL}/api/auth/callback/google`**  
  Example: if `AUTH_URL` is `https://handbook.example.com`, add  
  `https://handbook.example.com/api/auth/callback/google`.
- **Authorized JavaScript origins** (if the client asks for them): the origin only, e.g. `https://handbook.example.com` (no path).

### Where to paste secrets

| Where | Use case |
| ----- | -------- |
| **`.env`** in the repo root | Local machine; do **not** commit real values. |
| **Cloudflare** (Worker / project → **Settings** → **Variables and Secrets** / **Environment variables**) | Production and preview deployments. |

### After Google sign-in (how access works)

The app reads the Google profile **email**, looks up **`handbook-role-map.ts`**, and attaches **roles** to the session. If the email is missing from that map, the user is sent back to `/login` with an error—so the map must include everyone who should access the handbook.

## Content (GitHub)

Editors add or change **Markdown under `content/pages/`** in this repository (nested folders are fine, e.g. `content/pages/welcome/welcome-to-triangle-act.md` → slug `welcome/welcome-to-triangle-act`). Merge to the branch your host builds from (e.g. `main`) to publish.

**Categories:** the **first folder** under `content/pages/` is the category id (e.g. `employment/employment-basics/roles-responsibilities.md` → category `employment`, subcategory `employment-basics`). Section title, sort order, optional **`roles`** for the whole category, and optional **`description`** live in **`content/pages/{category}/_category-meta.md`** (YAML frontmatter; body is optional notes for editors). Subcategory title/description use **`content/pages/{category}/{subcategory}/_category-meta.md`**. Files named **`_category-meta.md`** are never built as handbook pages. GitCMS can use a single **Pages** collection on `content/pages` (see `.gitcms/`).

**Sitemap:** **`GET /sitemap.xml`** (`src/pages/sitemap.xml.ts`) returns a URL list with `/`, `/search`, category and subcategory index URLs, and each **`/p/{slug}`** from real pages only (paths ending in **`_category-meta.md`** are excluded). For stable production `<loc>` URLs, set **`PUBLIC_SITE_URL`** (see `.env.example`); it also sets Astro’s **`site`** in `astro.config.mjs`. If unset, the sitemap uses the request origin (e.g. local dev).

### GitCMS (optional UI)

**[GitCMS](https://gitcms.dev/)** is a visual, Git-based CMS that reads and writes Markdown in this repo. Configuration is stored under **`.gitcms/`** after you connect the repo—it is **generated and updated from the GitCMS Settings UI** (or [CLI onboarding](https://gitcms.dev/docs/getting-started/cli-onboarding)); [do not hand-edit those files](https://gitcms.dev/docs/getting-started/configuration) or they may be overwritten.

1. Sign in at **[gitcms.dev](https://gitcms.dev/)** with GitHub.
2. **Connect repository** and install the **GitCMS GitHub App** for this repo (read/write on repo contents only).
3. In **Settings**, configure at least:
   - **Framework:** Astro (often auto-detected).
   - **Collections:** **Pages** — **`content/pages`**, **`.md`**, grouped by folder. Page markdown: YAML frontmatter such as `title`, `order`, optional `roles`, body. Category section settings: **`_category-meta.md`** at `content/pages/{category}/_category-meta.md`. Subcategory settings: **`content/pages/{category}/{subcategory}/_category-meta.md`**. Placement is by folder path; frontmatter **`category`** on a page is not used for placement (legacy `resolveCategoryId` may still read it when resolving ids).
   - **Media path:** e.g. **`public/handbook-media`** so uploads match Astro’s `public/` URLs (**`/handbook-media/...`**).
4. **Commit** the **`.gitcms/`** folder when GitCMS adds it so teammates and CI see the same config.

**Publishing:** GitCMS defaults to an editorial workflow; you can switch to **direct publish** so saves land on your default branch like before—see [Publishing modes](https://gitcms.dev/docs/getting-started/configuration#publishing-modes). **Licensing:** preview vs paid saves is described in [Licensing & preview](https://gitcms.dev/docs/getting-started/licensing).

**Local dev:** GitCMS does not run inside `npm run dev`. After changes are on GitHub, **`git pull`** and refresh; restart the dev server if a new file does not show up.

See **[Quick start](https://gitcms.dev/docs/getting-started/quick-start)** and **[Configuration](https://gitcms.dev/docs/getting-started/configuration)** for full detail.

Frontmatter and roles behave the same as when editing files in GitHub.

**Frontmatter** (optional fields at the top of each file):

| Field        | Purpose |
| ------------ | ------- |
| `title`      | Page title (defaults to filename if omitted) |
| `category`   | Legacy / optional — placement uses the **folder path** under `content/pages/`. If present, may help **`resolveCategoryId`** match an id or title. Prefer relying on folder layout and **`_category-meta.md`** for section metadata. |
| `roles`      | Optional extra gate for this page only (string or array); omit or empty = any user who already passes the **category** roles. `admin` always sees everything. |
| `order`      | Sort order within the category (number) |

The **page body** (below the `---` frontmatter) may be **Markdown** (GitHub / plain edits) or **HTML** (some visual CMS saves); the site supports both.

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
- [GitCMS](https://gitcms.dev/) (optional content UI; config in `.gitcms/` from their Settings)
- [marked](https://marked.js.org/) (GFM) for article HTML
