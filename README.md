# Triangle ACT Handbook

Lightweight internal handbook: Google sign-in, env-based roles, markdown content in git, category index, and role-aware search.

## Own repository

This folder lives under the `triangle-act` workspace for convenience. For production, move it to a separate git repository (or use `git subtree split`) and deploy only this app to **handbook.triangleact.com**.

## Requirements

- Node.js 18.18+ (20 LTS recommended)

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 Client ID (Web application).

   - **Authorized JavaScript origins**: `https://handbook.triangleact.com`, `http://localhost:3000`
   - **Authorized redirect URIs**: `https://handbook.triangleact.com/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google`

3. Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` in `.env.local`. Set `AUTH_URL` to the site origin (required in production).

4. Set `HANDBOOK_ROLE_MAP` to a JSON object mapping each allowed Google email to one or more roles, for example:

   ```json
   {"lorraine@triangleact.com":["clinical","admin"],"tim@triangleact.com":["admin"]}
   ```

   Emails not listed **cannot** sign in.

5. Run locally:

   ```bash
   npm install
   npm run dev
   ```

## Content

- Markdown lives in `content/pages/`. Use subfolders for URL structure (`content/pages/hr/onboarding.md` → `/p/hr/onboarding`).
- Frontmatter:
  - `title` — display title (defaults to filename).
  - `category` — grouping on the home page (defaults to `General`).
  - `roles` — optional string or list; if set, the user must have at least one of these roles **or** have the `admin` role. Omit or leave empty for “any signed-in user.”
  - `order` — optional number for sorting within a category.

## Roles

- **`admin`**: can open every page regardless of `roles` in frontmatter.
- Other role names are up to you (`clinical`, `staff`, `operations`, …) and must match values in `HANDBOOK_ROLE_MAP` and in markdown `roles` lists.

## Deploy (example: Vercel)

1. Create a new Vercel project from this directory’s repo.
2. Add environment variables in the Vercel dashboard (same keys as `.env.example`).
3. Attach custom domain **handbook.triangleact.com** and update Google OAuth origins/redirects to match.

## Search

Search uses [Fuse.js](https://fusejs.io/) over titles, categories, and excerpts of **only** pages the current user may read, so hidden titles do not appear in results.
