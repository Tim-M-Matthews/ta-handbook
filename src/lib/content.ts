import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { userCanViewPage } from "./roles";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type HandbookMeta = {
  slug: string;
  title: string;
  category: string;
  /** If empty, any signed-in user with a mapped role may view. */
  roles: string[];
  order: number;
};

export type HandbookDoc = HandbookMeta & {
  body: string;
};

function assertSafeSlug(slug: string): void {
  if (!slug || slug.includes("..") || slug.startsWith("/")) {
    throw new Error("Invalid slug");
  }
}

function markdownPathForSlug(slug: string): string {
  assertSafeSlug(slug);
  const resolvedRoot = path.resolve(PAGES_DIR);
  const file = path.resolve(path.join(PAGES_DIR, `${slug}.md`));
  if (!file.startsWith(resolvedRoot + path.sep) && file !== resolvedRoot) {
    throw new Error("Invalid path");
  }
  return file;
}

function walkMarkdownFiles(dir: string, prefix = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const ent of entries) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      out.push(...walkMarkdownFiles(path.join(dir, ent.name), rel));
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      out.push(rel.slice(0, -3));
    }
  }
  return out;
}

function metaFromMatter(
  slug: string,
  data: Record<string, unknown>
): Omit<HandbookMeta, "slug"> {
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : slug.split("/").pop() ?? slug;
  const category =
    typeof data.category === "string" && data.category.trim()
      ? data.category.trim()
      : "General";
  let roles: string[] = [];
  if (Array.isArray(data.roles)) {
    roles = data.roles.map(String);
  } else if (typeof data.roles === "string" && data.roles.trim()) {
    roles = [data.roles.trim()];
  }
  const order = typeof data.order === "number" ? data.order : 0;
  return { title, category, roles, order };
}

export function getAllSlugs(): string[] {
  return walkMarkdownFiles(PAGES_DIR);
}

export function getDocBySlug(slug: string): HandbookDoc | null {
  try {
    const file = markdownPathForSlug(slug);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    const { content, data } = matter(raw);
    const m = metaFromMatter(slug, data as Record<string, unknown>);
    return { slug, ...m, body: content.trim() };
  } catch {
    return null;
  }
}

export function listMetaForRoles(userRoles: string[]): HandbookMeta[] {
  const slugs = getAllSlugs();
  const metas: HandbookMeta[] = [];
  for (const slug of slugs) {
    const doc = getDocBySlug(slug);
    if (!doc) continue;
    if (!userCanViewPage(userRoles, doc.roles)) continue;
    metas.push({
      slug: doc.slug,
      title: doc.title,
      category: doc.category,
      roles: doc.roles,
      order: doc.order,
    });
  }
  metas.sort((a, b) => {
    const c = a.category.localeCompare(b.category);
    if (c !== 0) return c;
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
  return metas;
}

export function excerptFromBody(body: string, max = 220): string {
  const flat = body.replace(/\s+/g, " ").trim();
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
