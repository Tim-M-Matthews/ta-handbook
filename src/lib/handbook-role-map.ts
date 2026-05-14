/**
 * Google sign-in access: lowercase email → one role or a list of roles.
 * Anyone listed here can complete Google OAuth; others get /login?error=norole.
 * Users with role `admin` can read every handbook page regardless of page frontmatter.
 *
 * Access tiers used here: **`admin`** (full handbook) and **`staff`** (same visibility
 * today when pages/categories do not add stricter `roles` in frontmatter).
 *
 * Keys are lowercase Google emails on this domain: **`first.last@triangleact.com`**
 * (must match the account exactly). Edit this file and redeploy—no Cloudflare env var.
 */
export const handbookRoleByEmail: Record<string, string | string[]> = {
  "amy.hawkins@triangleact.com": "staff",
  "ali.matthews@triangleact.com": "admin",
  "jen.matthews@triangleact.com": "staff",
  "karen.schulze@triangleact.com": "staff",
  "karina.reiff@triangleact.com": "staff",
  "lorraine.matthews@triangleact.com": "admin",
  "marc.giandenoto@triangleact.com": "staff",
  "sarah.hauser@triangleact.com": "staff",
  "tim.matthews@triangleact.com": "admin",
};
