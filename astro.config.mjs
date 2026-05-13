import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import auth from "auth-astro";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: "server",
  adapter: cloudflare(),
  integrations: [auth()],
});
