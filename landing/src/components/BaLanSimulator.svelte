<script lang="ts">
  type Line = {
    speaker: 'scammer' | 'lan' | 'app' | 'family';
    text: string;
    tone?: 'danger' | 'safe' | 'neutral' | 'warning';
  };

  interface Step {
    label: string;
    time: string;
    title: string;
    screen: string;
    lines: Line[];
    actionTitle: string;
    actionBody: string;
  }

  const steps: Step[] = [
    {
      label: 'Cuộc gọi đến',
      time: '14:31',
      title: 'Số lạ giả giọng con gái',
      screen: 'Số lạ — Chưa xác minh',
      lines: [
        { speaker: 'app', text: '0918 765 432 • Không có trong danh bạ', tone: 'warning' },
        { speaker: 'scammer', text: '“Mẹ ơi, con bị tai nạn. Mẹ chuyển giúp con 30 triệu gấp!”', tone: 'danger' },
        { speaker: 'lan', text: '“Con bình tĩnh, mẹ nghe không rõ…”', tone: 'neutral' },
      ],
      actionTitle: 'Khoan đã, có dấu hiệu bất thường',
      actionBody:
        'Số lạ, giọng gấp gáp, đòi tiền ngay. ScamKill không kết luận đây là lừa đảo — chỉ báo nguy cơ và mời Bà Lan kiểm tra.',
    },
    {
      label: 'Làm chậm',
      time: '14:31',
      title: 'Khoảng dừng 60 giây',
      screen: 'Làm chậm — Slow Down',
      lines: [
        { speaker: 'app', text: '“Khoan chuyển 30 triệu. Hãy dừng 1 phút để kiểm tra.”', tone: 'safe' },
        { speaker: 'app', text: 'Hít vào 4 giây • Thở ra 6 giây • Lặp lại 6 lần', tone: 'neutral' },
        { speaker: 'lan', text: '“Mình sẽ không chuyển tiền cho đến khi kiểm tra xong.”', tone: 'safe' },
      ],
      actionTitle: 'Cảm xúc bị kích động là điểm yếu bị khai thác',
      actionBody:
        'Giao diện chặn toàn màn hình, chữ lớn, đọc thành tiếng. Mục tiêu: cắt cơn hoảng trước khi ngón tay chạm nút chuyển tiền.',
    },
    {
      label: 'Xác minh & báo gia đình',
      time: '14:32',
      title: 'Mã gia đình + 1-chạm báo tin',
      screen: 'Xác minh người thân',
      lines: [
        { speaker: 'app', text: '“Hỏi người gọi: Mã gia đình của mình là gì?”', tone: 'safe' },
        { speaker: 'lan', text: '“Con cho mẹ Mã gia đình?”', tone: 'neutral' },
        { speaker: 'app', text: 'Người gọi không trả lời đúng. Hãy cúp máy và gọi lại số con gái đã lưu.', tone: 'danger' },
      ],
      actionTitle: 'Hai việc cùng lúc: xác minh và gọi cứu viện',
      actionBody:
        'Bước xác minh không phụ thuộc vào tai người hay AI nhận diện giọng nói. Cảnh báo chỉ gửi loại cảnh báo, thời điểm và số gọi đến — nội dung chỉ gửi khi Bà Lan đồng ý.',
    },
    {
      label: 'Gia đình can thiệp',
      time: '14:33',
      title: 'Con gái gọi lại — chặn 30 triệu',
      screen: 'Đã an toàn',
      lines: [
        { speaker: 'family', text: '“Mẹ ơi con đang ở cơ quan, con an toàn. Đừng chuyển tiền.”', tone: 'safe' },
        { speaker: 'lan', text: '“May quá, mẹ suýt chuyển 30 triệu.”', tone: 'safe' },
        { speaker: 'app', text: 'Không có giao dịch nào được thực hiện. Số 0918 765 432 đã được đánh dấu.', tone: 'safe' },
      ],
      actionTitle: '30.000.000 ₫ được giữ lại trong 2 phút',
      actionBody:
        'Kịch bản khép kín: cảnh báo trước khi bắt máy, khoảng dừng, xác minh độc lập, và người thân gọi lại xác nhận.',
    },
  ];

  let index = $state(0);
  let safeWordAsked = $state(false);
  let alertSent = $state(false);
  let shareContent = $state(false);
  let familyReplied = $state(false);

  const step = $derived(steps[index]);
  const isLast = $derived(index === steps.length - 1);
  const canAdvance = $derived(index < 2 || alertSent);
  const progress = $derived(((index + 1) / steps.length) * 100);

  const channels = ['SMS', 'Zalo', 'Telegram'];

  function next() {
    if (!canAdvance || isLast) return;
    index += 1;
  }

  function prev() {
    if (index > 0) index -= 1;
  }

  function reset() {
    index = 0;
    safeWordAsked = false;
    alertSent = false;
    shareContent = false;
    familyReplied = false;
  }

  function sendAlert() {
    alertSent = true;
    familyReplied = false;
    window.setTimeout(() => {
      familyReplied = true;
    }, 900);
  }

  const speakerLabel: Record<Line['speaker'], string> = {
    scammer: 'Người gọi',
    lan: 'Bà Lan',
    app: 'ScamKill',
    family: 'Chị Hương',
  };
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
  <!-- Phone mock -->
  <div class="relative mx-auto w-full max-w-sm">
    <div
      class="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-jade-500/30 via-transparent to-amber-400/20 blur-2xl"
      aria-hidden="true"
    ></div>
    <div class="overflow-hidden rounded-[2.2rem] border border-white/15 bg-ink-950 p-3 shadow-2xl shadow-ink-950/40">
      <div class="rounded-[1.6rem] bg-ink-900 px-5 pb-6 pt-4 text-cream-50">
        <div class="flex items-center justify-between text-[11px] uppercase tracking-widest text-cream-50/60">
          <span>{step.time}</span>
          <span>ScamKill</span>
          <span aria-hidden="true">▮▮▮</span>
        </div>

        <div class="mt-5 flex items-center gap-3" aria-live="polite">
          <div class="grid size-12 place-items-center rounded-full bg-white/10">
            <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 0 0 5.5 5.5L16 13l4 1.5v3a2.5 2.5 0 0 1-2.7 2.5A17.5 17.5 0 0 1 3.5 5.7 2.5 2.5 0 0 1 6 3Z" />
            </svg>
          </div>
          <div>
            <p class="text-lg font-semibold leading-tight">0918 765 432</p>
            <p class="text-sm text-amber-400">{step.screen}</p>
          </div>
        </div>

        <div class="mt-5 space-y-3 text-[15px] leading-relaxed">
          {#each step.lines as line}
            <div class={`rounded-2xl px-4 py-3 ${line.speaker === 'app' ? 'border border-jade-500/30 bg-jade-500/15' : 'bg-white/10'}`}>
              <p class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cream-50/50">
                {speakerLabel[line.speaker]}
              </p>
              <p class={line.tone === 'danger' ? 'text-amber-300' : line.tone === 'safe' ? 'text-mint-100' : line.tone === 'warning' ? 'text-amber-200' : ''}>
                {line.text}
              </p>
            </div>
          {/each}
        </div>

        {#if index === 2}
          <div class="mt-5 space-y-3">
            {#if !safeWordAsked}
              <button
                type="button"
                onclick={() => (safeWordAsked = true)}
                class="w-full rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-left text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Bước 1 — Hỏi “Mã gia đình”
              </button>
            {:else}
              <div class="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                Người gọi không biết mã. Đây là tín hiệu xác minh thất bại — không chuyển tiền.
              </div>
            {/if}

            <label class="flex items-start gap-2 text-xs text-cream-50/70">
              <input
                type="checkbox"
                bind:checked={shareContent}
                class="mt-0.5 size-4 rounded border-white/30 bg-transparent accent-jade-500"
              />
              <span>Đồng ý chia sẻ nội dung cuộc gọi cho người thân (mặc định chỉ gửi loại cảnh báo, giờ và số gọi đến).</span>
            </label>

            {#if !alertSent}
              <button
                type="button"
                onclick={sendAlert}
                class="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Gửi cảnh báo 1-chạm tới Chị Hương
              </button>
            {:else}
              <div class="rounded-xl border border-jade-500/40 bg-jade-950/40 px-4 py-3 text-sm">
                <p class="font-semibold text-mint-100">Đã gửi qua SMS, Zalo, Telegram</p>
                <p class="mt-1 text-cream-50/70">Loại cảnh báo · 14:32 · 0918 765 432</p>
                {#if shareContent}<p class="mt-1 text-cream-50/70">Nội dung: có, theo sự đồng ý của Bà Lan.</p>{/if}
                {#if familyReplied}
                  <p class="mt-2 text-amber-300">Chị Hương: “Mẹ đừng chuyển tiền, con gọi lại ngay.”</p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if isLast}
      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="text-lg font-bold text-mint-100">0 ₫</p>
          <p class="text-[11px] text-cream-50/60">đã chuyển</p>
        </div>
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="text-lg font-bold text-mint-100">2 phút</p>
          <p class="text-[11px] text-cream-50/60">từ cảnh báo đến gọi lại</p>
        </div>
        <div class="rounded-xl border border-jade-500/30 bg-jade-950/40 px-2 py-3">
          <p class="text-lg font-bold text-mint-100">3 kênh</p>
          <p class="text-[11px] text-cream-50/60">SMS · Zalo · Telegram</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Kịch bản Bà Lan</p>
      <p class="text-sm text-cream-50/60">Bước {index + 1}/{steps.length}</p>
    </div>

    <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div class="h-full rounded-full bg-gradient-to-r from-jade-500 to-amber-400 transition-all duration-500" style={`width: ${progress}%`}></div>
    </div>

    <ol class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Các bước kịch bản">
      {#each steps as item, i}
        <li>
          <button
            type="button"
            onclick={() => { if (i <= index || i === 0) index = i; }}
            aria-current={i === index ? 'step' : undefined}
            class={`w-full rounded-xl border px-2 py-2 text-left text-[11px] leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${i === index ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-white/10 text-cream-50/65'}`}
          >
            <span class="block font-bold">{i + 1}. {item.label}</span>
          </button>
        </li>
      {/each}
    </ol>

    <div class="mt-7" aria-live="polite">
      <h3 class="font-serif text-2xl font-semibold text-cream-50 sm:text-3xl">{step.title}</h3>
      <p class="mt-3 text-base leading-relaxed text-cream-50/75">{step.actionBody}</p>
    </div>

    <div class="mt-6 rounded-2xl border border-white/10 bg-ink-950/40 p-4">
      <p class="text-xs font-semibold uppercase tracking-wider text-jade-400">Vì sao hiệu quả</p>
      <p class="mt-2 text-sm leading-relaxed text-cream-50/70">{step.actionTitle}</p>
    </div>

    {#if index === 2 && alertSent}
      <div class="mt-4 flex flex-wrap gap-2" aria-label="Kênh đã gửi cảnh báo">
        {#each channels as channel}
          <span class="rounded-full border border-jade-500/40 bg-jade-500/15 px-3 py-1 text-xs font-semibold text-mint-100">
            {channel} đã gửi
          </span>
        {/each}
      </div>
    {/if}

    <div class="mt-7 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onclick={prev}
        disabled={index === 0}
        class="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        Quay lại
      </button>

      {#if isLast}
        <button
          type="button"
          onclick={reset}
          class="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          Chạy lại kịch bản
        </button>
      {:else}
        <button
          type="button"
          onclick={next}
          disabled={!canAdvance}
          class="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {index === 2 && !alertSent ? 'Hãy gửi cảnh báo trước' : 'Bước tiếp theo'}
        </button>
      {/if}

      <span class="text-xs text-cream-50/60">Dữ liệu mô phỏng · không gửi tin thật</span>
    </div>
  </div>
</div>
