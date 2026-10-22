import React, { useState, useEffect } from 'react';
import {
  Outlet,
  RouterProvider,
  Link,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

interface CallCheckResponse {
  phoneNumber: string;
  status: 'high_risk' | 'caution' | 'unverified' | 'safe';
  badgeLabel: string;
  communityReportCount: number;
  reason: string;
  epistemicNote: string;
  verificationSteps: string[];
}

function RootLayout() {
  return (
    <div className="rounded-3xl border-2 border-[#0B5D56]/25 bg-[#FFFDF9] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DFD6C3] pb-5">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0B5D56]/10 px-3 py-1 text-xs font-bold text-[#0B5D56]">
            ⚡ TanStack Router SPA Island · Hono Edge API · Astro 6 Actions · tsrs
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-[#18181B]">
            Trung tâm Điều phối Gia đình ScamKill
          </h2>
          <p className="text-sm text-[#3F3F46]">
            Chuyển trang tức thì ngay trong React Island mà không tải lại trang Astro
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Điều hướng trung tâm gia đình">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'bg-[#0B5D56] text-[#FAF6EE]' }}
            inactiveProps={{ className: 'bg-[#F1EBDD] text-[#18181B] hover:bg-[#E4DBC6]' }}
            className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition">
            1. Vòng bảo vệ & Mã gia đình
          </Link>
          <Link
            to="/calls"
            activeProps={{ className: 'bg-[#0B5D56] text-[#FAF6EE]' }}
            inactiveProps={{ className: 'bg-[#F1EBDD] text-[#18181B] hover:bg-[#E4DBC6]' }}
            className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition">
            2. Tra cứu Số gọi (Hono Edge)
          </Link>
          <Link
            to="/bots"
            activeProps={{ className: 'bg-[#0B5D56] text-[#FAF6EE]' }}
            inactiveProps={{ className: 'bg-[#F1EBDD] text-[#18181B] hover:bg-[#E4DBC6]' }}
            className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition">
            3. Nhật ký Bot (SMS / Zalo / Telegram)
          </Link>
        </nav>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

function OverviewView() {
  const [safeWord, setSafeWord] = useState('Cây khế ngọt');
  const [savedNotice, setSavedNotice] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(`Đã cập nhật Mã gia đình "${safeWord}" cho Bố/Mẹ.`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-[#DFD6C3] bg-[#FAF6EE] p-5">
        <h3 className="text-lg font-extrabold text-[#18181B]">
          Trạng thái người cao tuổi được bảo vệ
        </h3>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between rounded-xl bg-[#FFFDF9] p-3.5 border border-[#DFD6C3]">
            <div>
              <p className="font-bold text-[#18181B]">Bà Nguyễn Thị Lan (68 tuổi)</p>
              <p className="text-sm text-[#3F3F46]">Đã cài PWA · Tự động bật Làm chậm 60s</p>
            </div>
            <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-extrabold text-[#15803D]">
              Đang bảo vệ
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[#FFFDF9] p-3.5 border border-[#DFD6C3]">
            <div>
              <p className="font-bold text-[#18181B]">Chị Hương (Con gái — Người nhận cảnh báo)</p>
              <p className="text-sm text-[#3F3F46]">Kênh nhận: Telegram · Zalo · SMS</p>
            </div>
            <span className="rounded-full bg-[#0B5D56]/10 px-3 py-1 text-xs font-extrabold text-[#0B5D56]">
              Đã kết nối
            </span>
          </li>
        </ul>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#DFD6C3] bg-[#FAF6EE] p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[#18181B]">
            Mã gia đình chống giả giọng AI (Deepfake)
          </h3>
          <p className="mt-1 text-sm text-[#3F3F46]">
            Khi có người lạ gọi tự xưng là con cháu mượn tiền gấp, ScamKill nhắc Bà Lan hỏi mật khẩu này trước tiên.
          </p>
          <label className="mt-4 block text-sm font-bold text-[#18181B]">
            Từ khóa bí mật của gia đình:
            <input
              type="text"
              value={safeWord}
              onChange={(e) => setSafeWord(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#DFD6C3] bg-[#FFFDF9] px-4 py-3 font-mono text-base font-bold text-[#0B5D56]"
            />
          </label>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-[#0B5D56] px-5 py-3 text-sm font-extrabold text-[#FAF6EE] transition hover:bg-[#084741]">
            Lưu Mã gia đình
          </button>
          {savedNotice ? (
            <p className="mt-2 text-sm font-bold text-[#15803D]">{savedNotice}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function EdgeCallCheckView() {
  const [phone, setPhone] = useState('0918 765 432');
  const [urgentMoney, setUrgentMoney] = useState(true);
  const [inContacts, setInContacts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallCheckResponse | null>(null);

  const runCheck = async (targetPhone = phone, targetUrgent = urgentMoney, targetContacts = inContacts) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/call-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: targetPhone,
          asksForUrgentMoney: targetUrgent,
          inContacts: targetContacts,
        }),
      });
      const data: CallCheckResponse = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runCheck('0918 765 432', true, false);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setPhone('0918 765 432');
            setUrgentMoney(true);
            setInContacts(false);
            void runCheck('0918 765 432', true, false);
          }}
          className="rounded-xl border border-[#DFD6C3] bg-[#FAF6EE] px-3.5 py-2 text-xs font-bold text-[#18181B] hover:border-[#0B5D56]">
          👵 Kịch bản Bà Lan (0918 765 432)
        </button>
        <button
          type="button"
          onClick={() => {
            setPhone('02477778888');
            setUrgentMoney(true);
            setInContacts(false);
            void runCheck('02477778888', true, false);
          }}
          className="rounded-xl border border-[#DFD6C3] bg-[#FAF6EE] px-3.5 py-2 text-xs font-bold text-[#18181B] hover:border-[#0B5D56]">
          🚨 Giả Công an (024 7777 8888)
        </button>
        <button
          type="button"
          onClick={() => {
            setPhone('0939 404 505');
            setUrgentMoney(false);
            setInContacts(false);
            void runCheck('0939 404 505', false, false);
          }}
          className="rounded-xl border border-[#DFD6C3] bg-[#FAF6EE] px-3.5 py-2 text-xs font-bold text-[#18181B] hover:border-[#0B5D56]">
          ❓ Số lạ Chưa xác minh (0939 404 505)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-bold text-[#18181B]">
          Số điện thoại gọi đến:
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#DFD6C3] bg-[#FAF6EE] px-4 py-2.5 font-mono text-base font-bold"
          />
        </label>

        <label className="flex items-center gap-2.5 text-sm font-bold text-[#18181B] pt-6">
          <input
            type="checkbox"
            checked={urgentMoney}
            onChange={(e) => setUrgentMoney(e.target.checked)}
            className="h-5 w-5 accent-[#0B5D56]"
          />
          Người gọi thúc ép chuyển tiền gấp
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void runCheck()}
            disabled={loading}
            className="min-h-[46px] w-full rounded-xl bg-[#0B5D56] px-5 py-2.5 text-sm font-extrabold text-[#FAF6EE]">
            {loading ? 'Đang kiểm tra trên Hono Edge...' : 'Kiểm tra qua Hono API (/api/v1/call-check)'}
          </button>
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl border-2 border-[#0B5D56]/30 bg-[#FAF6EE] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-lg font-extrabold text-[#18181B]">
              SĐT: {result.phoneNumber}
            </span>
            <span className="rounded-full bg-[#0B5D56] px-3.5 py-1 text-xs font-extrabold text-[#FAF6EE]">
              {result.status.toUpperCase()} · {result.communityReportCount} báo cáo
            </span>
          </div>
          <p className="mt-2 text-lg font-extrabold text-[#B91C1C]">{result.badgeLabel}</p>
          <p className="mt-1 text-sm text-[#18181B]">{result.reason}</p>
          <p className="mt-3 rounded-xl bg-[#FFFDF9] p-3 text-xs text-[#3F3F46] border border-[#DFD6C3]">
            {result.epistemicNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MultiBotLogView() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#DFD6C3] bg-[#FAF6EE] p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-[#0B5D56] px-2.5 py-1 text-xs font-extrabold text-[#FAF6EE]">
            TELEGRAM + ZALO + SMS
          </span>
          <span className="font-mono text-xs text-[#3F3F46]">Vừa xong · Kịch bản Bà Lan</span>
        </div>
        <p className="mt-2 font-bold text-[#18181B]">
          [ScamKill] Cảnh báo Nghi giả giọng người thân mượn tiền gấp · SĐT lạ: 0918 765 432
        </p>
        <p className="mt-1 text-xs text-[#3F3F46]">
          🔒 Quyền riêng tư (PDPD 2025): Chỉ gửi loại cảnh báo, thời điểm và số điện thoại. Nội dung chi tiết chỉ hiển thị khi Bà Lan bấm đồng ý chia sẻ.
        </p>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewView,
});

const callsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calls',
  component: EdgeCallCheckView,
});

const botsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bots',
  component: MultiBotLogView,
});

const routeTree = rootRoute.addChildren([indexRoute, callsRoute, botsRoute]);

export function FamilyCommandSpa({ initialPath = '/' }: { initialPath?: string }) {
  const [router] = useState(() =>
    createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: [initialPath],
      }),
    })
  );

  return <RouterProvider router={router} />;
}

export default FamilyCommandSpa;
