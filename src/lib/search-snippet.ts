import { searchPlainFromHandbookSource } from "./handbook-search-plain";

/** Row fields needed to build a keyword-relative plain snippet (no markdown). */
export type SearchSnippetSource = {
  title: string;
  description: string | null;
  categoryLabel: string;
  subcategoryLabel: string | null;
  /** Collapsed-whitespace plain text from the full page body. */
  bodyPlain: string;
};

const PRE = 52;
const POST = 140;

function queryTerms(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 0);
}

/** Terms that do not already appear in the title (case-insensitive). */
function termsNotInTitle(title: string, terms: string[]): string[] {
  const tl = title.toLowerCase();
  return terms.filter((t) => !tl.includes(t));
}

function leftmostMatch(hay: string, terms: string[]): { i: number; len: number } | null {
  const h = hay.toLowerCase();
  let best: { i: number; len: number } | null = null;
  for (const t of terms) {
    const idx = h.indexOf(t);
    if (idx === -1) continue;
    if (!best || idx < best.i || (idx === best.i && t.length > best.len)) {
      best = { i: idx, len: t.length };
    }
  }
  return best;
}

function sliceWithEllipsis(s: string, start: number, end: number): string {
  const left = start > 0;
  const right = end < s.length;
  const core = s.slice(start, end).replace(/\s+/g, " ").trim();
  return `${left ? "…" : ""}${core}${right ? "…" : ""}`;
}

/**
 * Plain-text snippet around a query term, or `null` when every term already
 * appears in the title (no extra context needed) or when there is no match
 * in description / body / category line.
 */
export function searchSnippetForHit(row: SearchSnippetSource, query: string): string | null {
  const terms = queryTerms(query);
  if (terms.length === 0) return null;

  const uncovered = termsNotInTitle(row.title, terms);
  if (uncovered.length === 0) return null;

  const desc = searchPlainFromHandbookSource(row.description ?? "");
  const catLine =
    row.subcategoryLabel && row.subcategoryLabel.trim()
      ? `${row.categoryLabel} · ${row.subcategoryLabel.trim()}`
      : row.categoryLabel;

  const fields = [desc, row.bodyPlain, catLine].filter((f) => f.length > 0);

  for (const field of fields) {
    const m = leftmostMatch(field, uncovered);
    if (!m) continue;
    const from = Math.max(0, m.i - PRE);
    const to = Math.min(field.length, m.i + m.len + POST);
    return sliceWithEllipsis(field, from, to);
  }

  return null;
}
