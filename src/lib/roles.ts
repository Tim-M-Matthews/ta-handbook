import { handbookRoleByEmail } from "./handbook-role-map";

/**
 * Roles for a Google (or dev persona) email after sign-in.
 * Source of truth: `handbook-role-map.ts`.
 */
export function rolesForEmail(email: string): string[] {
  const key = email.trim().toLowerCase();
  const value = handbookRoleByEmail[key];
  if (value == null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

export function userCanViewPage(
  userRoles: string[],
  pageRoles: string[] | undefined,
): boolean {
  if (userRoles.includes("admin")) return true;
  const required = pageRoles?.filter(Boolean) ?? [];
  if (required.length === 0) return true;
  return required.some((r) => userRoles.includes(r));
}
