import type { APIRoute } from "astro";
import { categoryChromeFieldsForRow } from "../../lib/category-chrome";
import { searchRowsForRoles } from "../../lib/content";
import { hiddenStatusesFromRequest } from "../../lib/handbook-request";

export const prerender = false;

/** JSON rows for `/search` live filter (same shape as server-rendered list). */
export const GET: APIRoute = ({ locals, cookies }) => {
  const roles = locals.session?.user?.roles ?? [];
  const roles = locals.session?.user?.roles ?? [];
  const hiddenStatuses = hiddenStatusesFromRequest(
    cookies,
    locals.session?.user?.email,
    roles,
  );
  const rows = searchRowsForRoles(roles, hiddenStatuses).map((r) => ({
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
