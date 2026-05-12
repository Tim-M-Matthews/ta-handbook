import { marked } from "marked";

marked.setOptions({ gfm: true });

/**
 * Pages CMS (and similar) persist rich text as HTML in the file body.
 * Legacy handbook pages use Markdown/GFM — detect HTML so we render correctly.
 */
export function bodyIsLikelyHtml(body: string): boolean {
  const t = body.trim();
  if (!t.startsWith("<")) return false;
  return /<\/?[a-z][a-z0-9-]*[\s/>]/i.test(t);
}

/** HTML for `<article>`: either sanitized-ish pass-through (CMS HTML) or Markdown → HTML. */
export function renderHandbookBody(body: string): string {
  const trimmed = body.trim();
  if (bodyIsLikelyHtml(trimmed)) return trimmed;
  return marked.parse(body) as string;
}

/** Strip tags / basic entities for search excerpts and plain previews. */
export function plainTextFromBody(body: string): string {
  let s = body;
  if (bodyIsLikelyHtml(body)) {
    s = body
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#[0-9]+;/g, " ")
      .replace(/&[a-z]{2,10};/gi, " ");
  }
  return s;
}
