/**
 * Plain text for handbook search (index + snippets). Kept separate from
 * `body-render.ts` so client bundles do not pull in `marked`.
 */

function bodyLooksLikeHandbookHtml(body: string): boolean {
  const t = body.trim();
  if (!t.startsWith("<")) return false;
  return /<\/?[a-z][a-z0-9-]*[\s/>]/i.test(t);
}

function stripHtmlTagsForSearch(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#[0-9]+;/g, " ")
    .replace(/&[a-z]{2,10};/gi, " ");
}

/**
 * Best-effort removal of obvious Markdown / GFM syntax for search indexing and
 * card snippets (not a full parser — nested edge cases may leave stray marks).
 */
function stripMarkdownArtifacts(md: string): string {
  let s = md;
  s = s.replace(/^```[\w-]*\s*\n[\s\S]*?^```/gm, " ");
  s = s.replace(/<!--([\s\S]*?)-->/g, " ");
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  s = s.replace(/<(https?:\/\/[^>\s]+)>/gi, "$1");
  s = s.replace(/\[\^[^\]]*\]/g, "");
  s = s.replace(/~~([\s\S]*?)~~/g, "$1");
  s = s.replace(/``([^`]*)``/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s
    .split("\n")
    .map((line) => ((line.match(/\|/g) || []).length >= 2 ? line.replace(/\|/g, " ") : line))
    .join("\n");
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  s = s.replace(/___([^_]+)___/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/^>\s?/gm, "");
  s = s.replace(/^[\t ]*([-*_])([\t ]*\1){2,}[\t ]*$/gm, "");
  s = s.replace(/^[\s]*[-*+]\s+\[[ xX]\]\s+/gm, "");
  s = s.replace(/^[\s]*[-*+]\s+/gm, "");
  s = s.replace(/^[\s]{0,3}\d+\.\s+/gm, "");
  return s;
}

/**
 * Plain text for search: HTML bodies → tag-stripped; Markdown → syntax stripped
 * then whitespace collapsed.
 */
export function searchPlainFromHandbookSource(body: string): string {
  const t = body.trim();
  if (!t) return "";
  if (bodyLooksLikeHandbookHtml(t)) {
    return stripHtmlTagsForSearch(body).replace(/\s+/g, " ").trim();
  }
  return stripMarkdownArtifacts(body).replace(/\s+/g, " ").trim();
}
