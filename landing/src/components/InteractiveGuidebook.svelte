<script lang="ts">
  import gsap from 'gsap';
  import { animate } from 'motion';
  import { onMount, tick } from 'svelte';
  import { subscribeLang, type Lang } from '../lib/i18n';

  type Persona = 'senior' | 'family' | 'judge';
  type Bi = { en: string; vi: string };

  interface Hotspot {
    id: string;
    stepNum: number;
    number: string;
    shortTab: Bi;
    title: Bi;
    mockLabel: Bi;
    mockSub: Bi;
    arrowNote: Bi;
    arrowIcon: string;
    whatToTap: Bi;
    detail: Record<Persona, Bi>;
    pwaHref: string;
    bx: number;
    by: number;
  }

  const personas: { key: Persona; icon: string; label: Bi }[] = [
    { key: 'senior', icon: 'lucide:user-round-check', label: { en: 'For older adults', vi: 'Dành cho người cao tuổi' } },
    { key: 'family', icon: 'lucide:users-round', label: { en: 'For adult children', vi: 'Dành cho con cháu' } },
    { key: 'judge', icon: 'lucide:scale', label: { en: 'For competition judges', vi: 'Dành cho giám khảo' } },
  ];

  const hotspots: Hotspot[] = [
    {
      id: 'call',
      stepNum: 1,
      number: '1',
      shortTab: { en: '1. Call Shield', vi: '1. Cảnh báo Gọi' },
      title: { en: 'Step 1: Check the Caller Risk Before Pickup', vi: 'Bước 1: Xem nhãn rủi ro trước khi bắt máy' },
      mockLabel: { en: 'Incoming Call: 0918 765 432 · Unverified', vi: 'Cuộc gọi đến: 0918 765 432 · Chưa xác minh' },
      mockSub: {
        en: 'Unknown number, not in contacts. If this caller asks for urgent money, pause and verify.',
        vi: 'Số lạ ngoài danh bạ. Nếu người này xin tiền gấp, hãy dừng lại xác minh.',
      },
      arrowIcon: 'lucide:arrow-down-right',
      arrowNote: {
        en: 'Look at this risk badge before answering the phone',
        vi: 'Nhìn nhãn màu cảnh báo này trước khi bắt máy',
      },
      whatToTap: {
        en: 'If the caller demands urgent money, tap "Check & Alert Family Now".',
        vi: 'Nếu người gọi giục chuyển tiền gấp, bấm "Kiểm tra & Báo người thân ngay".',
      },
      bx: 7,
      by: 14,
      pwaHref: 'https://scamkill-pwa.9ez.workers.dev/call_shield',
      detail: {
        senior: {
          en: 'The call screen labels an unknown number clearly and reminds you not to send money or read out an OTP code.',
          vi: 'Màn hình cuộc gọi gắn nhãn số lạ rõ ràng và nhắc Bố/Mẹ không chuyển tiền, không đọc mã OTP.',
        },
        family: {
          en: 'You see the same risk label your parent sees. No data means Unverified, never a fake all-clear.',
          vi: 'Con cháu thấy đúng nhãn rủi ro mà Bố/Mẹ thấy. Chưa có dữ liệu thì hiện Chưa xác minh, không đoán bừa.',
        },
        judge: {
          en: 'Deterministic checks run first: community reports, authorized sources, and structural call signals (foreign prefix, burst calls, contact presence).',
          vi: 'Kiểm tra tất định chạy trước: báo cáo cộng đồng, nguồn công khai và tín hiệu cấu trúc cuộc gọi.',
        },
      },
    },
    {
      id: 'pause',
      stepNum: 2,
      number: '2',
      shortTab: { en: '2. 60s Pause', vi: '2. Dừng 60 giây' },
      title: { en: 'Step 2: 60-Second Breathing Pause (Brain Reset)', vi: 'Bước 2: Khoảng dừng 60 giây (Hạ nhịp tim)' },
      mockLabel: { en: '00:59 · Breathe in 4s · out 4s', vi: '00:59 · Hít vào 4 giây · thở ra 4 giây' },
      mockSub: {
        en: 'Hold off opening your banking app while the green breathing circle paces your breath.',
        vi: 'Khoan mở ứng dụng ngân hàng trong lúc vòng tròn xanh dẫn nhịp hít thở.',
      },
      arrowIcon: 'lucide:arrow-down-left',
      arrowNote: {
        en: 'Follow the 4-second inhale / 4-second exhale ring',
        vi: 'Hít thở theo vòng tròn phồng-xẹp 4 giây',
      },
      whatToTap: {
        en: 'Wait 60 seconds with the breathing circle before touching any banking app.',
        vi: 'Dừng lại 60 giây hít thở sâu trước khi chạm vào bất kỳ ứng dụng ngân hàng nào.',
      },
      bx: 91,
      by: 34,
      pwaHref: 'https://scamkill-pwa.9ez.workers.dev/call_shield',
      detail: {
        senior: {
          en: 'A calm breathing ring expands for 4 seconds and contracts for 4 seconds so fear and urgency fade away.',
          vi: 'Vòng thở mở rộng 4 giây và thu lại 4 giây giúp Bố/Mẹ bình tĩnh, cắt cơn hoảng loạn.',
        },
        family: {
          en: 'The pause triggers automatically on high-risk calls, plus a 48-hour cooling-off reminder for large transfers.',
          vi: 'Khoảng dừng tự bật khi gặp cuộc gọi rủi ro cao, kèm lời nhắc trì hoãn 48 giờ với giao dịch lớn.',
        },
        judge: {
          en: 'Neuroscience (Amygdala Hijack Interruption): 4s/4s paced breathing lowers sympathetic arousal so the prefrontal cortex re-engages.',
          vi: 'Khoa học thần kinh: nhịp thở 4s/4s kích hoạt thần kinh đối giao cảm, giúp vùng não lý trí hoạt động trở lại.',
        },
      },
    },
    {
      id: 'safe-word',
      stepNum: 3,
      number: '3',
      shortTab: { en: '3. Family Code', vi: '3. Mã gia đình' },
      title: { en: 'Step 3: Ask the Secret Family Safe-Word', vi: 'Bước 3: Hỏi "Mã gia đình" chống giả giọng AI' },
      mockLabel: { en: 'Family Code: "Sweet starfruit (Cây khế ngọt)"', vi: 'Mã gia đình: "Cây khế ngọt"' },
      mockSub: {
        en: '(i) Ask for the family secret phrase. (ii) Hang up and call back the number saved in contacts.',
        vi: '(i) Hỏi mật khẩu riêng của gia đình. (ii) Cúp máy và gọi lại theo số đã lưu trong danh bạ.',
      },
      arrowIcon: 'lucide:arrow-down-right',
      arrowNote: {
        en: 'Read your family phrase here and ask the caller to say it',
        vi: 'Xem mật khẩu nhà mình tại đây và yêu cầu người gọi trả lời',
      },
      whatToTap: {
        en: 'Ask the caller for the phrase; if they hesitate, hang up and dial their saved contact.',
        vi: 'Hỏi người gọi mật khẩu này; nếu họ ấp úng, hãy cúp máy và gọi lại số đã lưu.',
      },
      bx: 7,
      by: 54,
      pwaHref: 'https://scamkill-pwa.9ez.workers.dev/trusted_circle',
      detail: {
        senior: {
          en: 'Even if AI clones your child’s voice from a video, the scammer cannot know your private family password.',
          vi: 'Dù AI có sao chép giọng giống hệt con cháu, kẻ lừa đảo cũng không thể biết mật khẩu riêng của nhà mình.',
        },
        family: {
          en: 'Set a memorable household phrase together in 10 seconds on the Family tab.',
          vi: 'Con cháu cùng Bố/Mẹ đặt một cụm từ dễ nhớ ngay tại mục Gia đình chỉ trong 10 giây.',
        },
        judge: {
          en: 'Gollwitzer Implementation Intention: a deterministic 2-step verification protocol that works today without raw OS call-audio hooks.',
          vi: 'Quy trình xác minh 2 bước tất định, triển khai ngay trong MVP mà không cần quyền thu âm cuộc gọi hệ điều hành.',
        },
      },
    },
    {
      id: 'alert',
      stepNum: 4,
      number: '4',
      shortTab: { en: '4. 1-Tap SOS', vi: '4. Báo Gia đình' },
      title: { en: 'Step 4: One-Tap Multi-Bot Family Alert', vi: 'Bước 4: Báo cho con cháu 1 chạm qua SMS, Zalo, Telegram' },
      mockLabel: { en: 'Alert family in one tap (SMS · Zalo · Telegram)', vi: 'Báo gia đình 1 chạm (SMS · Zalo · Telegram)' },
      mockSub: {
        en: 'Dispatches alert type, time, and phone number immediately so a relative can call back within minutes.',
        vi: 'Bắn ngay loại cảnh báo, thời điểm và số điện thoại để con cháu gọi lại hỗ trợ trong vài phút.',
      },
      arrowIcon: 'lucide:arrow-up-left',
      arrowNote: {
        en: 'Tap this yellow button to notify your trusted relatives at once',
        vi: 'Chạm nút màu vàng này để báo ngay cho con cháu',
      },
      whatToTap: {
        en: 'Tap "Alert family in one tap" to notify SMS, Zalo, and Telegram simultaneously.',
        vi: 'Chạm "Báo gia đình trong 1 chạm" để gửi đồng thời qua SMS, Zalo và Telegram.',
      },
      bx: 91,
      by: 71,
      pwaHref: 'https://scamkill-pwa.9ez.workers.dev/trusted_circle',
      detail: {
        senior: {
          en: 'One tap tells your children that a suspicious call or message just arrived, so you never decide alone.',
          vi: 'Chỉ một chạm là con cháu biết Bố/Mẹ đang gặp cuộc gọi khả nghi để gọi về kiểm tra cùng.',
        },
        family: {
          en: 'You receive an instant card on Telegram/Zalo/SMS with 1-tap buttons: "Call Mom back now" or "Confirm safe".',
          vi: 'Con cháu nhận thẻ cảnh báo tức thì kèm nút phản hồi nhanh: "Gọi lại cho Mẹ ngay" hoặc "Xác nhận an toàn".',
        },
        judge: {
          en: 'Multi-Bot Hub fan-out (live Telegram Bot HTTP API + simulated Zalo OA & SMS gateway + in-app Family Inbox).',
          vi: 'Hệ thống Multi-Bot gửi song song qua Telegram API thật và cổng mô phỏng Zalo OA / SMS kèm Hộp thư trực tiếp.',
        },
      },
    },
    {
      id: 'privacy',
      stepNum: 5,
      number: '5',
      shortTab: { en: '5. Privacy Gate', vi: '5. Quyền riêng tư' },
      title: { en: 'Step 5: Consent-First Privacy Gate (PDPD 2025)', vi: 'Bước 5: Cổng đồng ý bảo vệ quyền riêng tư (PDPD 2025)' },
      mockLabel: { en: '[ ] Share call content (Off by default)', vi: '[ ] Chia sẻ nội dung cuộc gọi (Tắt mặc định)' },
      mockSub: {
        en: 'By default, alerts send ONLY alert type, timestamp, and phone number. Content is shared only if ticked.',
        vi: 'Mặc định chỉ gửi loại cảnh báo, thời điểm và SĐT. Nội dung tin nhắn chỉ gửi khi người cao tuổi đồng ý.',
      },
      arrowIcon: 'lucide:arrow-up-right',
      arrowNote: {
        en: 'Unchecked by default to protect the senior’s dignity and privacy',
        vi: 'Mặc định không tích chọn để tôn trọng quyền riêng tư của Bố/Mẹ',
      },
      whatToTap: {
        en: 'Leave unchecked for metadata-only alerts, or tick only when you want family to read the message.',
        vi: 'Để trống nếu chỉ muốn báo tin, hoặc tích chọn khi muốn con cháu đọc giúp nội dung tin nhắn.',
      },
      bx: 7,
      by: 88,
      pwaHref: 'https://scamkill-pwa.9ez.workers.dev/trusted_circle',
      detail: {
        senior: {
          en: 'Your private messages stay private. Family only sees the message text when you choose to share it.',
          vi: 'Tin nhắn riêng tư của Bố/Mẹ luôn được giữ kín. Con cháu chỉ thấy nội dung khi Bố/Mẹ đồng ý chia sẻ.',
        },
        family: {
          en: 'Protects your parent without making them feel surveilled, increasing long-term trust and adoption.',
          vi: 'Bảo vệ Bố/Mẹ nhưng không tạo cảm giác bị giám sát, giúp ông bà thoải mái sử dụng lâu dài.',
        },
        judge: {
          en: 'Strict compliance with Vietnam PDPD 2025 & Decree 356/2025: `sharedContent: null` when `consentToShareContent: false`, plus PII redaction.',
          vi: 'Tuân thủ Luật Bảo vệ dữ liệu cá nhân 2025: ẩn hoàn toàn nội dung khi chưa bật đồng ý và tự động che CCCD/OTP.',
        },
      },
    },
  ];

  let lang = $state<Lang>('en');
  let persona = $state<Persona>('senior');
  let zoom = $state<number>(1);
  // Default to Step 1 ('call') immediately so the user never sees a blank "Start anywhere" state!
  let activeId = $state<string>('call');
  let autoTour = $state<boolean>(false);

  let stageEl = $state<HTMLDivElement>();
  let lensEl = $state<HTMLDivElement>();
  let cardEl = $state<HTMLElement>();
  let loupeEl = $state<HTMLDivElement>();
  let svgW = $state(1000);
  let svgH = $state(640);
  let arrows = $state<{ id: string; d: string }[]>([]);

  const active = $derived(hotspots.find((h) => h.id === activeId) ?? hotspots[0]);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $effect(() => subscribeLang((next) => (lang = next)));

  $effect(() => {
    activeId;
    zoom;
    if (reduced) return;
    if (cardEl) animate(cardEl, { opacity: [0.55, 1] }, { duration: 0.28 });
    if (loupeEl) {
      gsap.fromTo(
        loupeEl,
        { scale: 0.96, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' },
      );
    }
  });

  $effect(() => {
    if (!autoTour) return;
    const id = window.setInterval(() => {
      stepBy(1, true);
    }, 3400);
    return () => window.clearInterval(id);
  });

  function offsetIn(element: HTMLElement, root: HTMLElement) {
    let x = 0;
    let y = 0;
    let node: HTMLElement | null = element;
    while (node && node !== root) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
    }
    return { x, y };
  }

  function measure() {
    if (!stageEl || !lensEl) return;
    const width = lensEl.clientWidth;
    const height = lensEl.clientHeight;
    if (width === 0 || height === 0) return;
    svgW = width;
    svgH = height;

    const next: { id: string; d: string }[] = [];
    for (const hotspot of hotspots) {
      const target = stageEl.querySelector<HTMLElement>(`[data-feature="${hotspot.id}"]`);
      const bubble = stageEl.querySelector<HTMLElement>(`[data-hotspot="${hotspot.id}"]`);
      if (!target || !bubble) continue;
      const targetPoint = offsetIn(target, lensEl);
      const bubblePoint = offsetIn(bubble, lensEl);
      const tx = targetPoint.x + target.offsetWidth / 2;
      const ty = targetPoint.y + target.offsetHeight / 2;
      const bx = bubblePoint.x + bubble.offsetWidth / 2;
      const by = bubblePoint.y + bubble.offsetHeight / 2;
      const dx = tx - bx;
      const dy = ty - by;
      const halfW = target.offsetWidth / 2;
      const halfH = target.offsetHeight / 2;
      const borderScale = Math.min(
        dx === 0 ? Number.POSITIVE_INFINITY : halfW / Math.abs(dx),
        dy === 0 ? Number.POSITIVE_INFINITY : halfH / Math.abs(dy),
      );
      const angle = Math.atan2(dy, dx);
      const ex = tx - dx * borderScale - Math.cos(angle) * 8;
      const ey = ty - dy * borderScale - Math.sin(angle) * 8;
      const c1x = bx + (ex - bx) * 0.42;
      const c1y = by;
      const c2x = bx + (ex - bx) * 0.62;
      const c2y = ey;
      next.push({ id: hotspot.id, d: `M ${bx} ${by} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}` });
    }
    arrows = next;
  }

  async function drawArrows(shouldAnimate: boolean) {
    await tick();
    const paths = stageEl?.querySelectorAll<SVGPathElement>('.guide-arrow');
    if (!paths) return;
    paths.forEach((path) => {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });
    if (!shouldAnimate || reduced) return;
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power2.out',
    });
  }

  function focus(hotspot: Hotspot, fromAuto = false) {
    if (!fromAuto) autoTour = false;
    activeId = hotspot.id;
  }

  function stepBy(delta: 1 | -1, fromAuto = false) {
    if (!fromAuto) autoTour = false;
    const idx = hotspots.findIndex((h) => h.id === activeId);
    const nextIdx = (idx + delta + hotspots.length) % hotspots.length;
    activeId = hotspots[nextIdx].id;
  }

  function setZoom(next: number) {
    zoom = next;
  }

  onMount(() => {
    measure();
    void drawArrows(true);

    const observer = new ResizeObserver(() => {
      measure();
    });
    if (stageEl) observer.observe(stageEl);

    return () => observer.disconnect();
  });

  $effect(() => {
    lang;
    const id = window.setTimeout(measure, 80);
    return () => window.clearTimeout(id);
  });

  const zoomScaleStyle = $derived(
    zoom === 1 ? 'font-size: 100%;' : zoom === 1.5 ? 'font-size: 118%;' : 'font-size: 135%;',
  );
</script>

<div class="rounded-3xl border border-ink-900/15 bg-white p-5 shadow-xl shadow-ink-900/5 sm:p-7">
  <!-- Top Bar: Heading + 3 Persona Tabs -->
  <div class="flex flex-wrap items-start justify-between gap-4 border-b border-ink-900/10 pb-5">
    <div class="max-w-xl">
      <h3 class="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
        {lang === 'en'
          ? 'Interactive Step-by-Step Spotlight Guide'
          : 'Cẩm nang Điểm sáng Tương tác Từng bước'}
      </h3>
      <p class="mt-1.5 text-base leading-relaxed text-ink-600">
        {lang === 'en'
          ? 'Click Steps 1 to 5 (or press Auto-Play) to follow the arrows, inspect the Magnifier Loupe, and launch each feature live.'
          : 'Chạm Bước 1 đến 5 (hoặc bấm Tự chạy) để theo dõi mũi tên chỉ dẫn, xem kính lúp phóng to và mở thử trực tiếp từng tính năng.'}
      </p>
    </div>

    <div
      class="inline-flex flex-wrap rounded-2xl border border-ink-900/10 bg-cream-50 p-1.5 gap-1"
      role="tablist"
      aria-label="Persona"
    >
      {#each personas as item}
        <button
          type="button"
          role="tab"
          aria-selected={persona === item.key}
          onclick={() => (persona = item.key)}
          class={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-[0.98] ${
            persona === item.key
              ? 'bg-ink-900 text-cream-50 shadow-sm'
              : 'text-ink-700 hover:bg-white'
          }`}
        >
          <iconify-icon icon={item.icon} width="16" height="16"></iconify-icon>
          <span>{item.label[lang]}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Stepper Bar: 5 Step Pills + Auto-Play Tour + Loupe Zoom (1.0x / 1.5x / 2.0x) -->
  <div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50/70 p-3">
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Guidebook steps">
      {#each hotspots as h}
        <button
          type="button"
          onclick={() => focus(h)}
          aria-pressed={activeId === h.id}
          class={`min-h-10 rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-[0.97] ${
            activeId === h.id
              ? 'bg-jade-600 text-white shadow-sm'
              : 'bg-white text-ink-800 border border-ink-900/10 hover:border-jade-600'
          }`}
        >
          {h.shortTab[lang]}
        </button>
      {/each}
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onclick={() => (autoTour = !autoTour)}
        aria-pressed={autoTour}
        class={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition active:scale-[0.97] ${
          autoTour
            ? 'bg-amber-500 text-ink-950'
            : 'bg-white text-jade-700 border border-jade-600/30 hover:bg-jade-600/10'
        }`}
      >
        <iconify-icon
          icon={autoTour ? 'lucide:pause' : 'lucide:play'}
          width="14"
          height="14"
          aria-hidden="true"
        ></iconify-icon>
        {autoTour
          ? lang === 'en'
            ? 'Pause Auto-Tour'
            : 'Dừng tự chạy'
          : lang === 'en'
            ? 'Auto-Play 5 Steps'
            : 'Tự chạy 5 bước'}
      </button>

      <div class="inline-flex items-center gap-1 rounded-xl border border-ink-900/10 bg-white p-1" role="group" aria-label="Magnifier zoom">
        <span class="inline-flex items-center gap-1 px-2 text-xs font-bold text-ink-600">
          <iconify-icon icon="lucide:zoom-in" width="15" height="15"></iconify-icon>
          {lang === 'en' ? 'Loupe:' : 'Kính lúp:'}
        </span>
        {#each [1, 1.5, 2] as level}
          <button
            type="button"
            onclick={() => setZoom(level)}
            aria-pressed={zoom === level}
            class={`min-h-8 rounded-lg px-2.5 font-mono text-xs font-bold transition active:scale-[0.97] ${
              zoom === level ? 'bg-jade-600 text-white' : 'text-ink-700 hover:bg-cream-50'
            }`}
          >
            {level.toFixed(1)}x
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main 2-Column Interactive Stage -->
  <div class="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
    <!-- LEFT: Unclipped Annotated Phone Screen with Curved SVG Arrows & Pulsing Badges -->
    <div
      bind:this={stageEl}
      class="relative overflow-hidden rounded-2xl border border-ink-900/15 bg-[#eef2ee] p-4 sm:p-6"
    >
      <div bind:this={lensEl} class="relative min-h-[520px] w-full">
        <!-- Phone Mockup (never clips its own edges; dims inactive steps so active step pops out!) -->
        <div
          class="guide-mock relative z-10 mx-auto max-w-[360px] rounded-[30px] border-2 border-ink-900 bg-ink-950 p-4 text-cream-50 shadow-2xl"
        >
          <div class="flex items-center justify-between text-xs text-cream-50/60">
            <span class="font-semibold">ScamKill</span>
            <span class="font-mono">14:31</span>
          </div>

          <!-- 1 Pre-Call Risk Shield -->
          <button
            type="button"
            data-feature="call"
            onclick={() => focus(hotspots[0])}
            class={`mt-3 w-full rounded-2xl border p-3.5 text-left transition duration-300 ${
              activeId === 'call'
                ? 'scale-[1.03] border-amber-400 bg-amber-400/20 ring-4 ring-amber-400/30 shadow-lg'
                : 'border-amber-400/30 bg-amber-400/10 opacity-50 hover:opacity-85'
            }`}
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-base font-bold text-cream-50">0918 765 432</span>
              <span class="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-extrabold text-ink-950">
                {lang === 'en' ? '1 Unverified' : '1 Chưa xác minh'}
              </span>
            </div>
            <p class="mt-1 text-xs text-cream-50/85">
              {lang === 'en' ? 'Unknown number. Do not send money.' : 'Số lạ ngoài danh bạ. Không chuyển tiền.'}
            </p>
          </button>

          <!-- 2 60-Second Breathing Pause -->
          <button
            type="button"
            data-feature="pause"
            onclick={() => focus(hotspots[1])}
            class={`mt-3 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition duration-300 ${
              activeId === 'pause'
                ? 'scale-[1.03] border-jade-400 bg-jade-600/35 ring-4 ring-jade-400/30 shadow-lg'
                : 'border-jade-500/35 bg-jade-700/20 opacity-50 hover:opacity-85'
            }`}
          >
            <span class="grid size-10 shrink-0 place-items-center rounded-full border-2 border-jade-400 font-mono text-xs font-extrabold text-jade-300">
              00:59
            </span>
            <div>
              <p class="text-sm font-bold text-cream-50">
                {lang === 'en' ? '2 Pause for 60 seconds' : '2 Dừng lại 60 giây'}
              </p>
              <p class="text-xs text-cream-50/75">
                {lang === 'en' ? 'Breathe in 4s · out 4s' : 'Hít vào 4s · thở ra 4s'}
              </p>
            </div>
          </button>

          <!-- 3 Family Safe-Word -->
          <button
            type="button"
            data-feature="safe-word"
            onclick={() => focus(hotspots[2])}
            class={`mt-3 w-full rounded-2xl border p-3.5 text-left transition duration-300 ${
              activeId === 'safe-word'
                ? 'scale-[1.03] border-amber-400 bg-white/15 ring-4 ring-amber-400/30 shadow-lg'
                : 'border-white/15 bg-white/5 opacity-50 hover:opacity-85'
            }`}
          >
            <p class="font-mono text-[11px] font-bold uppercase tracking-wider text-cream-50/70">
              {lang === 'en' ? '3 FAMILY CODE ON FILE' : '3 MÃ GIA ĐÌNH ĐÃ LƯU'}
            </p>
            <p class="mt-1 font-display text-lg font-bold text-amber-300">
              {lang === 'en' ? '“Sweet starfruit (Cây khế ngọt)”' : '“Cây khế ngọt”'}
            </p>
          </button>

          <!-- 4 1-Tap Family Alert -->
          <button
            type="button"
            data-feature="alert"
            onclick={() => focus(hotspots[3])}
            class={`mt-3 w-full rounded-2xl p-3.5 text-left text-ink-950 transition duration-300 ${
              activeId === 'alert'
                ? 'scale-[1.03] bg-amber-400 ring-4 ring-amber-300/60 shadow-lg'
                : 'bg-amber-400/75 opacity-55 hover:opacity-90'
            }`}
          >
            <p class="text-sm font-extrabold">
              {lang === 'en' ? '4 Alert family in one tap' : '4 Báo gia đình trong một chạm'}
            </p>
            <p class="mt-0.5 font-mono text-xs font-bold text-ink-900/80">
              SMS · Zalo · Telegram
            </p>
          </button>

          <!-- 5 Consent Gate -->
          <button
            type="button"
            data-feature="privacy"
            onclick={() => focus(hotspots[4])}
            class={`mt-3 flex w-full items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition duration-300 ${
              activeId === 'privacy'
                ? 'scale-[1.03] border-amber-400 bg-white/15 text-cream-50 ring-4 ring-amber-400/30 shadow-lg'
                : 'border-white/15 bg-white/5 text-cream-50/75 opacity-55 hover:opacity-90'
            }`}
          >
            <span class="inline-block size-4 shrink-0 rounded border border-cream-50/60 bg-white"></span>
            <span>
              {lang === 'en'
                ? '5 Share call content (off by default)'
                : '5 Chia sẻ nội dung cuộc gọi (tắt mặc định)'}
            </span>
          </button>
        </div>

        <!-- Curved SVG Callout Arrows -->
        <svg
          class="pointer-events-none absolute inset-0 z-20 h-full w-full"
          viewBox={`0 0 ${svgW} ${svgH}`}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="guide-arrow-head"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#0f766e" />
            </marker>
          </defs>
          {#each arrows as arrow (arrow.id)}
            <path
              d={arrow.d}
              fill="none"
              stroke={activeId === arrow.id ? '#0f766e' : '#0f766e55'}
              stroke-width={activeId === arrow.id ? '3.2' : '1.8'}
              stroke-linecap="round"
              marker-end="url(#guide-arrow-head)"
              class="guide-arrow transition-all duration-300"
            />
          {/each}
        </svg>

        <!-- Numbered Callout Circles 1..5 -->
        {#each hotspots as hotspot (hotspot.id)}
          <button
            type="button"
            data-hotspot={hotspot.id}
            style={`left: ${hotspot.bx}%; top: ${hotspot.by}%;`}
            onclick={() => focus(hotspot)}
            aria-label={`${hotspot.number} ${hotspot.title[lang]}`}
            aria-pressed={activeId === hotspot.id}
            class={`group absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full transition focus:outline-none ${
              activeId === hotspot.id ? 'scale-125' : 'hover:scale-110'
            }`}
          >
            <span
              class={`pulse-ring absolute inset-0 rounded-full ${
                activeId === hotspot.id ? 'bg-jade-500/45' : 'bg-amber-400/25'
              }`}
              aria-hidden="true"
            ></span>
            <span
              class={`relative grid size-11 place-items-center rounded-full border-2 border-white font-display text-lg font-extrabold shadow-lg ${
                activeId === hotspot.id
                  ? 'bg-jade-600 text-white ring-4 ring-jade-600/30'
                  : 'bg-amber-400 text-ink-950'
              }`}
            >
              {hotspot.number}
            </span>
          </button>
        {/each}
      </div>
    </div>

    <!-- RIGHT: Active Step Magnified Loupe + Persona Explanation + Prev/Next + Live Launch -->
    <aside
      bind:this={cardEl}
      class="flex flex-col justify-between rounded-2xl border-2 border-jade-600/25 bg-cream-50/75 p-5 sm:p-6"
      aria-live="polite"
    >
      <div>
        <!-- Step Header -->
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 rounded-full bg-jade-600 px-3 py-1 font-mono text-xs font-extrabold text-white">
            {active.number}
            {lang === 'en' ? `STEP ${active.stepNum} OF 5` : `BƯỚC ${active.stepNum} / 5`}
          </span>
          <span class="inline-flex items-center gap-1 font-mono text-xs font-bold text-jade-700">
            <iconify-icon icon="lucide:zoom-in" width="15" height="15"></iconify-icon>
            {zoom.toFixed(1)}x {lang === 'en' ? 'Magnifier' : 'Kính lúp'}
          </span>
        </div>

        <h4 class="mt-3 font-display text-xl font-bold text-ink-900 sm:text-2xl">
          {active.title[lang]}
        </h4>

        <!-- UNCLIPPED MAGNIFIER LOUPE CLOSE-UP BOX (scales text cleanly at 1.0x / 1.5x / 2.0x!) -->
        <div
          bind:this={loupeEl}
          style={zoomScaleStyle}
          class="mt-4 rounded-2xl border-2 border-jade-600 bg-white p-4 shadow-md"
        >
          <p class="flex items-center gap-1.5 font-mono text-[0.72em] font-extrabold uppercase tracking-wider text-jade-700">
            <iconify-icon icon={active.arrowIcon} width="15" height="15"></iconify-icon>
            {active.arrowNote[lang]}
          </p>
          <p class="mt-1.5 font-display text-[1.1em] font-extrabold text-ink-950">
            {active.mockLabel[lang]}
          </p>
          <p class="mt-1 text-[0.92em] leading-relaxed text-ink-700">
            {active.mockSub[lang]}
          </p>
        </div>

        <!-- What to Tap + Persona-Specific Explanation -->
        <div class="mt-4 space-y-3">
          <div class="rounded-xl border border-amber-500/30 bg-amber-50/80 p-3.5">
            <p class="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-900">
              <iconify-icon icon="lucide:pointer" width="15" height="15"></iconify-icon>
              {lang === 'en' ? 'What to tap' : 'Thao tác cần bấm'}
            </p>
            <p class="mt-1 text-sm font-semibold leading-relaxed text-ink-900">
              {active.whatToTap[lang]}
            </p>
          </div>

          <div class="rounded-xl border border-ink-900/10 bg-white p-3.5">
            <p class="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jade-700">
              <iconify-icon icon="lucide:brain" width="15" height="15"></iconify-icon>
              {personas.find((p) => p.key === persona)?.label[lang]}
            </p>
            <p class="mt-1 text-sm leading-relaxed text-ink-800">
              {active.detail[persona][lang]}
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Actions: Try Step Live in PWA + Prev/Next Stepper -->
      <div class="mt-6 space-y-3 border-t border-ink-900/10 pt-4">
        <a
          href={active.pwaHref}
          target="_blank"
          rel="noopener"
          class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-jade-600 px-4 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-jade-700 active:scale-[0.99]"
        >
          <iconify-icon icon="lucide:zap" width="16" height="16"></iconify-icon>
          <span>
            {lang === 'en'
              ? `Try Step ${active.stepNum} Live in the PWA App`
              : `Mở thử trực tiếp Bước ${active.stepNum} trong PWA`}
          </span>
          <iconify-icon icon="lucide:arrow-right" width="16" height="16"></iconify-icon>
        </a>

        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            onclick={() => stepBy(-1)}
            class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-ink-900/15 bg-white px-3.5 py-2 text-xs font-extrabold text-ink-800 transition hover:border-jade-600"
          >
            <iconify-icon icon="lucide:arrow-left" width="15" height="15"></iconify-icon>
            {lang === 'en' ? 'Previous' : 'Bước trước'}
          </button>

          <span class="font-mono text-xs font-extrabold text-ink-600">
            {active.stepNum} / 5
          </span>

          <button
            type="button"
            onclick={() => stepBy(1)}
            class="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-jade-600 bg-white px-3.5 py-2 text-xs font-extrabold text-jade-700 transition hover:bg-jade-600 hover:text-white"
          >
            {lang === 'en' ? 'Next Step' : 'Bước tiếp'}
            <iconify-icon icon="lucide:arrow-right" width="15" height="15"></iconify-icon>
          </button>
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  .pulse-ring {
    animation: guide-pulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  }

  @keyframes guide-pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    70% {
      transform: scale(1.65);
      opacity: 0;
    }
    100% {
      transform: scale(1.65);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse-ring {
      animation: none;
    }
  }
</style>
