# Triangle ACT Handbook (Astro)

Internal handbook: **Markdown in `content/pages/`** (GitHub + optional **[Pages CMS](https://pagescms.org/)** UI), **Google sign-in** (Auth.js via `auth-astro`), **role-based access** ([`src/lib/handbook-role-map.ts`](src/lib/handbook-role-map.ts)), and **server-side search** (Fuse.js). No database—content lives in the repo; deploys build from Git.

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

Editors add or change **Markdown under `content/pages/`** in this repository (nested folders are fine, e.g. `content/pages/clinical/guide.md` → slug `clinical/guide`). Merge to the branch your host builds from (e.g. `main`) to publish.

### Pages CMS (optional UI)

This repo includes **[`.pages.yml`](.pages.yml)** for **[Pages CMS](https://pagescms.org/)** — a free, open-source editor that commits directly to GitHub (see [introduction](https://pagescms.org/docs/) and [configuration](https://pagescms.org/docs/configuration)).

1. Open **[app.pagescms.org](https://app.pagescms.org/)** and sign in with GitHub.
2. Install the **Pages CMS GitHub App** for the account or org that owns this repository.
3. Open this repo and branch; Pages CMS reads **`.pages.yml`** automatically.
4. Use **Handbook pages** to edit frontmatter and page content (**rich text** in Pages CMS, stored as HTML; GitHub-only edits can stay Markdown). Use **Media** for uploads (stored under **`public/handbook-media/`**, referenced as **`/handbook-media/...`**).

**Local dev:** Pages CMS does not run inside `npm run dev`. After you save in the CMS (commits to GitHub), run **`git pull`** on your machine and refresh the browser; the handbook reads `content/pages/` from disk. Restart the dev server if a brand-new file does not appear.

Frontmatter and roles behave the same as when editing files in GitHub.

**Frontmatter** (optional fields at the top of each file):

| Field        | Purpose |
| ------------ | ------- |
| `title`      | Page title (defaults to filename if omitted) |
| `category`   | Section label on the handbook home |
| `roles`      | Who can see the page when signed in (string or array); omit or empty = any mapped user. Users with the `admin` role in `handbook-role-map.ts` see everything. |
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
