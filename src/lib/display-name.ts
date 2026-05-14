/** Turn `local@domain` into "Local" / "Tim Matthews" style for UI fallbacks. */
export function displayNameFromEmail(
  email: string | null | undefined,
): string {
  if (!email || typeof email !== "string") return "";
  const local = email.split("@")[0]?.trim() ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts
    .map((p) =>
      p.length ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p,
    )
    .join(" ");
}

/**
 * Short label for compact headers (e.g. mobile): first name, or first segment of
 * email local-part when the display string is an address.
 */
export function firstNameFromDisplay(displayName: string): string {
  const d = displayName.trim();
  if (!d || d === "—") return d || "—";
  if (d.includes("@")) {
    const local = d.split("@")[0] ?? d;
    const part = local.split(/[._-]/).filter(Boolean)[0] ?? local;
    return part.length
      ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      : d;
  }
  return (d.split(/\s+/)[0] ?? d).trim();
}
