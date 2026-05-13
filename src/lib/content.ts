import matter from "gray-matter";
import { categoryDefForId, resolveCategoryId } from "./categories";
import { plainTextFromBody } from "./body-render";
import { userCanViewPage } from "./roles";

export type HandbookMeta = {
  slug: string;
  title: string;
  /** Matches `content/categories/{id}.md` (and page frontmatter `category`). */
  categoryId: string;
  /** Display name from the category file’s `title`. */
  categoryLabel: string;
  /** Page-level roles; empty = any viewer who passes the category gate may read. */
  roles: string[];
  order: number;
};

export type HandbookDoc = HandbookMeta & {
  body: string;
};

/** Bundled at build time so SSR works on Cloudflare Workers (no runtime filesystem). */
const rawModules = import.meta.glob<string>("../../content/pages/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function slugFromGlobKey(key: string): string | null {
  const m = key.match(/content\/pages\/(.+)\.md$/);
  return m ? m[1] : null;
}

function metaFromMatter(
  slug: string,
  data: Record<string, unknown>,
): Omit<HandbookMeta, "slug"> {
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : slug.split("/").pop() ?? slug;
  const categoryId = resolveCategoryId(data.category);
  const categoryLabel = categoryDefForId(categoryId).title;
  let roles: string[] = [];
  if (Array.isArray(data.roles)) {
    roles = data.roles.map(String);
  } else if (typeof data.roles === "string" && data.roles.trim()) {
    roles = [data.roles.trim()];
  }
  const order = typeof data.order === "number" ? data.order : 0;
  return { title, categoryId, categoryLabel, roles, order };
}

const docsBySlug = new Map<string, HandbookDoc>();

for (const [key, raw] of Object.entries(rawModules)) {
  const slug = slugFromGlobKey(key.replaceAll("\\", "/"));
  if (!slug || slug.includes("..")) continue;
  const { content, data } = matter(raw);
  const m = metaFromMatter(slug, data as Record<string, unknown>);
  docsBySlug.set(slug, { slug, ...m, body: content.trim() });
}

export function getAllSlugs(): string[] {
  return [...docsBySlug.keys()].sort();
}

export function getDocBySlug(slug: string): HandbookDoc | null {
  if (!slug || slug.includes("..") || slug.startsWith("/")) return null;
  return docsBySlug.get(slug) ?? null;
}

export function listMetaForRoles(userRoles: string[]): HandbookMeta[] {
  const metas: HandbookMeta[] = [];
  for (const doc of docsBySlug.values()) {
    const cat = categoryDefForId(doc.categoryId);
    if (!userCanViewPage(userRoles, cat.roles)) continue;
    if (!userCanViewPage(userRoles, doc.roles)) continue;
    metas.push({
      slug: doc.slug,
      title: doc.title,
      categoryId: doc.categoryId,
      categoryLabel: doc.categoryLabel,
      roles: doc.roles,
      order: doc.order,
    });
  }
  metas.sort((a, b) => {
    const ca = categoryDefForId(a.categoryId);
    const cb = categoryDefForId(b.categoryId);
    if (ca.order !== cb.order) return ca.order - cb.order;
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
  return metas;
}

export function excerptFromBody(body: string, max = 220): string {
  const flat = plainTextFromBody(body).replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export type SearchRow = HandbookMeta & { excerpt: string };

export function searchRowsForRoles(userRoles: string[]): SearchRow[] {
  const rows: SearchRow[] = [];
  for (const meta of listMetaForRoles(userRoles)) {
    const doc = getDocBySlug(meta.slug);
    if (!doc) continue;
    rows.push({ ...meta, excerpt: excerptFromBody(doc.body) });
  }
  return rows;
}
