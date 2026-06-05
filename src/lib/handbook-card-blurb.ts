/** Short line under a handbook card (description or body excerpt). */
export function blurbForHandbookCard(
  row: { description: string | null; bodyPlain: string },
  max = 220,
): string | null {
  const desc = row.description?.trim();
  if (desc) return desc;
  const flat = row.bodyPlain.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}
