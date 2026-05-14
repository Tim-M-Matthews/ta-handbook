import type { APIRoute } from "astro";
import type { KVNamespace } from "@cloudflare/workers-types";
import {
  assertBodySize,
  bookmarksStorageKey,
  normalizeBookmarks,
} from "../../lib/handbook-bookmarks";

export const prerender = false;

type LocalsWithRuntime = {
  session: App.Locals["session"];
  runtime?: { env?: Record<string, unknown> };
};

function getBookmarksKv(locals: App.Locals): KVNamespace | undefined {
  const env = (locals as LocalsWithRuntime).runtime?.env;
  const raw = env?.BOOKMARKS_KV;
  if (!raw || typeof (raw as KVNamespace).get !== "function") return undefined;
  return raw as KVNamespace;
}

function userEmail(locals: App.Locals): string | null {
  const e = locals.session?.user?.email?.trim().toLowerCase();
  return e || null;
}

export const GET: APIRoute = async ({ locals }) => {
  const email = userEmail(locals);
  if (!email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }

  if (import.meta.env.DEV) {
    return new Response(JSON.stringify([] satisfies unknown[]), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }

  const kv = getBookmarksKv(locals);
  if (!kv) {
    return new Response(JSON.stringify([] satisfies unknown[]), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }

  const key = bookmarksStorageKey(email);
  const raw = await kv.get(key, "text");
  let parsed: unknown = [];
  if (raw) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = [];
    }
  }
  const list = normalizeBookmarks(parsed);
  return new Response(JSON.stringify(list), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" },
  });
};

export const PUT: APIRoute = async ({ locals, request }) => {
  const email = userEmail(locals);
  if (!email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (import.meta.env.DEV) {
    return new Response(JSON.stringify({ ok: true, dev: true }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const kv = getBookmarksKv(locals);
  if (!kv) {
    return new Response(JSON.stringify({ error: "bookmarks_kv_unconfigured" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const text = await request.text();
  try {
    assertBodySize(text);
  } catch {
    return new Response(JSON.stringify({ error: "payload_too_large" }), {
      status: 413,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const list = normalizeBookmarks(body);
  const key = bookmarksStorageKey(email);
  await kv.put(key, JSON.stringify(list));

  return new Response(JSON.stringify(list), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" },
  });
};
