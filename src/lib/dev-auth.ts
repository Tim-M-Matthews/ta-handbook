import type { Session } from "@auth/core/types";
import { rolesForEmail } from "./roles";

function isTruthyEnv(value: string | undefined): boolean {
  if (value == null || value === "") return false;
  const t = String(value).trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes";
}

/** Default signed-in user during `astro dev` (override with `DEV_AUTH_EMAIL` in `.env`). */
const DEFAULT_LOCAL_DEV_EMAIL = "tim.matthews@triangleact.com";

/**
 * When true, Google OAuth is not used: middleware injects a synthetic session instead of
 * calling `getSession`. Triggered by:
 * - `astro dev` → local persona (see `localDevPersonaSession`)
 * - `DISABLE_AUTH=true` in production/preview → synthetic admin (see `disableAuthBypassSession`)
 */
export function isAuthBypassed(): boolean {
  if (import.meta.env.DEV) return true;
  const fromMeta = import.meta.env.DISABLE_AUTH;
  const fromProcess =
    typeof process !== "undefined" ? process.env.DISABLE_AUTH : undefined;
  return isTruthyEnv(fromMeta) || isTruthyEnv(fromProcess);
}

/** True only during `astro dev` (for UI copy that differs from DISABLE_AUTH preview). */
export function isLocalDevPersona(): boolean {
  return import.meta.env.DEV;
}

function localDevEmail(): string {
  const fromProcess =
    typeof process !== "undefined" && process.env.DEV_AUTH_EMAIL
      ? process.env.DEV_AUTH_EMAIL.trim()
      : "";
  const fromMeta =
    typeof import.meta.env.DEV_AUTH_EMAIL === "string"
      ? import.meta.env.DEV_AUTH_EMAIL.trim()
      : "";
  const raw = fromProcess || fromMeta || DEFAULT_LOCAL_DEV_EMAIL;
  return raw.toLowerCase();
}

/**
 * Session used in `astro dev`: fixed workspace email, roles from `HANDBOOK_ROLE_MAP`
 * (same rules as production Google sign-in). If the email is missing from the map, grants
 * `admin` for usability and logs a warning.
 */
export function localDevPersonaSession(): Session {
  const email = localDevEmail();
  let roles = rolesForEmail(email);
  if (roles.length === 0) {
    console.warn(
      `[dev-auth] HANDBOOK_ROLE_MAP has no entry for ${email}. Using role "admin" for local dev. Add this email to .env to mirror production access.`,
    );
    roles = ["admin"];
  }
  const localPart = email.split("@")[0] ?? "Local dev";
  const display =
    localPart.length > 0
      ? localPart[0].toUpperCase() + localPart.slice(1)
      : "Local dev";
  return {
    user: {
      name: display,
      email,
      image: null,
      roles,
    },
    expires: new Date(Date.now() + 7 * 864e5).toISOString(),
  };
}

/** Synthetic admin session when `DISABLE_AUTH` is set outside of dev (e.g. preview deploys). */
export function disableAuthBypassSession(): Session {
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

export function devAuthSessionForBypass(): Session {
  if (import.meta.env.DEV) return localDevPersonaSession();
  return disableAuthBypassSession();
}

/** @deprecated Use `disableAuthBypassSession` or `devAuthSessionForBypass`. */
export const devBypassSession = disableAuthBypassSession;

/** Short label for tooltips when auth is bypassed. */
export function authBypassLabel(): string {
  if (import.meta.env.DEV) return "Local dev (Google OAuth not used)";
  return "Auth off (DISABLE_AUTH)";
}
