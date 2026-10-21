import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, validateSessionToken } from './lib/auth';

/**
 * Edge middleware: resolve the session cookie against D1 (or the dev memory
 * store) and attach the user to `locals`, then add baseline security headers.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;

  if (!context.isPrerendered) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      try {
        const d1 = context.locals.runtime?.env?.DB;
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
