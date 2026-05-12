import { defineMiddleware } from "astro:middleware";
import { getSession } from "auth-astro/server";
import { devAuthSessionForBypass, isAuthBypassed } from "./lib/dev-auth";

function isLikelyStaticAsset(pathname: string): boolean {
  return /\.[a-z0-9]{1,12}$/i.test(pathname);
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (isAuthBypassed()) {
    context.locals.session = devAuthSessionForBypass();
    if (context.url.pathname === "/login") {
      return context.redirect("/");
    }
    return next();
  }

  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession(context.request);
  } catch (err) {
    console.error(
      "[auth] getSession failed. Set AUTH_SECRET in .env (see .env.example).",
      err,
    );
    session = null;
  }
  context.locals.session = session;

  const pathname = context.url.pathname;
  if (pathname.startsWith("/api/auth")) return next();
  if (pathname === "/login") return next();
  if (isLikelyStaticAsset(pathname)) return next();

  if (!session?.user) {
    return context.redirect("/login");
  }

  return next();
});
