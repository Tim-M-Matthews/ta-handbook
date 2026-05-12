import Google from "@auth/core/providers/google";
import { defineConfig } from "auth-astro";
import { rolesForEmail } from "./src/lib/roles.ts";

/**
 * Auth.js requires a non-empty secret. Use process.env here: Vite does not expose
 * arbitrary keys on import.meta.env (only VITE_*), and auth-astro's getSession only
 * falls back to import.meta.env.AUTH_SECRET — so defining secret in this config fixes
 * "There was a problem with the server configuration" when .env is otherwise correct.
 */
const secret = process.env.AUTH_SECRET;

export default defineConfig({
  secret,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email =
        typeof profile?.email === "string" ? profile.email.toLowerCase() : "";
      if (!email) return "/login?error=noemail";
      const roles = rolesForEmail(email);
      if (roles.length === 0) return "/login?error=norole";
      return true;
    },
    async jwt({ token, profile }) {
      const emailFromProfile =
        typeof profile?.email === "string"
          ? profile.email.toLowerCase()
          : undefined;
      const email =
        emailFromProfile ??
        (typeof token.email === "string" ? token.email.toLowerCase() : "");
      if (email) {
        token.email = email;
        token.roles = rolesForEmail(email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.roles = Array.isArray(token.roles)
          ? (token.roles as string[])
          : [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
