/**
 * Standalone Hono Edge HTTP Router mounted inside Astro 6 SSR on Cloudflare Workers (`/api/v1/*`)
 * Handles mobile app requests, third-party webhooks, and live caller reputation lookups.
 */

import type { APIRoute } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateId } from '../../../lib/auth';
import { createReport, listReports } from '../../../lib/store';

export const prerender = false;

type Bindings = {
  DB?: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api/v1');

app.use('*', cors());

const KNOWN_SCAM_NUMBERS: Record<
  string,
  { status: 'high_risk' | 'caution'; badge: string; reports: number; reason: string }
> = {
  '02477778888': {
    status: 'high_risk',
    badge: 'Nguy cơ cao: số bị 142 người báo cáo giả danh Công an / Viện kiểm sát',
    reports: 142,
    reason: 'Nhiều gia đình báo cáo số này dọa khóa tài khoản và yêu cầu chuyển tiền phục vụ điều tra.',
  },
  '+855889123456': {
    status: 'high_risk',
    badge: 'Nguy cơ cao: đầu số quốc tế lạ (+855) giả danh cơ quan chức năng',
    reports: 89,
    reason: 'Đầu số nước ngoài kết hợp kịch bản hù dọa pháp lý hoặc thông báo trúng thưởng.',
  },
  '0918765432': {
    status: 'caution',
    badge: 'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh',
    reports: 7,
    reason: 'Trùng kịch bản giả giọng con cháu báo tai nạn xin chuyển gấp 30 triệu (Kịch bản Bà Lan).',
  },
};

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'scamkill-edge-hono',
    stack: {
      shell: 'Astro 6 SSR / Hybrid (@astrojs/cloudflare)',
      islands: ['React 19 + TanStack Router (/portal)', 'Svelte 5 (BaLanSimulator, PricingCalculator)'],
      rpc: 'Astro Server Actions (astro:actions)',
      api: 'Hono Edge Router (/api/v1/*)',
      database: 'Cloudflare D1 + Drizzle ORM',
      compiler: 'tsrs (Cloudflare + Oxc Rust Port of TypeScript 7.1)',
    },
    timestamp: new Date().toISOString(),
  })
);

app.post('/call-check', async (c) => {
  const rawBody: unknown = await c.req.json().catch(() => ({}));
  const body =
    rawBody && typeof rawBody === 'object' ? (rawBody as Record<string, unknown>) : {};
  const raw = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
  const normalized = raw.replace(/[\s.-]/g, '');
  const inContacts = body.inContacts === true;
  const asksForUrgentMoney = body.asksForUrgentMoney === true;

  if (!normalized) {
    return c.json({ error: 'Vui lòng nhập số điện thoại cần kiểm tra.' }, 400);
  }

  const hit = KNOWN_SCAM_NUMBERS[normalized];
  if (hit) {
    return c.json({
      phoneNumber: raw,
      normalizedNumber: normalized,
      status: hit.status,
      badgeLabel: hit.badge,
      communityReportCount: hit.reports,
      reason: hit.reason,
      epistemicNote:
        'Hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn 100%; luôn hỏi Mã gia đình khi có yêu cầu chuyển tiền.',
      verificationSteps: [
        '1. Hỏi "Mã gia đình" (từ khóa bí mật của nhà mình).',
        '2. Cúp máy và gọi lại theo số con cháu đã lưu sẵn trong danh bạ.',
      ],
    });
  }

  if (inContacts) {
    return c.json({
      phoneNumber: raw,
      normalizedNumber: normalized,
      status: asksForUrgentMoney ? 'caution' : 'safe',
      badgeLabel: asksForUrgentMoney
        ? 'Số trong danh bạ nhưng xin tiền gấp - Cần hỏi Mã gia đình phòng mất SIM/Zalo'
        : 'Số đã lưu trong danh bạ gia đình',
      communityReportCount: 0,
      reason: asksForUrgentMoney
        ? 'Kẻ gian có thể chiếm quyền Zalo hoặc giả giọng. Hãy hỏi Mã gia đình trước khi chuyển tiền.'
        : 'Số quen thuộc trong danh bạ và không có yêu cầu bất thường.',
      epistemicNote: 'Luôn xác minh nếu cuộc gọi bất ngờ yêu cầu chuyển tiền hoặc đọc mã OTP.',
      verificationSteps: ['Hỏi "Mã gia đình" nếu người gọi đột nhiên mượn tiền gấp.'],
    });
  }

  if (asksForUrgentMoney || normalized.startsWith('+855') || normalized.startsWith('+234')) {
    return c.json({
      phoneNumber: raw,
      normalizedNumber: normalized,
      status: normalized.startsWith('+') ? 'high_risk' : 'caution',
      badgeLabel: 'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh',
      communityReportCount: 0,
      reason: 'Số không nằm trong danh bạ kết hợp dấu hiệu thúc ép tài chính khẩn cấp.',
      epistemicNote:
        'Hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn một số là lừa đảo; hãy xác minh qua kênh độc lập.',
      verificationSteps: [
        '1. Hỏi "Mã gia đình" đã đặt trước.',
        '2. Cúp máy và gọi lại số đã lưu trong danh bạ.',
      ],
    });
  }

  return c.json({
    phoneNumber: raw,
    normalizedNumber: normalized,
    status: 'unverified',
    badgeLabel: 'Chưa xác minh',
    communityReportCount: 0,
    reason: 'Chưa có báo cáo rủi ro trong cơ sở dữ liệu cộng đồng ScamKill.',
    epistemicNote:
      'Giới hạn: hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn một số là lừa đảo; khi dữ liệu chưa đủ, ứng dụng hiển thị "Chưa xác minh".',
    verificationSteps: [
      'Tuyệt đối không đọc mã OTP và không chuyển tiền nếu chưa hỏi người thân.',
    ],
  });
});

app.get('/reports', async (c) => {
  const reports = await listReports(c.env?.DB, 10);
  return c.json({ ok: true, count: reports.length, reports });
});

app.post('/reports', async (c) => {
  const rawBody: unknown = await c.req.json().catch(() => ({}));
  const body =
    rawBody && typeof rawBody === 'object' ? (rawBody as Record<string, unknown>) : {};
  const phoneNumber =
    typeof body.phoneWatched === 'string' ? body.phoneWatched.trim().slice(0, 32) : '';
  const description = typeof body.summary === 'string' ? body.summary.trim().slice(0, 400) : '';
  const category =
    typeof body.category === 'string' ? body.category.slice(0, 40) : 'community_report';

  if (!phoneNumber || description.length < 4) {
    return c.json({ error: 'Vui lòng nhập số điện thoại và mô tả ngắn.' }, 400);
  }
  const row = {
    id: generateId(12),
    reporterName: null,
    phoneNumber,
    channel: 'phone',
    category,
    description,
    status: 'high_risk',
    createdAt: Date.now(),
  };
  await createReport(c.env?.DB, row);
  return c.json({ ok: true, report: row }, 201);
});

export const ALL: APIRoute = async (context) => {
  return app.fetch(context.request, cfEnv);
};
