/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  PUBLIC_APP_URL?: string;
}

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends CloudflareRuntime {
    user: import('./lib/auth').PublicUser | null;
    session: { id: string; expiresAt: number } | null;
  }
}
