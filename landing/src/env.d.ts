/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    PUBLIC_APP_URL?: string;
  }
}

declare namespace App {
  interface Locals {
    runtime?: {
      env?: Cloudflare.Env;
    };
    user: import('./lib/auth').PublicUser | null;
    session: { id: string; expiresAt: number } | null;
  }
}
