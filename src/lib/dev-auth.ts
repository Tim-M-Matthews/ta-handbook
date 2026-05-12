import type { Session } from "@auth/core/types";

function isTruthyEnv(value: string | undefined): boolean {
  if (value == null || value === "") return false;
  const t = String(value).trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes";
}

/**
 * When true, handbook skips Google sign-in and uses a synthetic admin session
 * (all pages visible). Triggered by:
 * - `astro dev` (`import.meta.env.DEV`), and/or
 * - `DISABLE_AUTH=true` in the environment (e.g. Cloudflare Pages preview for deploy tests).
 *
 * There is no Google Search Console / HTML “site verification” in this app—only OAuth.
 * OAuth is unused while this bypass is active (no `/login`, no `getSession` in middleware).
 */
export function isAuthBypassed(): boolean {
  if (import.meta.env.DEV) return true;
  const fromMeta = import.meta.env.DISABLE_AUTH;
  const fromProcess =
    typeof process !== "undefined" ? process.env.DISABLE_AUTH : undefined;
  return isTruthyEnv(fromMeta) || isTruthyEnv(fromProcess);
}

/** Synthetic session when auth is bypassed. */
export function devBypassSession(): Session {
  return {
    user: {
      name: "Auth bypass",
      email: "bypass@local",
      image: null,
      roles: ["admin"],
    },
    expires: new Date(Date.now() + 7 * 864e5).toISOString(),
  };
}

/** Short label for the header when bypass is on. */
export function authBypassLabel(): string {
  if (import.meta.env.DEV) return "Local dev (auth off)";
  return "Auth off (DISABLE_AUTH)";
}
