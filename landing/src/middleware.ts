import { defineMiddleware } from 'astro:middleware';
import { env as cfEnv } from 'cloudflare:workers';
import { SESSION_COOKIE, validateSessionToken } from './lib/auth';

/**
 * Astro 6 Cloudflare Edge Middleware:
 * Hydrates `context.locals.runtime.env` from `cloudflare:workers`, resolves the
 * session cookie against D1 (or dev memory store), and sets security headers.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;

  if (!context.isPrerendered) {
    // In Astro 6, Cloudflare bindings are imported directly from `cloudflare:workers`
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      try {
        const d1 = cfEnv?.DB;
        const resolved = await validateSessionToken(d1, token);
        if (resolved) {
          context.locals.user = resolved.user;
          context.locals.session = resolved.session;
        }
      } catch (error) {
        console.error('[auth] session lookup failed', error);
      }
    }
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
});
