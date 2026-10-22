import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createLead } from '../../lib/store';
import { generateId } from '../../lib/auth';

export const prerender = false;

const ROLES = ['senior', 'family', 'bank', 'telco', 'other'];

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) : '';
  const phone = normalizePhone(typeof input.phone === 'string' ? input.phone : '');
  const role = typeof input.role === 'string' && ROLES.includes(input.role) ? input.role : 'family';
  const city = typeof input.city === 'string' ? input.city.trim().slice(0, 80) : null;
  const consent = input.consent === true;

  if (name.length < 2) return json({ error: 'Vui lòng nhập họ tên.' }, 400);
  if (!phone) return json({ error: 'Số điện thoại chưa đúng định dạng Việt Nam.' }, 400);
  if (!consent) return json({ error: 'Cần đồng ý để chúng tôi liên hệ tư vấn.' }, 400);

  const row = {
    id: generateId(12),
    name,
    phone,
    role,
    city: city || null,
    consent: true,
    source: 'landing',
    createdAt: Date.now(),
  };

  try {
    await createLead(env?.DB, row);
    return json({ ok: true, id: row.id }, 201);
  } catch (error) {
    console.error('[leads] insert failed', error);
    return json({ error: 'Không lưu được đăng ký. Vui lòng thử lại.' }, 500);
  }
};

export const ALL: APIRoute = () => json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

function normalizePhone(raw: string): string | null {
  let value = raw.replace(/[^\d+]/g, '');
  if (value.startsWith('+84')) value = `0${value.slice(3)}`;
  else if (value.startsWith('84') && value.length === 11) value = `0${value.slice(2)}`;
  return /^0\d{9}$/.test(value) ? value : null;
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
