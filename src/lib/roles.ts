/**
 * Maps Google account emails (lowercased) to handbook roles.
 * Set HANDBOOK_ROLE_MAP to JSON, e.g.
 * {"you@triangleact.com":["admin","clinical"],"other@triangleact.com":["staff"]}
 *
 * Values may be a string (single role) or string[].
 * Users with the "admin" role can read every page regardless of frontmatter roles.
 */
export function parseRoleMap(): Record<string, string[]> {
  const raw = process.env.HANDBOOK_ROLE_MAP;
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string | string[]>;
    const out: Record<string, string[]> = {};
    for (const [email, value] of Object.entries(parsed)) {
      const key = email.trim().toLowerCase();
      if (!key) continue;
      out[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    return out;
  } catch {
    return {};
  }
}

export function rolesForEmail(email: string): string[] {
  const map = parseRoleMap();
  return map[email.trim().toLowerCase()] ?? [];
}

export function userCanViewPage(
  userRoles: string[],
  pageRoles: string[] | undefined
): boolean {
  if (userRoles.includes("admin")) return true;
  const required = pageRoles?.filter(Boolean) ?? [];
  if (required.length === 0) return true;
  return required.some((r) => userRoles.includes(r));
}
