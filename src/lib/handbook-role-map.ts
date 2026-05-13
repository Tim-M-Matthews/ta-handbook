/**
 * Google sign-in access: lowercase email → one role or a list of roles.
 * Anyone listed here can complete Google OAuth; others get /login?error=norole.
 * Users with role `admin` can read every handbook page regardless of page frontmatter.
 *
 * Edit this file and redeploy to add or remove people—no Cloudflare env var.
 */
export const handbookRoleByEmail: Record<string, string | string[]> = {
  "tim.matthews@triangleact.com": ["admin", "clinical"],
};
