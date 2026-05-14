/** Same rules as the inline client script on `/search` (substring + all words). No hits until the trimmed query is at least 2 characters. */
export function filterHandbookSearchRows<
  T extends {
    title: string;
    categoryLabel: string;
    bodyPlain: string;
    subcategoryLabel?: string | null;
    description?: string | null;
  },
>(rows: T[], q: string): T[] {
  const qt = q.trim();
  if (qt.length < 2) return [];
  const parts = qt.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = rows.filter((row) => {
    const sub = row.subcategoryLabel ? String(row.subcategoryLabel) : "";
    const desc = row.description ? String(row.description) : "";
    const hay =
      `${row.title} ${row.categoryLabel} ${sub} ${desc} ${row.bodyPlain}`.toLowerCase();
    return parts.every((p) => hay.includes(p));
  });
  hits.sort((a, b) => a.title.localeCompare(b.title));
  return hits;
}
