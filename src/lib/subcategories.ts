import matter from "gray-matter";
import { fallbackCategoryTitle } from "./categories";

export type SubcategoryDef = {
  categoryId: string;
  subcategoryId: string;
  /** Display title: frontmatter `title`, else title-cased folder id. */
  title: string;
  /** Short summary from frontmatter `description`. */
  description: string | null;
};

const rawSubModules = import.meta.glob<string>("../../content/pages/*/*/_category-meta.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function pairFromGlobKey(key: string): { categoryId: string; subcategoryId: string } | null {
  const m = key.match(/content\/pages\/([^/]+)\/([^/]+)\/_category-meta\.md$/);
  if (!m) return null;
  const categoryId = m[1];
  const subcategoryId = m[2];
  if (!categoryId || !subcategoryId || categoryId.includes("..") || subcategoryId.includes("..")) {
    return null;
  }
  return { categoryId, subcategoryId };
}

function buildSubcategoryMap(): Map<string, SubcategoryDef> {
  const map = new Map<string, SubcategoryDef>();
  for (const [key, raw] of Object.entries(rawSubModules)) {
    const pair = pairFromGlobKey(key.replaceAll("\\", "/"));
    if (!pair) continue;
    const { data } = matter(raw);
    const d = data as Record<string, unknown>;
    const titleFromFile =
      typeof d.title === "string" && d.title.trim() ? d.title.trim() : null;
    const title =
      titleFromFile ?? fallbackCategoryTitle(pair.subcategoryId);
    const description =
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim()
        : null;
    map.set(`${pair.categoryId}/${pair.subcategoryId}`, {
      categoryId: pair.categoryId,
      subcategoryId: pair.subcategoryId,
      title,
      description,
    });
  }
  return map;
}

const subcategoryMap = buildSubcategoryMap();

export function getSubcategoryMap(): ReadonlyMap<string, SubcategoryDef> {
  return subcategoryMap;
}

export function subcategoryDefForPair(
  categoryId: string,
  subcategoryId: string,
): SubcategoryDef | null {
  return subcategoryMap.get(`${categoryId}/${subcategoryId}`) ?? null;
}

export function subcategoryTitleForPair(
  categoryId: string,
  subcategoryId: string,
): string {
  return (
    subcategoryDefForPair(categoryId, subcategoryId)?.title ??
    fallbackCategoryTitle(subcategoryId)
  );
}

export function subcategoryDescriptionForPair(
  categoryId: string,
  subcategoryId: string,
): string | null {
  return subcategoryDefForPair(categoryId, subcategoryId)?.description ?? null;
}
