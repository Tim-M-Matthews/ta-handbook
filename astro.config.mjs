import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import auth from "auth-astro";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [auth()],
});
