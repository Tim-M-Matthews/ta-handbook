/** Client ↔ API payload for saved handbook article and category links. */
export type HandbookBookmark = {
  slug: string;
  title: string;
  savedAt: number;
  /** Canonical path for the list link when not a `/p/{slug}` article. */
  href?: string;
};

const MAX_BOOKMARKS = 200;
const MAX_BODY_BYTES = 24_000;

export function normalizeBookmarks(raw: unknown): HandbookBookmark[] {
  if (!Array.isArray(raw)) return [];
  const out: HandbookBookmark[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (out.length >= MAX_BOOKMARKS) break;
    if (!row || typeof row !== "object") continue;
    const slug = typeof (row as HandbookBookmark).slug === "string" ? (row as HandbookBookmark).slug.trim() : "";
    if (!slug || !isSafeSlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    const title =
      typeof (row as HandbookBookmark).title === "string"
        ? (row as HandbookBookmark).title.trim().slice(0, 500)
        : slug;
    const savedAt =
      typeof (row as HandbookBookmark).savedAt === "number" && Number.isFinite((row as HandbookBookmark).savedAt)
        ? (row as HandbookBookmark).savedAt
        : Date.now();
    const hrefRaw = (row as HandbookBookmark).href;
    const href =
      typeof hrefRaw === "string" && isSafeBookmarkHref(hrefRaw.trim()) ? hrefRaw.trim() : undefined;
    out.push(href ? { slug, title, savedAt, href } : { slug, title, savedAt });
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

/** Reject path traversal and odd characters; allow nested slugs like welcome/page. */
export function isSafeSlug(slug: string): boolean {
  if (slug.length > 240 || slug.includes("..")) return false;
  return /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(slug);
}

/** Internal handbook paths only; used when bookmark target is not `/p/{slug}`. */
export function isSafeBookmarkHref(href: string): boolean {
  if (href.length > 280 || href.includes("..")) return false;
  const article = /^\/p\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i;
  const category = /^\/c\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/i;
  return article.test(href) || category.test(href);
}

export function bookmarksStorageKey(email: string): string {
  const safe = email.toLowerCase().replace(/[^a-z0-9@._-]+/g, "_").slice(0, 120);
  return `hb:bm:${safe}`;
}

export function byteLengthUtf8(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function assertBodySize(body: string): void {
  if (byteLengthUtf8(body) > MAX_BODY_BYTES) {
    throw new Error("payload_too_large");
  }
}
