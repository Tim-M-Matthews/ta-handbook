import type { APIRoute } from "astro";
import { categoryChromeFieldsForRow } from "../../lib/category-chrome";
import { searchRowsForRoles } from "../../lib/content";

export const prerender = false;

/** JSON rows for `/search` live filter (same shape as server-rendered list). */
export const GET: APIRoute = ({ locals }) => {
  const roles = locals.session?.user?.roles ?? [];
  const rows = searchRowsForRoles(roles).map((r) => ({
    slug: r.slug,
    title: r.title,
    categoryLabel: r.categoryLabel,
    subcategoryLabel: r.subcategoryLabel,
    categoryId: r.categoryId,
    description: r.description,
    bodyPlain: r.bodyPlain,
    ...categoryChromeFieldsForRow(r.categoryId),
  }));
  return new Response(JSON.stringify(rows), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
};
