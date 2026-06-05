import type { APIRoute } from "astro";
import {
  HANDBOOK_VIEW_PREFS_COOKIE,
  defaultViewPreferences,
  type HandbookViewPreferences,
} from "../../lib/handbook-view-preferences";
import { PAGE_STATUSES, type PageStatus } from "../../lib/page-status";
import { userIsAdmin } from "../../lib/roles";

export const prerender = false;

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function isPageStatus(value: unknown): value is PageStatus {
  return typeof value === "string" && (PAGE_STATUSES as string[]).includes(value);
}

function normalizePrefs(body: unknown): HandbookViewPreferences {
  if (!body || typeof body !== "object") return defaultViewPreferences();
  const o = body as Partial<HandbookViewPreferences>;
  const hiddenStatuses = Array.isArray(o.hiddenStatuses)
    ? o.hiddenStatuses.filter(isPageStatus)
    : [];
  return {
    hiddenStatuses: [...new Set(hiddenStatuses)],
    showStatusUi: o.showStatusUi !== false,
  };
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const roles = locals.session?.user?.roles ?? [];
  if (!userIsAdmin(roles)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const email = locals.session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const prefs = normalizePrefs(body);
  const payload = { email, hiddenStatuses: prefs.hiddenStatuses, showStatusUi: prefs.showStatusUi };

  cookies.set(HANDBOOK_VIEW_PREFS_COOKIE, JSON.stringify(payload), {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
    httpOnly: false,
    secure: import.meta.env.PROD,
  });

  return new Response(JSON.stringify({ ok: true, ...prefs }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
};
