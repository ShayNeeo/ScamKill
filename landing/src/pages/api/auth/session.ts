import type { APIRoute } from 'astro';
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  generateId,
  hashPassword,
  invalidateSession,
  normalizeEmail,
  toPublicUser,
  verifyPassword,
} from '../../../lib/auth';
import { createUser, findUserByEmail } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = ({ locals }) =>
  json(
    {
      user: locals.user,
      session: locals.session ? { expiresAt: locals.session.expiresAt } : null,
    },
    200,
    { 'cache-control': 'no-store' },
  );

interface AuthBody {
  mode?: unknown;
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  let body: AuthBody;
  try {
    body = (await request.json()) as AuthBody;
  } catch {
    return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }

  const mode = body.mode === 'signup' ? 'signup' : 'login';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: 'Email chưa đúng định dạng.' }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return json({ error: 'Mật khẩu cần từ 8 đến 128 ký tự.' }, 400);
  }
  if (mode === 'signup' && name.length < 2) {
    return json({ error: 'Vui lòng nhập tên của bạn.' }, 400);
  }

  const d1 = locals.runtime?.env?.DB;
  try {
    let user = await findUserByEmail(d1, email);

    if (mode === 'signup') {
      if (user) return json({ error: 'Email này đã có tài khoản. Hãy đăng nhập.' }, 409);
      const row = {
        id: generateId(16),
        email,
        name,
        passwordHash: await hashPassword(password),
        createdAt: Date.now(),
      };
      await createUser(d1, row);
      user = row;
    } else {
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return json({ error: 'Email hoặc mật khẩu không đúng.' }, 401);
      }
    }

    const { token, session } = await createSession(d1, user.id);
    cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return json(
      {
        user: toPublicUser(user),
        session: { expiresAt: session.expiresAt },
      },
      mode === 'signup' ? 201 : 200,
    );
  } catch (error) {
    console.error('[auth] session creation failed', error);
    return json({ error: 'Không tạo được phiên đăng nhập. Vui lòng thử lại.' }, 500);
  }
};

export const DELETE: APIRoute = async ({ cookies, locals }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await invalidateSession(locals.runtime?.env?.DB, token);
    } catch (error) {
      console.error('[auth] logout failed', error);
    }
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return json({ ok: true });
};

export const ALL: APIRoute = () =>
  json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST, DELETE' });

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
