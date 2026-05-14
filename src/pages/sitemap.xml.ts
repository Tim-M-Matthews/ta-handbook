import type { APIRoute } from "astro";
import {
  getAllCategoryIndexIds,
  getAllSlugs,
  getAllSubcategoryIndexPairs,
} from "../lib/content";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function locForPath(base: string, path: string): string {
  const u = new URL(path, `${base.replace(/\/$/, "")}/`);
  return u.href;
}

export const GET: APIRoute = ({ site, request }) => {
  const base =
    (typeof site === "string" ? site : site?.href)?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  const paths = [
    "/",
    "/search",
    ...getAllCategoryIndexIds().map((id) => `/c/${encodeURIComponent(id)}`),
    ...getAllSubcategoryIndexPairs().map(
      ({ categoryId, subcategoryId }) =>
        `/c/${encodeURIComponent(categoryId)}/${encodeURIComponent(subcategoryId)}`,
    ),
    ...getAllSlugs().map((slug) => `/p/${slug}`),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      (p) =>
        `  <url><loc>${xmlEscape(locForPath(base, p))}</loc></url>`,
    ),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
