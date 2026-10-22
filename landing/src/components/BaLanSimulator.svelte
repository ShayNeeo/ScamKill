<script lang="ts">
  import gsap from 'gsap';
  import { subscribeLang, type Lang } from '../lib/i18n';

  type Speaker = 'scammer' | 'lan' | 'app' | 'family';
  type Bi = { en: string; vi: string };

  type Line = {
    speaker: Speaker;
    text: Bi;
    tone?: 'danger' | 'safe' | 'neutral' | 'warning';
  };

  interface Step {
    label: Bi;
    time: string;
    title: Bi;
    screen: Bi;
    lines: Line[];
    actionTitle: Bi;
    actionBody: Bi;
  }

  let lang = $state<Lang>('en');
  $effect(() => subscribeLang((next) => (lang = next)));

  const steps: Step[] = [
    {
      label: { en: 'Incoming call', vi: 'Cuộc gọi đến' },
      time: '14:31',
      title: { en: 'An unknown number imitating her daughter', vi: 'Số lạ giả giọng con gái' },
      screen: { en: 'Unknown number · Unverified', vi: 'Số lạ · Chưa xác minh' },
      lines: [
        {
          speaker: 'app',
          text: { en: '0918 765 432 · Not in contacts', vi: '0918 765 432 · Không có trong danh bạ' },
          tone: 'warning',
        },
        {
          speaker: 'scammer',
          text: {
            en: '“Mom, I had an accident. Please send 30 million right now!”',
            vi: '“Mẹ ơi, con bị tai nạn. Mẹ chuyển giúp con 30 triệu gấp!”',
          },
          tone: 'danger',
        },
        {
          speaker: 'lan',
          text: { en: '“Slow down, I cannot hear you clearly...”', vi: '“Con bình tĩnh, mẹ nghe không rõ…”' },
          tone: 'neutral',
        },
      ],
      actionTitle: { en: 'Wait, something does not add up', vi: 'Khoan đã, có dấu hiệu bất thường' },
      actionBody: {
        en: 'Unknown number, rushed voice, immediate demand for money. ScamKill does not conclude this is a scam. It says there is risk, and invites Mrs. Lan to check before doing anything.',
        vi: 'Số lạ, giọng gấp, đòi tiền ngay. ScamKill không kết luận đây là lừa đảo. App chỉ nói: có nguy cơ, và mời bà Lan kiểm tra trước khi làm bất cứ điều gì.',
      },
    },
    {
      label: { en: 'Slow down', vi: 'Làm chậm' },
      time: '14:31',
      title: { en: 'A 60-second pause', vi: 'Khoảng dừng 60 giây' },
      screen: { en: 'Slow Down · pause', vi: 'Làm chậm · Slow Down' },
      lines: [
        {
          speaker: 'app',
          text: {
            en: '“Hold the 30 million transfer. Let us stop for a minute.”',
            vi: '“Khoan chuyển 30 triệu. Mình dừng lại một phút đã.”',
          },
          tone: 'safe',
        },
        {
          speaker: 'lan',
          text: {
            en: '“I will not send money until I have checked.”',
            vi: '“Mình sẽ không chuyển tiền cho đến khi kiểm tra xong.”',
          },
          tone: 'safe',
        },
      ],
      actionTitle: {
        en: 'A hijacked emotion is the exploited weakness',
        vi: 'Cảm xúc bị kích động là điểm yếu bị khai thác',
      },
      actionBody: {
        en: 'The screen covers the phone, type is large, and the text is read aloud. The only goal: cut the panic before a finger reaches the transfer button.',
        vi: 'Giao diện phủ toàn màn hình, chữ lớn, đọc thành tiếng. Mục đích duy nhất: cắt cơn hoảng trước khi ngón tay chạm nút chuyển tiền.',
      },
    },
    {
      label: { en: 'Verify', vi: 'Xác minh' },
      time: '14:32',
      title: { en: 'Family code, then a one-tap alert', vi: 'Mã gia đình rồi báo tin một chạm' },
      screen: { en: 'Verify family', vi: 'Xác minh người thân' },
      lines: [
        {
          speaker: 'app',
          text: {
            en: '“Ask the caller: what is our family code?”',
            vi: '“Hỏi người gọi: Mã gia đình của mình là gì?”',
          },
          tone: 'safe',
        },
        {
          speaker: 'lan',
          text: { en: '“Can you tell me our family code?”', vi: '“Con cho mẹ Mã gia đình?”' },
          tone: 'neutral',
        },
        {
          speaker: 'app',
          text: {
            en: 'The caller cannot answer. Hang up and call your daughter at the saved number.',
            vi: 'Người gọi không trả lời đúng. Hãy cúp máy và gọi lại số con gái đã lưu.',
          },
          tone: 'danger',
        },
      ],
      actionTitle: {
        en: 'Two jobs at once: verify and call for backup',
        vi: 'Hai việc cùng lúc: xác minh và gọi cứu viện',
      },
      actionBody: {
        en: 'Verification does not rely on the human ear or on voice AI. The alert sends only the alert type, the time, and the calling number. Call content leaves only when Mrs. Lan agrees.',
        vi: 'Phần xác minh không dựa vào tai người hay AI nhận giọng. Cảnh báo chỉ gửi loại cảnh báo, giờ và số gọi đến. Nội dung cuộc gọi chỉ đi khi bà Lan đồng ý.',
      },
    },
    {
      label: { en: 'Family', vi: 'Gia đình' },
      time: '14:33',
      title: { en: 'Her daughter calls back and 30 million stay', vi: 'Con gái gọi lại, giữ được 30 triệu' },
      screen: { en: 'Safe', vi: 'Đã an toàn' },
      lines: [
        {
          speaker: 'family',
          text: {
            en: '“Mom, I am at the office and I am safe. Do not transfer.”',
            vi: '“Mẹ ơi con đang ở cơ quan, con an toàn. Đừng chuyển tiền.”',
          },
          tone: 'safe',
        },
        {
          speaker: 'lan',
          text: { en: '“Thank goodness, I almost sent 30 million.”', vi: '“May quá, mẹ suýt chuyển 30 triệu.”' },
          tone: 'safe',
        },
        {
          speaker: 'app',
          text: {
            en: 'No transaction was made. The number 0918 765 432 has been flagged.',
            vi: 'Không có giao dịch nào được thực hiện. Số 0918 765 432 đã được đánh dấu.',
          },
          tone: 'safe',
        },
      ],
      actionTitle: { en: '30,000,000 ₫ kept in 2 minutes', vi: '30.000.000 ₫ được giữ lại trong 2 phút' },
      actionBody: {
        en: 'A closed loop: a warning before pickup, a pause, independent verification, then a family callback.',
        vi: 'Một vòng khép kín: cảnh báo trước khi bắt máy, khoảng dừng, xác minh độc lập, rồi người thân gọi lại xác nhận.',
      },
    },
  ];

  const channels: { name: string; tint: string; text: Bi }[] = [
    {
      name: 'SMS',
      tint: 'bg-jade-500/15 text-mint-100',
      text: {
        en: 'Alert: risky call from 0918 765 432',
        vi: 'Cảnh báo: cuộc gọi rủi ro từ 0918 765 432',
      },
    },
    {
      name: 'Zalo',
      tint: 'bg-[#0068ff]/20 text-[#b9d4ff]',
      text: {
        en: 'Alert: risky call from 0918 765 432',
        vi: 'Cảnh báo: cuộc gọi rủi ro từ 0918 765 432',
      },
    },
    {
      name: 'Telegram',
      tint: 'bg-[#229ed9]/20 text-[#bfe6f7]',
      text: {
        en: 'Alert: risky call from 0918 765 432',
        vi: 'Cảnh báo: cuộc gọi rủi ro từ 0918 765 432',
      },
    },
  ];

  const speakerLabel: Record<Speaker, Bi> = {
    scammer: { en: 'Caller', vi: 'Người gọi' },
    lan: { en: 'Mrs. Lan', vi: 'Bà Lan' },
    app: { en: 'ScamKill', vi: 'ScamKill' },
    family: { en: 'Ms. Huong', vi: 'Chị Hương' },
  };

  const ui = {
    en: {
      scenario: 'Mrs. Lan scenario',
      stepOf: (current: number, total: number) => `Step ${current}/${total}`,
      stopAuto: 'Stop auto-play',
      startAuto: 'Auto-play the simulation',
      progress: 'Scenario progress',
      stepsLabel: 'Scenario steps',
      why: 'Why this step works',
      back: 'Back',
      next: 'Next step',
      sendFirst: 'Send the alert first',
      replay: 'Run the scenario again',
      simulated: 'Simulated data, no real messages are sent.',
      askCode: 'Ask for the family code first',
      codeFailed: 'The caller does not know the code. Verification failed, so no money moves.',
      shareCall: 'Allow call content to be attached. By default only the alert type, time, and calling number are sent.',
      sendAlert: 'Send a one-tap alert to Ms. Huong',
      sent: 'Sent on 3 channels',
      withContent: 'Includes call content, with Mrs. Lan consent.',
      reply: 'Mom, I am at the office and I am safe. Please do not transfer.',
      sentValue: 'sent',
      callbackValue: 'from alert to callback',
      channelsValue: 'channels',
      breatheIn: 'Breathe in 4s',
      breatheOut: 'Breathe out 4s',
    },
    vi: {
      scenario: 'Kịch bản Bà Lan',
      stepOf: (current: number, total: number) => `Bước ${current}/${total}`,
      stopAuto: 'Dừng tự động',
      startAuto: 'Tự động chạy mô phỏng',
      progress: 'Tiến độ kịch bản',
      stepsLabel: 'Các bước kịch bản',
      why: 'Vì sao bước này hiệu quả',
      back: 'Quay lại',
      next: 'Bước tiếp theo',
      sendFirst: 'Gửi cảnh báo trước đã',
      replay: 'Chạy lại kịch bản',
      simulated: 'Dữ liệu mô phỏng, không gửi tin thật.',
      askCode: 'Hỏi “Mã gia đình” trước đã',
      codeFailed: 'Người gọi không biết mã. Xác minh thất bại, nên không chuyển tiền.',
      shareCall: 'Cho phép gửi kèm nội dung cuộc gọi. Mặc định chỉ gửi loại cảnh báo, giờ và số gọi đến.',
      sendAlert: 'Gửi cảnh báo một chạm tới chị Hương',
      sent: 'Đã gửi tới 3 kênh',
      withContent: 'Kèm nội dung cuộc gọi, theo sự đồng ý của bà Lan.',
      reply: 'Mẹ ơi con đang ở cơ quan, con an toàn. Mẹ đừng chuyển tiền nhé.',
      sentValue: 'đã chuyển',
      callbackValue: 'từ cảnh báo đến gọi lại',
      channelsValue: 'kênh',
      breatheIn: 'Hít vào 4s',
      breatheOut: 'Thở ra 4s',
    },
  };
  const t = $derived(ui[lang]);

  let index = $state(0);
  let safeWordAsked = $state(false);
  let alertSent = $state(false);
  let shareContent = $state(false);
  let familyReplied = $state(false);
  let auto = $state(false);
  let replyTimer: number | undefined;
  let breatheEl = $state<HTMLSpanElement | null>(null);

  const step = $derived(steps[index]);
  const isLast = $derived(index === steps.length - 1);
  const canAdvance = $derived(index < 2 || alertSent);
  const progress = $derived(((index + 1) / steps.length) * 100);
  const alertVisible = $derived(alertSent && index >= 2);

  // Auto-play walks the loop on its own, but never skips the alert gate:
  // step 3 sends the alert first, then continues.
  $effect(() => {
    if (!auto) return;
    if (index === 2 && !alertSent) {
      const id = window.setTimeout(sendAlert, 1600);
      return () => window.clearTimeout(id);
    }
    if (index >= steps.length - 1) {
      auto = false;
      return;
    }
    const id = window.setTimeout(() => {
      index += 1;
    }, 4000);
    return () => window.clearTimeout(id);
  });

  // The pause step paces a physiological breath with GSAP: 4 seconds in, 4 seconds out.
  $effect(() => {
    if (index !== 1 || !breatheEl) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(
      breatheEl,
      { scale: 0.82, opacity: 0.35 },
      { scale: 1.16, opacity: 0.85, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 },
    );
    return () => {
      tween.kill();
    };
  });

  function stopAuto() {
    auto = false;
  }

  function toggleAuto() {
    if (auto) {
      auto = false;
      return;
    }
    if (isLast) reset();
    auto = true;
  }

  function next() {
    stopAuto();
    if (!canAdvance || isLast) return;
    index += 1;
  }

  function prev() {
    stopAuto();
    if (index > 0) index -= 1;
  }

  function goTo(target: number) {
    stopAuto();
    if (target <= index || target === 0) index = target;
  }

  function reset() {
    stopAuto();
    index = 0;
    safeWordAsked = false;
    alertSent = false;
    shareContent = false;
    familyReplied = false;
    if (replyTimer) window.clearTimeout(replyTimer);
  }

  function sendAlert() {
    alertSent = true;
    familyReplied = false;
    if (replyTimer) window.clearTimeout(replyTimer);
    replyTimer = window.setTimeout(() => {
      familyReplied = true;
    }, 900);
  }
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
  <!-- Phone mock -->
  <div class="relative mx-auto w-full max-w-sm">
    <div class="overflow-hidden rounded-[2.2rem] border border-white/15 bg-ink-950 p-3 shadow-2xl shadow-ink-950/40">
      <div class="rounded-[1.6rem] bg-ink-900 px-5 pb-6 pt-4 text-cream-50">
        <div class="flex items-center justify-between text-[11px] font-semibold tracking-widest text-cream-50/60">
          <span class="font-mono">{step.time}</span>
          <span class="uppercase tracking-[0.18em]">ScamKill</span>
          <svg viewBox="0 0 22 12" class="h-3 w-5" fill="currentColor" aria-hidden="true">
            <rect x="0" y="7" width="3" height="5" rx="1"></rect>
            <rect x="5" y="5" width="3" height="7" rx="1"></rect>
            <rect x="10" y="2.5" width="3" height="9.5" rx="1"></rect>
            <rect x="15" y="0" width="3" height="12" rx="1"></rect>
          </svg>
        </div>

        <div class="mt-5 flex items-center gap-3" aria-live="polite">
          <div class="relative grid size-12 shrink-0 place-items-center rounded-full bg-white/10">
            {#if index === 0}
              <span class="call-ring" aria-hidden="true"></span>
              <span class="call-ring" style="animation-delay: 0.9s" aria-hidden="true"></span>
              <span class="call-ring" style="animation-delay: 1.8s" aria-hidden="true"></span>
            {/if}
            <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 0 0 5.5 5.5L16 13l4 1.5v3a2.5 2.5 0 0 1-2.7 2.5A17.5 17.5 0 0 1 3.5 5.7 2.5 2.5 0 0 1 6 3Z" />
            </svg>
          </div>
          <div>
            <p class="font-mono text-lg font-semibold leading-tight">0918 765 432</p>
            <p class="text-sm text-amber-300">{step.screen[lang]}</p>
          </div>
        </div>

        {#key index}
          <div class="step-screen mt-5 space-y-3 text-base leading-relaxed">
            {#each step.lines as line}
              <div
                class={`rounded-2xl px-4 py-3 ${
                  line.speaker === 'app'
                    ? 'border border-jade-500/30 bg-jade-500/15'
                    : line.speaker === 'family'
                      ? 'border border-[#0068ff]/35 bg-[#0068ff]/10'
                      : 'bg-white/10'
                }`}
              >
                <p class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cream-50/60">
                  {speakerLabel[line.speaker][lang]}
                </p>
                <p
                  class={line.tone === 'danger'
                    ? 'text-amber-300'
                    : line.tone === 'safe'
                      ? 'text-mint-100'
                      : line.tone === 'warning'
                        ? 'text-amber-200'
                        : ''}
                >
                  {line.text[lang]}
                </p>
              </div>
            {/each}

            {#if index === 1}
              <div class="flex flex-col items-center gap-3 pt-2">
                <div class="relative grid size-32 place-items-center">
                  <span class="breathe-ring" bind:this={breatheEl} aria-hidden="true"></span>
                  <div class="grid size-32 place-items-center rounded-full border border-jade-400/40 bg-jade-950/50 text-center">
                    <p class="font-mono text-xs leading-relaxed text-mint-100">
                      {t.breatheIn}<br />{t.breatheOut}
                    </p>
                  </div>
                </div>
                <p class="text-center text-xs text-cream-50/60">
                  {lang === 'en'
                    ? 'The ring grows on the inhale and settles on the exhale.'
                    : 'Vòng tròn lớn dần khi hít vào, nhỏ lại khi thở ra.'}
                </p>
              </div>
            {/if}

            {#if index === 2}
              <div class="space-y-3 pt-1">
                {#if !safeWordAsked}
                  <button
                    type="button"
                    onclick={() => (safeWordAsked = true)}
                    class="w-full rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-left text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    {t.askCode}
                  </button>
                {:else}
                  <div class="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
                    {t.codeFailed}
                  </div>
                {/if}

                <label class="flex items-start gap-2.5 text-xs leading-relaxed text-cream-50/75">
                  <input
                    type="checkbox"
                    bind:checked={shareContent}
                    class="mt-0.5 size-4 shrink-0 rounded border-white/30 bg-transparent accent-jade-500"
                  />
                  <span>{t.shareCall}</span>
                </label>

                {#if !alertSent}
                  <button
                    type="button"
                    onclick={sendAlert}
                    class="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-amber-300 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    {t.sendAlert}
                  </button>
                {/if}
              </div>
            {/if}

            {#if alertVisible}
              <div class="step-screen space-y-2 pt-1">
                <p class="flex items-center gap-2 text-xs font-semibold text-mint-100">
                  <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="m4 10 4 4 8-8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {t.sent}
                </p>
                {#each channels as channel}
                  <div class="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <span class={`grid size-9 shrink-0 place-items-center rounded-xl ${channel.tint}`}>
                      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z" stroke-linejoin="round" />
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-[11px] font-semibold text-cream-50/55">{channel.name} · {lang === 'en' ? 'Ms. Huong' : 'Chị Hương'}</p>
                      <p class="mt-0.5 text-sm leading-snug text-cream-50">{channel.text[lang]}</p>
                      {#if shareContent}
                        <p class="mt-1 text-[11px] leading-snug text-cream-50/55">{t.withContent}</p>
                      {/if}
                      <p class="mt-1 font-mono text-[11px] text-cream-50/60">14:32</p>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}

            {#if index === 3 && familyReplied}
              <div class="step-screen rounded-2xl border border-[#0068ff]/35 bg-[#0068ff]/10 p-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-[11px] font-semibold text-[#b9d4ff]">
                    {lang === 'en' ? 'Ms. Huong · Zalo' : 'Chị Hương · Zalo'}
                  </p>
                  <p class="font-mono text-[11px] text-cream-50/60">14:33</p>
                </div>
                <p class="mt-1.5 text-sm leading-relaxed text-cream-50">{t.reply}</p>
              </div>
            {/if}
          </div>
        {/key}
      </div>
    </div>

    {#if isLast}
      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="font-mono text-lg font-bold text-mint-100">0 ₫</p>
          <p class="text-[11px] text-cream-50/60">{t.sentValue}</p>
        </div>
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="font-mono text-lg font-bold text-mint-100">{lang === 'en' ? '2 min' : '2 phút'}</p>
          <p class="text-[11px] text-cream-50/60">{t.callbackValue}</p>
        </div>
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="font-mono text-lg font-bold text-mint-100">{lang === 'en' ? '3' : '3'}</p>
          <p class="text-[11px] text-cream-50/60">{t.channelsValue}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  <div class="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-bold text-amber-300">{t.scenario}</p>
      <div class="flex flex-wrap items-center gap-3">
        <p class="font-mono text-sm text-cream-50/60">{t.stepOf(index + 1, steps.length)}</p>
        <button
          type="button"
          onclick={toggleAuto}
          aria-pressed={auto}
          class={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
            auto
              ? 'border-jade-400 bg-jade-500/15 text-mint-100'
              : 'border-white/20 text-cream-50/80 hover:border-amber-300/60 hover:text-amber-200'
          }`}
        >
          {#if auto}
            <svg viewBox="0 0 16 16" class="size-3" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2" width="3.5" height="12" rx="1"></rect>
              <rect x="9.5" y="2" width="3.5" height="12" rx="1"></rect>
            </svg>
            {t.stopAuto}
          {:else}
            <iconify-icon icon="lucide:play" width="14" height="14"></iconify-icon>
            {t.startAuto}
          {/if}
        </button>
      </div>
    </div>

    <div
      class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-label={t.progress}
      aria-valuemin="0"
      aria-valuemax={steps.length}
      aria-valuenow={index + 1}
    >
      <div
        class="h-full rounded-full bg-gradient-to-r from-jade-500 to-amber-400 transition-[width] duration-500 ease-out"
        style={`width: ${progress}%`}
      ></div>
    </div>

    <ol class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t.stepsLabel}>
      {#each steps as item, i}
        <li>
          <button
            type="button"
            onclick={() => goTo(i)}
            disabled={i > index && i !== 0}
            aria-current={i === index ? 'step' : undefined}
            class={`w-full rounded-xl border px-2 py-3 text-left text-xs leading-tight transition active:scale-[0.97] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
              i === index
                ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                : i <= index || i === 0
                  ? 'border-white/15 text-cream-50/70 hover:border-white/30'
                  : 'border-white/10 text-cream-50/40'
            }`}
          >
            <span class="block font-bold">{i + 1}. {item.label[lang]}</span>
          </button>
        </li>
      {/each}
    </ol>

    <div class="mt-7" aria-live="polite">
      <h3 class="font-display text-2xl font-semibold text-cream-50 sm:text-3xl">{step.title[lang]}</h3>
      <p class="mt-3 text-base leading-relaxed text-cream-50/75">{step.actionBody[lang]}</p>
    </div>

    <div class="mt-6 rounded-2xl border border-white/10 bg-ink-950/40 p-4">
      <p class="text-xs font-semibold text-jade-400">{t.why}</p>
      <p class="mt-2 text-sm leading-relaxed text-cream-50/70">{step.actionTitle[lang]}</p>
    </div>

    <div class="mt-7 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onclick={prev}
        disabled={index === 0}
        class="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        {t.back}
      </button>

      {#if isLast}
        <button
          type="button"
          onclick={reset}
          class="inline-flex min-h-11 items-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-amber-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {t.replay}
        </button>
      {:else}
        <button
          type="button"
          onclick={next}
          disabled={!canAdvance}
          class="inline-flex min-h-11 items-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {index === 2 && !alertSent ? t.sendFirst : t.next}
        </button>
      {/if}

      <span class="text-xs text-cream-50/60">{t.simulated}</span>
    </div>
  </div>
</div>

<style>
  .call-ring {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    border: 1px solid rgba(45, 212, 191, 0.55);
    opacity: 0;
    animation: ring-out 2.7s var(--ease-out-quart) infinite;
    pointer-events: none;
  }

  .breathe-ring {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    border: 1px solid rgba(45, 212, 191, 0.35);
    opacity: 0.35;
    pointer-events: none;
  }

  .step-screen {
    animation: step-in 0.45s var(--ease-out-expo) both;
  }

  @keyframes ring-out {
    0% {
      opacity: 0.65;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(2.35);
    }
  }

  @keyframes step-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
