/** Escape text for safe insertion as HTML text nodes / set:html after wrapping. */
export function escapeHtmlForSearchHighlight(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

/**
 * Wraps query word matches in `<strong class="search-hit__kw">` (case-insensitive).
 * Escapes `text` first. When the trimmed query is under 2 characters, returns escaped
 * text only (matches live search threshold).
 */
export function highlightQueryTermsInPlainText(text: string, query: string): string {
  const raw = String(text);
  const qt = query.trim();
  const escaped = escapeHtmlForSearchHighlight(raw);
  if (qt.length < 2) return escaped;

  const parts = [...new Set(qt.toLowerCase().split(/\s+/).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!parts.length) return escaped;

  const pattern = parts.map(escapeRegExp).join("|");
  if (!pattern) return escaped;

  const re = new RegExp(`(${pattern})`, "gi");
  return escaped.replace(re, '<strong class="search-hit__kw">$1</strong>');
}
