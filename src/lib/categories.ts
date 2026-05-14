import matter from "gray-matter";

export type CategoryDef = {
  id: string;
  title: string;
  order: number;
  /** If non-empty, only users with one of these roles (or admin) see pages in this category. */
  roles: string[];
  /** Optional short summary from frontmatter `description`. */
  description: string | null;
};

const rawCategoryModules = import.meta.glob<string>("../../content/pages/*/_category-meta.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function idFromGlobKey(key: string): string | null {
  const m = key.match(/content\/pages\/([^/]+)\/_category-meta\.md$/);
  return m ? m[1] : null;
}

function parseRoles(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.roles)) return data.roles.map(String).filter(Boolean);
  if (typeof data.roles === "string" && data.roles.trim())
    return [data.roles.trim()];
  return [];
}

function buildCategoryMap(): Map<string, CategoryDef> {
  const map = new Map<string, CategoryDef>();
  for (const [key, raw] of Object.entries(rawCategoryModules)) {
    const id = idFromGlobKey(key.replaceAll("\\", "/"));
    if (!id || id.includes("..")) continue;
    const { data } = matter(raw);
    const d = data as Record<string, unknown>;
    const title =
      typeof d.title === "string" && d.title.trim() ? d.title.trim() : id;
    const order = typeof d.order === "number" ? d.order : 0;
    const description =
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim()
        : null;
    map.set(id, { id, title, order, roles: parseRoles(d), description });
  }
  return map;
}

const categoryMap = buildCategoryMap();

export function getCategoryMap(): ReadonlyMap<string, CategoryDef> {
  return categoryMap;
}

function titleCaseSegment(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** Display title for an id with no category file (slug-style → words). */
export function fallbackCategoryTitle(id: string): string {
  return id
    .split(/[-_/]+/)
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(" ");
}

export function categoryDefForId(id: string): CategoryDef {
  const hit = categoryMap.get(id);
  if (hit) return hit;
  return {
    id,
    title: fallbackCategoryTitle(id),
    order: 9999,
    roles: [],
    description: null,
  };
}

/**
 * Map frontmatter `category` to a category id: exact id, case-insensitive id,
 * or title match against defined categories (helps older pages that used display names).
 */
export function resolveCategoryId(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "general";
  const t = raw.trim();
  if (categoryMap.has(t)) return t;
  const lower = t.toLowerCase();
  if (categoryMap.has(lower)) return lower;
  for (const [id, def] of categoryMap) {
    if (def.title.toLowerCase() === lower) return id;
  }
  return lower.replace(/\s+/g, "-");
}
