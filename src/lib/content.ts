import matter from "gray-matter";
import {
  categoryDefForId,
  getCategoryMap,
  resolveCategoryId,
} from "./categories";
import { plainTextFromBody } from "./body-render";
import { searchPlainFromHandbookSource } from "./handbook-search-plain";
import {
  subcategoryDescriptionForPair,
  subcategoryTitleForPair,
} from "./subcategories";
import { userCanViewPage } from "./roles";

export type HandbookMeta = {
  slug: string;
  title: string;
  /**
   * Top-level category from the first folder under `content/pages/`
   * (see `folderTaxonomy`). Frontmatter `category` is not used for placement.
   */
  categoryId: string;
  /** Display name from `content/pages/{id}/_category-meta.md`. */
  categoryLabel: string;
  /**
   * Second folder segment when the slug has 3+ path parts, e.g.
   * `clinical/labs/page` → subcategory `labs`. Otherwise `null`.
   */
  subcategoryId: string | null;
  /** Human label for `subcategoryId` (from `…/{sub}/_category-meta.md` or title-cased folder). */
  subcategoryLabel: string | null;
  /** Optional short summary from page frontmatter `description`. */
  description: string | null;
  /** Page-level roles; empty = any viewer who passes the category gate may read. */
  roles: string[];
  order: number;
};

export type HandbookDoc = HandbookMeta & {
  body: string;
};

export type HandbookHomeSubsection = {
  subcategoryId: string | null;
  subcategoryLabel: string | null;
  subcategoryDescription: string | null;
  pages: HandbookMeta[];
};

/** One row per top-level category for the handbook home page (no page list). */
export type HandbookHomeSection = {
  categoryId: string;
  categoryLabel: string;
  categoryDescription: string | null;
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

/** Category + optional subcategory from `content/pages/{cat}/{page}.md` or `.../{cat}/{sub}/{page}.md`. */
function folderTaxonomy(slug: string): {
  categoryId: string;
  subcategoryId: string | null;
} {
  const parts = slug.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return { categoryId: "general", subcategoryId: null };
  }
  const categoryId = resolveCategoryId(parts[0]);
  if (parts.length === 2) {
    return { categoryId, subcategoryId: null };
  }
  return { categoryId, subcategoryId: parts[1] };
}

function metaFromMatter(
  slug: string,
  data: Record<string, unknown>,
): Omit<HandbookMeta, "slug"> {
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : slug.split("/").pop() ?? slug;
  const { categoryId, subcategoryId } = folderTaxonomy(slug);
  const categoryLabel = categoryDefForId(categoryId).title;
  const subcategoryLabel = subcategoryId
    ? subcategoryTitleForPair(categoryId, subcategoryId)
    : null;
  const description =
    typeof data.description === "string" && data.description.trim()
      ? data.description.trim()
      : null;
  let roles: string[] = [];
  if (Array.isArray(data.roles)) {
    roles = data.roles.map(String);
  } else if (typeof data.roles === "string" && data.roles.trim()) {
    roles = [data.roles.trim()];
  }
  const order = typeof data.order === "number" ? data.order : 0;
  return {
    title,
    categoryId,
    categoryLabel,
    subcategoryId,
    subcategoryLabel,
    description,
    roles,
    order,
  };
}

const docsBySlug = new Map<string, HandbookDoc>();

for (const [key, raw] of Object.entries(rawModules)) {
  const norm = key.replaceAll("\\", "/");
  if (/\/_category-meta\.md$/.test(norm)) continue;
  const slug = slugFromGlobKey(norm);
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

export function groupPagesBySubcategory(
  categoryId: string,
  pagesInCategory: HandbookMeta[],
): HandbookHomeSubsection[] {
  const subMap = new Map<string | null, HandbookMeta[]>();
  for (const p of pagesInCategory) {
    const k = p.subcategoryId ?? null;
    if (!subMap.has(k)) subMap.set(k, []);
    subMap.get(k)!.push(p);
  }
  const keys = [...subMap.keys()].sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a.localeCompare(b);
  });
  return keys.map((k) => ({
    subcategoryId: k,
    subcategoryLabel: k === null ? null : subcategoryTitleForPair(categoryId, k),
    subcategoryDescription:
      k === null ? null : subcategoryDescriptionForPair(categoryId, k),
    pages: subMap.get(k)!,
  }));
}

export function homeSectionsForRoles(userRoles: string[]): HandbookHomeSection[] {
  const pages = listMetaForRoles(userRoles);
  const catOrder: string[] = [];
  const seen = new Set<string>();
  for (const p of pages) {
    if (!seen.has(p.categoryId)) {
      seen.add(p.categoryId);
      catOrder.push(p.categoryId);
    }
  }
  return catOrder.map((cid) => {
    const def = categoryDefForId(cid);
    return {
      categoryId: cid,
      categoryLabel: def.title,
      categoryDescription: def.description,
    };
  });
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
      subcategoryId: doc.subcategoryId,
      subcategoryLabel: doc.subcategoryLabel,
      description: doc.description,
      roles: doc.roles,
      order: doc.order,
    });
  }
  metas.sort((a, b) => {
    const ca = categoryDefForId(a.categoryId);
    const cb = categoryDefForId(b.categoryId);
    if (ca.order !== cb.order) return ca.order - cb.order;
    const sa = a.subcategoryId ?? "";
    const sb = b.subcategoryId ?? "";
    if (sa !== sb) return sa.localeCompare(sb);
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
  return metas;
}

/** True if this category id has `_category-meta.md` or appears on at least one page. */
export function categoryExistsInSite(categoryId: string): boolean {
  if (getCategoryMap().has(categoryId)) return true;
  for (const doc of docsBySlug.values()) {
    if (doc.categoryId === categoryId) return true;
  }
  return false;
}

/** At least one page uses this category + subfolder id (second path segment). */
export function subcategoryExistsInSite(
  categoryId: string,
  subcategoryId: string,
): boolean {
  for (const doc of docsBySlug.values()) {
    if (doc.categoryId === categoryId && doc.subcategoryId === subcategoryId) {
      return true;
    }
  }
  return false;
}

/** Pages in this category visible to `userRoles`, sorted like `listMetaForRoles`. */
export function listMetaForCategory(
  userRoles: string[],
  categoryParam: string,
): HandbookMeta[] {
  const want = resolveCategoryId(categoryParam);
  return listMetaForRoles(userRoles).filter((m) => m.categoryId === want);
}

export function listMetaForSubcategory(
  userRoles: string[],
  categoryParam: string,
  subcategoryParam: string,
): HandbookMeta[] {
  const cat = resolveCategoryId(categoryParam);
  const sub = subcategoryParam.trim();
  if (!sub || sub.includes("..") || sub.includes("/")) return [];
  return listMetaForCategory(userRoles, cat).filter((m) => m.subcategoryId === sub);
}

/** Distinct category ids for sitemap and routing. */
export function getAllCategoryIndexIds(): string[] {
  const s = new Set<string>(getCategoryMap().keys());
  for (const doc of docsBySlug.values()) {
    s.add(doc.categoryId);
  }
  return [...s].sort();
}

export function getAllSubcategoryIndexPairs(): {
  categoryId: string;
  subcategoryId: string;
}[] {
  const seen = new Set<string>();
  const out: { categoryId: string; subcategoryId: string }[] = [];
  for (const doc of docsBySlug.values()) {
    if (!doc.subcategoryId) continue;
    const key = `${doc.categoryId}/${doc.subcategoryId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ categoryId: doc.categoryId, subcategoryId: doc.subcategoryId });
  }
  out.sort((a, b) => {
    const c = a.categoryId.localeCompare(b.categoryId);
    return c !== 0 ? c : a.subcategoryId.localeCompare(b.subcategoryId);
  });
  return out;
}

export function excerptFromBody(body: string, max = 220): string {
  const flat = plainTextFromBody(body).replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export type SearchRow = HandbookMeta & {
  /**
   * Collapsed plain text from the full page body (search haystack + contextual snippets).
   */
  bodyPlain: string;
};

export function searchRowsForRoles(userRoles: string[]): SearchRow[] {
  const rows: SearchRow[] = [];
  for (const meta of listMetaForRoles(userRoles)) {
    const doc = getDocBySlug(meta.slug);
    if (!doc) continue;
    rows.push({
      ...meta,
      bodyPlain: searchPlainFromHandbookSource(doc.body),
    });
  }
  return rows;
}
