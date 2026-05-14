/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** When `"true"`, same as local dev: no Google sign-in; synthetic admin session (for preview deploys). */
  readonly DISABLE_AUTH?: string;
  /** During `astro dev`, override the default local user email (`tim.matthews@triangleact.com`). */
  readonly DEV_AUTH_EMAIL?: string;
  /** During `astro dev`, optional display name for the header (defaults from email local-part). */
  readonly DEV_AUTH_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    session: import("@auth/core/types").Session | null;
  }
}

declare module "@auth/core/types" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    name?: string | null;
    roles?: string[];
  }
}
