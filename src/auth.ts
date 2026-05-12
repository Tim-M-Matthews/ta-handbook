import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { rolesForEmail } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
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
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith("/api/auth")) return true;
      if (pathname === "/login") return true;
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/login",
  },
});
