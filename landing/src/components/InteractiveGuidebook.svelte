<script lang="ts">
  import gsap from 'gsap';
  import { animate } from 'motion';
  import { onMount, tick } from 'svelte';
  import { subscribeLang, type Lang } from '../lib/i18n';

  type Persona = 'senior' | 'family' | 'judge';
  type Bi = { en: string; vi: string };

  interface Hotspot {
    id: string;
    number: string;
    title: Bi;
    detail: Record<Persona, Bi>;
    bx: number;
    by: number;
  }

  const personas: { key: Persona; label: Bi }[] = [
    { key: 'senior', label: { en: 'For older adults', vi: 'Dành cho người cao tuổi' } },
    { key: 'family', label: { en: 'For adult children', vi: 'Dành cho con cháu' } },
    { key: 'judge', label: { en: 'For competition judges', vi: 'Dành cho giám khảo' } },
  ];

  const hotspots: Hotspot[] = [
    {
      id: 'call',
      number: '①',
      title: { en: 'Alert before pickup', vi: 'Cảnh báo trước khi bắt máy' },
      bx: 7,
      by: 14,
      detail: {
        senior: {
          en: 'The call screen labels an unknown number as Unverified and tells you not to send money or read out a code.',
          vi: 'Màn hình cuộc gọi gắn nhãn số lạ là Chưa xác minh và nhắc bạn không chuyển tiền, không đọc mã xác thực.',
        },
        family: {
          en: 'You see the same risk label the senior sees. The label stays honest: no data means Unverified, never a fake all-clear.',
          vi: 'Bạn thấy đúng nhãn rủi ro mà người cao tuổi thấy. Nhãn luôn trung thực: không có dữ liệu thì là Chưa xác minh, không phải kết luận an toàn giả.',
        },
        judge: {
          en: 'Deterministic checks run first: community reports, authorized sources, and structural call signals. The model never fabricates certainty.',
          vi: 'Kiểm tra tất định chạy trước: báo cáo cộng đồng, nguồn được uỷ quyền và tín hiệu cấu trúc của cuộc gọi. Mô hình không bao giờ tạo ra sự chắc chắn giả.',
        },
      },
    },
    {
      id: 'pause',
      number: '②',
      title: { en: '60-second pause', vi: 'Khoảng dừng 60 giây' },
      bx: 87,
      by: 31,
      detail: {
        senior: {
          en: 'A full-screen pause with a breathing ring, four seconds in and four seconds out. Nothing moves until you choose.',
          vi: 'Màn hình dừng toàn phần với vòng thở, bốn giây hít vào và bốn giây thở ra. Không có gì tự chạy cho tới khi bạn chọn.',
        },
        family: {
          en: 'The pause fires automatically on high-risk calls, so the senior never has to remember a safety step under pressure.',
          vi: 'Khoảng dừng tự bật với cuộc gọi rủi ro cao, để người cao tuổi không phải nhớ một bước an toàn khi đang bị thúc ép.',
        },
        judge: {
          en: 'GSAP drives the ring at a fixed four-second cadence. Reduced-motion users get a still ring and the same instruction.',
          vi: 'GSAP điều khiển vòng thở theo nhịp bốn giây cố định. Người bật giảm chuyển động thấy vòng tĩnh và vẫn đọc được hướng dẫn.',
        },
      },
    },
    {
      id: 'safe-word',
      number: '③',
      title: { en: 'Family safe-word', vi: 'Mã gia đình' },
      bx: 7,
      by: 56,
      detail: {
        senior: {
          en: 'Ask for the private phrase. If the caller cannot say it, hang up and call the saved number.',
          vi: 'Hỏi cụm mật khẩu riêng. Nếu người gọi không nói được, cúp máy và gọi lại số đã lưu.',
        },
        family: {
          en: 'Set a phrase with no public trace. It is the one check an AI voice clone cannot pass.',
          vi: 'Đặt một cụm từ không xuất hiện ở đâu công khai. Đây là bước kiểm tra mà giọng AI không thể vượt qua.',
        },
        judge: {
          en: 'An implementation intention agreed in advance, stored per household, and verified without sending the phrase to a server in clear text.',
          vi: 'Một ý định nếu-thì được thống nhất trước, lưu theo từng hộ, và xác minh mà không gửi cụm từ dạng rõ lên máy chủ.',
        },
      },
    },
    {
      id: 'alert',
      number: '④',
      title: { en: 'One-tap family alert', vi: 'Cảnh báo gia đình một chạm' },
      bx: 87,
      by: 69,
      detail: {
        senior: {
          en: 'One button sends the alert to your family over SMS, Zalo, and Telegram, then shows their reply on the same screen.',
          vi: 'Một nút gửi cảnh báo tới gia đình qua SMS, Zalo và Telegram, rồi hiện câu trả lời ngay trên màn hình.',
        },
        family: {
          en: 'You receive the alert type, the time, and the number, with three actions: Call back now, Confirm safe, or Block number.',
          vi: 'Bạn nhận loại cảnh báo, thời điểm và số điện thoại, kèm ba nút: Gọi lại ngay, Xác nhận an toàn hoặc Báo chặn số.',
        },
        judge: {
          en: 'Fan-out over three channels with retries and delivery receipts. Call content is gated behind explicit consent.',
          vi: 'Gửi song song ba kênh, có thử lại và biên nhận giao. Nội dung cuộc gọi chỉ đi khi có đồng ý rõ ràng.',
        },
      },
    },
    {
      id: 'privacy',
      number: '⑤',
      title: { en: 'Consent, not surveillance', vi: 'Đồng ý, không giám sát' },
      bx: 7,
      by: 83,
      detail: {
        senior: {
          en: 'Call content is shared only when you tick the consent box. By default the alert carries metadata only.',
          vi: 'Nội dung cuộc gọi chỉ được chia sẻ khi bạn tick ô đồng ý. Mặc định cảnh báo chỉ mang thông tin mô tả.',
        },
        family: {
          en: 'You are a safety net, not a monitor. The senior decides what leaves the device.',
          vi: 'Bạn là lưới an toàn, không phải người giám sát. Người cao tuổi quyết định điều gì rời khỏi thiết bị.',
        },
        judge: {
          en: 'Minimum data by default under PDPD 2025. Audio stays on the device; only user-approved summaries leave.',
          vi: 'Tối thiểu dữ liệu theo PDPD 2025. Âm thanh ở lại thiết bị; chỉ bản tóm tắt được người dùng đồng ý mới rời đi.',
        },
      },
    },
  ];

  let lang = $state<Lang>('en');
  let persona = $state<Persona>('senior');
  let zoom = $state(1);
  let activeId = $state<string | null>(null);
  let stageEl = $state<HTMLDivElement>();
  let lensEl = $state<HTMLDivElement>();
  let cardEl = $state<HTMLElement>();
  let svgW = $state(1000);
  let svgH = $state(640);
  let arrows = $state<{ id: string; d: string }[]>([]);

  const active = $derived(hotspots.find((hotspot) => hotspot.id === activeId) ?? null);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $effect(() => subscribeLang((next) => (lang = next)));

  $effect(() => {
    activeId;
    if (!cardEl || reduced) return;
    animate(cardEl, { opacity: [0.45, 1] }, { duration: 0.32 });
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

  async function drawArrows(animate: boolean) {
    await tick();
    const paths = stageEl?.querySelectorAll<SVGPathElement>('.guide-arrow');
    if (!paths) return;
    paths.forEach((path) => {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });
    if (!animate || reduced) return;
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.1,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.15,
    });
  }

  function focus(hotspot: Hotspot, magnify = true) {
    activeId = hotspot.id;
    if (!stageEl || !lensEl) return;
    const target = stageEl.querySelector<HTMLElement>(`[data-feature="${hotspot.id}"]`);
    if (!target) return;
    if (magnify) zoom = Math.max(zoom, 1.5);
    const point = offsetIn(target, lensEl);
    const width = lensEl.clientWidth;
    const height = lensEl.clientHeight;
    const scale = zoom;
    const x = width / 2 - (point.x + target.offsetWidth / 2) * scale;
    const y = height / 2 - (point.y + target.offsetHeight / 2) * scale;
    gsap.to(lensEl, {
      scale,
      x,
      y,
      transformOrigin: '0 0',
      duration: reduced ? 0 : 0.85,
      ease: 'power3.inOut',
      overwrite: true,
    });
  }

  function setZoom(next: number) {
    zoom = next;
    if (active) {
      focus(active, false);
      return;
    }
    if (!lensEl) return;
    const width = lensEl.clientWidth;
    const height = lensEl.clientHeight;
    gsap.to(lensEl, {
      scale: next,
      x: (width - width * next) / 2,
      y: (height - height * next) / 2,
      transformOrigin: '0 0',
      duration: reduced ? 0 : 0.85,
      ease: 'power3.inOut',
      overwrite: true,
    });
  }

  function reset() {
    activeId = null;
    zoom = 1;
    if (!lensEl) return;
    gsap.to(lensEl, {
      scale: 1,
      x: 0,
      y: 0,
      transformOrigin: '0 0',
      duration: reduced ? 0 : 0.7,
      ease: 'power3.out',
      overwrite: true,
    });
  }

  onMount(() => {
    lensEl?.style.setProperty('transform-origin', '0 0');
    measure();
    void drawArrows(true);

    const observer = new ResizeObserver(() => {
      measure();
    });
    if (stageEl) observer.observe(stageEl);
    const mock = stageEl?.querySelector<HTMLElement>('.guide-mock');
    if (mock) observer.observe(mock);

    return () => observer.disconnect();
  });

  $effect(() => {
    lang;
    const id = window.setTimeout(measure, 80);
    return () => window.clearTimeout(id);
  });
</script>

<div class="rounded-3xl border border-ink-900/10 bg-white p-5 shadow-xl shadow-ink-900/5 sm:p-7">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="max-w-md">
      <h3 class="font-display text-2xl font-semibold text-ink-900">
        {lang === 'en' ? 'Tap a number, then zoom the lens' : 'Chạm vào một số, rồi phóng ống kính'}
      </h3>
      <p class="mt-2 text-sm leading-relaxed text-ink-600">
        {lang === 'en'
          ? 'Five annotated controls. One canvas. The explanation follows the persona you choose.'
          : 'Năm vị trí được chú thích. Một khung hình. Giải thích thay đổi theo góc nhìn bạn chọn.'}
      </p>
    </div>

    <div class="inline-flex flex-wrap rounded-xl border border-ink-900/10 bg-cream-50 p-1" role="tablist" aria-label="Persona">
      {#each personas as item}
        <button
          type="button"
          role="tab"
          aria-selected={persona === item.key}
          onclick={() => (persona = item.key)}
          class={`rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
            persona === item.key ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-white'
          }`}
        >
          {item.label[lang]}
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
    <div class="inline-flex rounded-xl border border-ink-900/10 bg-cream-50 p-1" role="group" aria-label="Zoom lens">
      {#each [1, 1.5, 2] as level}
        <button
          type="button"
          onclick={() => setZoom(level)}
          aria-pressed={zoom === level}
          class={`min-h-9 rounded-lg px-3 font-mono text-xs font-bold transition active:scale-[0.97] ${
            zoom === level ? 'bg-jade-600 text-white' : 'text-ink-700 hover:bg-white'
          }`}
        >
          {level.toFixed(1)}x
        </button>
      {/each}
    </div>

    <button
      type="button"
      onclick={reset}
      class="min-h-9 rounded-xl border border-ink-900/15 px-3 text-xs font-bold text-ink-700 transition hover:border-jade-600 hover:text-jade-700 active:scale-[0.97]"
    >
      {lang === 'en' ? 'Reset view' : 'Về khung mặc định'}
    </button>
  </div>

  <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)] lg:items-start">
    <div class="guide-stage" bind:this={stageEl}>
      <div class="guide-lens" bind:this={lensEl}>
        <div class="guide-mock">
          <div class="flex items-center justify-between text-[11px] font-semibold text-cream-50/60">
            <span>ScamKill</span>
            <span class="font-mono">14:31</span>
          </div>

          <div class="mt-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3" data-feature="call">
            <div class="flex items-center justify-between gap-2">
              <p class="whitespace-nowrap font-mono text-sm font-bold text-cream-50">0918 765 432</p>
              <span class="shrink-0 whitespace-nowrap rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                {lang === 'en' ? 'Unverified' : 'Chưa xác minh'}
              </span>
            </div>
            <p class="mt-1 text-xs leading-snug text-cream-50/70">
              {lang === 'en' ? 'Unknown number. Do not send money.' : 'Số lạ. Không chuyển tiền.'}
            </p>
          </div>

          <div class="mt-3 rounded-2xl border border-jade-400/35 bg-jade-500/10 p-3" data-feature="pause">
            <div class="flex items-center gap-3">
              <span class="guide-breathe" aria-hidden="true"></span>
              <div>
                <p class="text-sm font-bold text-mint-100">
                  {lang === 'en' ? 'Pause for 60 seconds' : 'Dừng lại 60 giây'}
                </p>
                <p class="text-[11px] text-cream-50/65">
                  {lang === 'en' ? 'Breathe in 4s · out 4s' : 'Hít vào 4s · thở ra 4s'}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3" data-feature="safe-word">
            <p class="text-[10px] font-bold uppercase tracking-wider text-cream-50/55">
              {lang === 'en' ? 'Family code on file' : 'Mã gia đình đã đặt'}
            </p>
            <p class="mt-1 font-display text-base font-semibold text-amber-200">
              {lang === 'en' ? '“Sweet starfruit tree”' : '“Cây khế ngọt”'}
            </p>
          </div>

          <div class="mt-3 rounded-2xl bg-amber-400 px-3 py-2.5 text-ink-950" data-feature="alert">
            <p class="text-xs font-bold">{lang === 'en' ? 'Alert family in one tap' : 'Báo gia đình một chạm'}</p>
            <p class="font-mono text-[10px] font-semibold">SMS · Zalo · Telegram</p>
          </div>

          <label class="mt-3 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3" data-feature="privacy">
            <input type="checkbox" class="mt-0.5 size-3.5 accent-jade-500" />
            <span class="text-[11px] leading-snug text-cream-50/70">
              {lang === 'en' ? 'Share call content (off by default)' : 'Chia sẻ nội dung cuộc gọi (mặc định tắt)'}
            </span>
          </label>
        </div>

        <svg class="guide-arrows" viewBox={`0 0 ${svgW} ${svgH}`} aria-hidden="true">
          <defs>
            <marker id="guide-arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="var(--color-jade-600)" />
            </marker>
          </defs>
          {#each arrows as arrow}
            <path class="guide-arrow" d={arrow.d} fill="none" stroke="var(--color-jade-600)" stroke-width="1.6" marker-end="url(#guide-arrow-head)" />
          {/each}
        </svg>

        {#each hotspots as hotspot}
          <button
            type="button"
            data-hotspot={hotspot.id}
            onclick={() => focus(hotspot)}
            aria-pressed={activeId === hotspot.id}
            aria-label={`${hotspot.number} ${hotspot.title[lang]}`}
            class={`guide-hotspot ${activeId === hotspot.id ? 'is-active' : ''}`}
            style={`left: ${hotspot.bx}%; top: ${hotspot.by}%`}
          >
            <span class="guide-hotspot__ring" aria-hidden="true"></span>
            <span aria-hidden="true">{hotspot.number}</span>
          </button>
        {/each}
      </div>
    </div>

    <aside class="guide-card" aria-live="polite" bind:this={cardEl}>
      {#if active}
        <p class="font-mono text-xs font-bold text-jade-700">{active.number}</p>
        <h4 class="mt-1 font-display text-xl font-semibold text-ink-900">{active.title[lang]}</h4>
        <p class="mt-2 text-sm leading-relaxed text-ink-700">{active.detail[persona][lang]}</p>
        <p class="mt-4 rounded-xl bg-cream-50 px-3 py-2 text-xs leading-relaxed text-ink-600">
          {lang === 'en'
            ? 'Zoom the lens, then tap another number to pan there.'
            : 'Phóng ống kính, rồi chạm số khác để pan tới đó.'}
        </p>
      {:else}
        <p class="font-mono text-xs font-bold text-jade-700">① → ⑤</p>
        <h4 class="mt-1 font-display text-xl font-semibold text-ink-900">
          {lang === 'en' ? 'Start anywhere' : 'Bắt đầu từ bất kỳ đâu'}
        </h4>
        <p class="mt-2 text-sm leading-relaxed text-ink-700">
          {lang === 'en'
            ? 'Pick a persona above, then tap a numbered callout. The canvas pans to that control and this card explains it in plain language.'
            : 'Chọn góc nhìn phía trên, rồi chạm một số đánh dấu. Khung hình pan tới đúng nút đó và thẻ này giải thích bằng lời thường.'}
        </p>
      {/if}
    </aside>
  </div>
</div>

<style>
  .guide-stage {
    position: relative;
    overflow: hidden;
    border-radius: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--color-ink-900) 12%, transparent);
    background:
      radial-gradient(circle at 20% 15%, rgba(45, 212, 191, 0.12), transparent 45%),
      var(--color-cream-50);
    height: clamp(460px, 52vw, 560px);
    min-height: 0;
    container-type: inline-size;
  }

  .guide-lens {
    position: absolute;
    inset: 0;
    transform-origin: 0 0;
    will-change: transform;
  }

  .guide-mock {
    position: absolute;
    left: 26%;
    top: 5%;
    width: 48%;
    padding: 1rem;
    border-radius: 1.25rem;
    border: 1px solid color-mix(in oklab, #ffffff 14%, transparent);
    background: var(--color-ink-900);
    color: var(--color-cream-50);
    box-shadow: 0 24px 48px -24px rgba(6, 17, 15, 0.55);
  }

  .guide-arrows {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .guide-hotspot {
    position: absolute;
    display: grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    translate: -50% -50%;
    border-radius: 9999px;
    border: 2px solid #ffffff;
    background: var(--color-amber-400);
    color: var(--color-ink-950);
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 700;
    box-shadow: 0 8px 18px -8px rgba(6, 17, 15, 0.45);
    transition:
      background-color 180ms var(--ease-out-quart),
      color 180ms var(--ease-out-quart),
      scale 180ms var(--ease-out-quart);
  }

  .guide-hotspot:hover {
    scale: 1.08;
  }

  .guide-hotspot.is-active {
    background: var(--color-ink-900);
    color: var(--color-amber-300);
  }

  .guide-hotspot__ring {
    position: absolute;
    inset: -6px;
    border-radius: 9999px;
    border: 1px solid color-mix(in oklab, var(--color-jade-600) 55%, transparent);
    animation: guide-pulse 2.6s var(--ease-out-quart) infinite;
    pointer-events: none;
  }

  .guide-breathe {
    display: block;
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 9999px;
    border: 1px solid color-mix(in oklab, var(--color-jade-400) 65%, transparent);
    background: color-mix(in oklab, var(--color-jade-500) 18%, transparent);
    animation: guide-breathe 8s var(--ease-out-quart) infinite;
  }

  .guide-card {
    border-radius: 1.5rem;
    border: 1px solid color-mix(in oklab, var(--color-ink-900) 10%, transparent);
    background: #ffffff;
    padding: 1.25rem;
    box-shadow: 0 18px 40px -28px rgba(6, 17, 15, 0.45);
  }

  @keyframes guide-pulse {
    0% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    70% {
      transform: scale(1.35);
      opacity: 0;
    }
    100% {
      transform: scale(1.35);
      opacity: 0;
    }
  }

  @keyframes guide-breathe {
    0%,
    100% {
      transform: scale(0.82);
      opacity: 0.45;
    }
    50% {
      transform: scale(1.12);
      opacity: 0.9;
    }
  }

  @container (max-width: 520px) {
    .guide-mock {
      left: 12%;
      top: 5%;
      width: 76%;
      padding: 0.8rem;
    }

    .guide-hotspot {
      width: 2rem;
      height: 2rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 767px) {
    .guide-stage {
      height: 580px;
    }
  }
</style>
