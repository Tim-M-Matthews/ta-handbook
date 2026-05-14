import { marked } from "marked";

marked.setOptions({ gfm: true });

/** Plain text from heading inner HTML for slug generation (matches GitHub-ish TOC links). */
function headingInnerPlainText(innerHtml: string): string {
  return innerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugifyHeadingId(plain: string): string {
  const base = plain
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "section";
}

/** Add stable `id` attributes to headings that lack them (Markdown output only). */
function addHeadingIds(html: string): string {
  const used = new Map<string, number>();
  return html.replace(/<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const a = attrs ?? "";
    if (/\bid\s*=/i.test(a)) return full;
    const slugBase = slugifyHeadingId(headingInnerPlainText(inner));
    let id = slugBase;
    const n = used.get(slugBase) ?? 0;
    used.set(slugBase, n + 1);
    if (n > 0) id = `${slugBase}-${n}`;
    const idAttr = ` id="${id}"`;
    return `<h${level}${a}${idAttr}>${inner}</h${level}>`;
  });
}

/** GFM task list inputs are emitted with `disabled` — remove so checkboxes work in the browser. */
function enableCheckboxInputs(html: string): string {
  return html.replace(/<input([^>]*)>/gi, (full, attrs) => {
    if (!/type\s*=\s*["']checkbox["']/i.test(attrs)) return full;
    const cleaned = attrs
      .replace(/\sdisabled\s*=\s*["'][^"']*["']/gi, " ")
      .replace(/\sdisabled\b/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return `<input ${cleaned}>`;
  });
}

/**
 * Visual CMS editors (e.g. GitCMS) often persist rich text as HTML in the file body.
 * Legacy handbook pages use Markdown/GFM — detect HTML so we render correctly.
 *
 * If the file starts with a small HTML block but later contains Markdown ATX headings
 * (`#` … at line start), treat as Markdown so mixed pages (e.g. kitchen sink) still parse.
 */
export function bodyIsLikelyHtml(body: string): boolean {
  const t = body.trim();
  if (!t.startsWith("<")) return false;
  if (!/<\/?[a-z][a-z0-9-]*[\s/>]/i.test(t)) return false;
  if (/^<[\s\S]{0,12000}?^\s{0,3}#{1,6}\s/m.test(t)) return false;
  return true;
}

/** HTML for `<article>`: either sanitized-ish pass-through (CMS HTML) or Markdown → HTML. */
export function renderHandbookBody(body: string): string {
  const trimmed = body.trim();
  if (bodyIsLikelyHtml(trimmed)) return enableCheckboxInputs(trimmed);
  const html = marked.parse(body) as string;
  return enableCheckboxInputs(addHeadingIds(html));
}

/** Short frontmatter `description` → HTML for search cards (GFM). */
export function searchCardDescriptionHtml(description: string | null | undefined): string | null {
  if (description == null) return null;
  const t = String(description).trim();
  if (!t) return null;
  return renderHandbookBody(t);
}

/**
 * First portion of a Markdown handbook body → HTML for search cards.
 * Returns `null` when the body is treated as HTML (use plain `excerpt` text instead).
 */
export function searchCardExcerptHtml(body: string, maxChars = 500): string | null {
  const t = body.trim();
  if (!t) return null;
  if (bodyIsLikelyHtml(t)) return null;
  let src = t;
  if (src.length > maxChars) {
    const slice = src.slice(0, maxChars);
    const br = slice.lastIndexOf("\n\n");
    const cut = br > 120 ? br : slice.lastIndexOf(" ");
    src = (cut > 80 ? slice.slice(0, cut) : slice) + "\n\n*…*";
  }
  return renderHandbookBody(src);
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
