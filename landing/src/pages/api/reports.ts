import type { APIRoute } from 'astro';
import { generateId } from '../../lib/auth';
import { countReports, createReport, listReports } from '../../lib/store';

export const prerender = false;

const CHANNELS = ['phone', 'sms', 'zalo', 'telegram', 'other'];
const CATEGORIES = [
  'authority_impersonation',
  'relative_emergency',
  'otp_or_money_demand',
  'suspicious_url',
  'malicious_app_install',
  'unknown',
];

export const GET: APIRoute = async ({ locals }) => {
  const d1 = locals.runtime?.env?.DB;
  const [total, recent] = await Promise.all([countReports(d1), listReports(d1, 10)]);
  return json({
    total,
    recent: recent.map(({ phoneNumber, ...rest }) => ({ ...rest, phoneNumber: maskPhone(phoneNumber) })),
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }

  const input = body as Record<string, unknown>;
  const phoneNumber = normalizePhone(typeof input.phoneNumber === 'string' ? input.phoneNumber : '');
  const channel = typeof input.channel === 'string' && CHANNELS.includes(input.channel) ? input.channel : 'phone';
  const category =
    typeof input.category === 'string' && CATEGORIES.includes(input.category) ? input.category : 'unknown';
  const description =
    typeof input.description === 'string' ? input.description.trim().slice(0, 500) : null;
  const reporterName =
    typeof input.reporterName === 'string' ? input.reporterName.trim().slice(0, 80) : null;

  if (!phoneNumber) return json({ error: 'Số điện thoại chưa đúng định dạng Việt Nam.' }, 400);

  const row = {
    id: generateId(12),
    reporterName,
    phoneNumber,
    channel,
    category,
    description,
    status: 'pending',
    createdAt: Date.now(),
  };

  try {
    await createReport(locals.runtime?.env?.DB, row);
    return json({ ok: true, id: row.id }, 201);
  } catch (error) {
    console.error('[reports] insert failed', error);
    return json({ error: 'Không lưu được báo cáo. Vui lòng thử lại.' }, 500);
  }
};

export const ALL: APIRoute = () =>
  json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });

function normalizePhone(raw: string): string | null {
  let value = raw.replace(/[^\d+]/g, '');
  if (value.startsWith('+84')) value = `0${value.slice(3)}`;
  else if (value.startsWith('84') && value.length === 11) value = `0${value.slice(2)}`;
  return /^0\d{9}$/.test(value) ? value : null;
}

function maskPhone(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : '***';
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
