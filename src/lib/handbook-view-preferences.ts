import type { AstroCookies } from "astro";
import { PAGE_STATUSES, type PageStatus } from "./page-status";

export const HANDBOOK_VIEW_PREFS_COOKIE = "handbook_view_prefs";

export type HandbookViewPreferences = {
  hiddenStatuses: PageStatus[];
  /** Homepage status filter and colored dots on page titles (admins only). */
  showStatusUi: boolean;
};

type StoredViewPrefs = {
  email: string;
  hiddenStatuses: PageStatus[];
  showStatusUi?: boolean;
};

function isPageStatus(value: unknown): value is PageStatus {
  return typeof value === "string" && (PAGE_STATUSES as string[]).includes(value);
}

export function defaultViewPreferences(): HandbookViewPreferences {
  return { hiddenStatuses: [], showStatusUi: true };
}

function normalizePrefs(parsed: Partial<HandbookViewPreferences>): HandbookViewPreferences {
  const hidden = Array.isArray(parsed.hiddenStatuses)
    ? parsed.hiddenStatuses.filter(isPageStatus)
    : [];
  return {
    hiddenStatuses: [...new Set(hidden)],
    showStatusUi: parsed.showStatusUi !== false,
  };
}

function parseStoredPrefsPayload(raw: string): StoredViewPrefs | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const attempts = [trimmed, decodeURIComponent(trimmed)];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as StoredViewPrefs;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function parseViewPreferencesCookie(
  raw: string | undefined,
  sessionEmail: string | undefined,
): HandbookViewPreferences {
  if (!raw?.trim() || !sessionEmail?.trim()) return defaultViewPreferences();
  const parsed = parseStoredPrefsPayload(raw);
  if (!parsed) return defaultViewPreferences();
  if (parsed.email?.toLowerCase() !== sessionEmail.trim().toLowerCase()) {
    return defaultViewPreferences();
  }
  return normalizePrefs({
    hiddenStatuses: parsed.hiddenStatuses,
    showStatusUi: parsed.showStatusUi,
  });
}

export function viewPreferencesForUser(
  cookies: AstroCookies,
  sessionEmail: string | undefined,
): HandbookViewPreferences {
  const raw = cookies.get(HANDBOOK_VIEW_PREFS_COOKIE)?.value;
  return parseViewPreferencesCookie(raw, sessionEmail);
}

export function hiddenStatusesForUser(
  cookies: AstroCookies,
  sessionEmail: string | undefined,
): PageStatus[] {
  return viewPreferencesForUser(cookies, sessionEmail).hiddenStatuses;
}

export function readViewPreferencesFromDocumentCookie(
  sessionEmail: string | undefined,
): HandbookViewPreferences {
  if (typeof document === "undefined" || !sessionEmail) return defaultViewPreferences();
  const prefix = `${HANDBOOK_VIEW_PREFS_COOKIE}=`;
  const part = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  if (!part) return defaultViewPreferences();
  return parseViewPreferencesCookie(part.slice(prefix.length), sessionEmail);
}

export function localStorageKeyForViewPrefs(email: string): string {
  return `triangle-act-handbook:view-prefs:${email.trim().toLowerCase()}`;
}
