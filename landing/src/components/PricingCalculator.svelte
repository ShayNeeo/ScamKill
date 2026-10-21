<script lang="ts">
  type Mode = 'family' | 'org';
  type Tier = 'basic' | 'advanced';

  let mode = $state<Mode>('family');
  let seniors = $state(2);
  let annual = $state(false);
  let mau = $state(250_000);
  let tier = $state<Tier>('basic');

  const FAMILY_MONTHLY = 2.99;
  const FAMILY_ANNUAL = 29.9; // 10 tháng, tặng 2 tháng
  const TIERS: Record<Tier, { label: string; low: number; high: number; note: string }> = {
    basic: {
      label: 'Basic protection',
      low: 0.08,
      high: 0.15,
      note: 'Cảnh báo danh tính số, tra cứu số rủi ro và API cảnh báo cơ bản.',
    },
    advanced: {
      label: 'Advanced AI protection',
      low: 0.3,
      high: 0.75,
      note: 'Thêm AI chạy trên thiết bị, phân tích kịch bản thoại và API Cooling-Off.',
    },
  };
  const tierOptions = (Object.keys(TIERS) as Tier[]).map((key) => ({ key, ...TIERS[key] }));

  const mauPresets = [50_000, 250_000, 500_000, 1_000_000, 2_000_000];
  const rate = $derived(TIERS[tier]);
  const orgLow = $derived(mau * rate.low);
  const orgHigh = $derived(mau * rate.high);
  const familyYearly = FAMILY_MONTHLY * 12;
  const familySavings = $derived(familyYearly - FAMILY_ANNUAL);
  const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  const vnd = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
</script>

<div class="rounded-3xl border border-ink-900/10 bg-white p-6 shadow-xl shadow-ink-900/5 sm:p-8">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="max-w-xs">
      <h3 class="font-display text-2xl font-semibold text-ink-900">Bạn trả bao nhiêu?</h3>
      <p class="mt-2 text-sm leading-relaxed text-ink-600">
        Chọn theo hộ gia đình hoặc theo quy mô người dùng của tổ chức.
      </p>
    </div>
    <div class="inline-flex rounded-xl border border-ink-900/10 bg-cream-50 p-1" role="group" aria-label="Chọn đối tượng">
      <button
        type="button"
        onclick={() => (mode = 'family')}
        aria-pressed={mode === 'family'}
        class={`rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${mode === 'family' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-white'}`}
      >
        Gia đình
      </button>
      <button
        type="button"
        onclick={() => (mode = 'org')}
        aria-pressed={mode === 'org'}
        class={`rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${mode === 'org' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-white'}`}
      >
        Ngân hàng &amp; nhà mạng
      </button>
    </div>
  </div>

  {#if mode === 'family'}
    <div class="mt-7 space-y-6">
      <div>
        <label for="seniors" class="flex items-baseline justify-between gap-4 text-sm font-semibold text-ink-800">
          <span>Người cao tuổi trong nhà</span>
          <span class="font-mono text-lg font-bold text-jade-700">{seniors} / 4</span>
        </label>
        <input
          id="seniors"
          type="range"
          min="1"
          max="4"
          step="1"
          bind:value={seniors}
          aria-describedby="seniors-hint"
          class="mt-2 w-full accent-jade-600"
        />
        <p id="seniors-hint" class="mt-1 text-xs leading-relaxed text-ink-600">
          Family Plus phủ tới 4 người trong cùng một nhà, một giá cho cả hộ.
        </p>
      </div>

      <label class="flex items-center justify-between gap-4 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3">
        <span class="text-sm font-semibold text-ink-800">Trả theo năm, tặng 2 tháng</span>
        <input type="checkbox" bind:checked={annual} class="size-5 accent-jade-600" />
      </label>

      <div class="rounded-2xl bg-ink-900 p-5 text-cream-50" aria-live="polite">
        <p class="text-xs text-cream-50/60">{annual ? 'Cả năm, cho cả hộ' : 'Mỗi tháng, cho cả hộ'}</p>
        {#key annual}
          <p class="price-pop mt-1 font-mono text-4xl font-bold tracking-tight">
            {annual ? usd.format(FAMILY_ANNUAL) : usd.format(FAMILY_MONTHLY)}
            <span class="text-base font-medium text-cream-50/60">/{annual ? 'năm' : 'tháng'}</span>
          </p>
        {/key}
        <p class="mt-1 text-sm text-cream-50/60">
          ≈ {vnd.format((annual ? FAMILY_ANNUAL : FAMILY_MONTHLY) * 23_000)} · tối đa 4 người
        </p>
        {#if annual}
          <p class="mt-3 inline-flex rounded-full bg-jade-500/20 px-3 py-1 text-xs font-semibold text-mint-100">
            Tiết kiệm {usd.format(familySavings)} so với trả từng tháng
          </p>
        {:else}
          <p class="mt-3 text-xs text-cream-50/55">
            Trả theo năm thì tiết kiệm {usd.format(familySavings)}.
          </p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="mt-7 space-y-6">
      <fieldset>
        <legend class="text-sm font-semibold text-ink-800">Gói tích hợp</legend>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          {#each tierOptions as item}
            <button
              type="button"
              onclick={() => (tier = item.key)}
              aria-pressed={tier === item.key}
              class={`rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${tier === item.key ? 'border-jade-600 bg-mint-100/60' : 'border-ink-900/10 bg-cream-50 hover:border-jade-600/40'}`}
            >
              <span class="block text-sm font-bold text-ink-900">{item.label}</span>
              <span class="mt-1 block font-mono text-xs text-ink-600">
                ${item.low.toFixed(2)}–${item.high.toFixed(2)} / người dùng / tháng
              </span>
            </button>
          {/each}
        </div>
        <p class="mt-2 text-xs leading-relaxed text-ink-600">{rate.note}</p>
      </fieldset>

      <fieldset>
        <legend class="text-sm font-semibold text-ink-800">Người dùng hoạt động mỗi tháng (MAU)</legend>
        <div class="mt-3 flex flex-wrap gap-2">
          {#each mauPresets as preset}
            <button
              type="button"
              onclick={() => (mau = preset)}
              aria-pressed={mau === preset}
              class={`rounded-full border px-3 py-1.5 font-mono text-xs font-semibold transition active:scale-[0.96] ${mau === preset ? 'border-ink-900 bg-ink-900 text-cream-50' : 'border-ink-900/15 text-ink-700 hover:border-ink-900/40'}`}
            >
              {compact.format(preset)}
            </button>
          {/each}
        </div>
        <label for="mau" class="mt-4 block text-xs font-medium text-ink-600">
          Hoặc kéo để chọn:
          <span class="font-mono font-bold text-ink-900">{mau.toLocaleString('vi-VN')}</span>
          người dùng
        </label>
        <input
          id="mau"
          type="range"
          min="10000"
          max="2000000"
          step="10000"
          bind:value={mau}
          class="mt-2 w-full accent-jade-600"
        />
      </fieldset>

      <div class="rounded-2xl bg-ink-900 p-5 text-cream-50" aria-live="polite">
        <p class="text-xs text-cream-50/60">Chi phí cấp phép ước tính mỗi tháng</p>
        {#key tier}
          <p class="price-pop mt-1 font-mono text-xl font-bold tracking-tight xl:text-2xl">
            {usd.format(orgLow)} – {usd.format(orgHigh)}
          </p>
        {/key}
        <p class="mt-1 font-mono text-sm text-cream-50/60">
          {usd.format(orgLow * 12)} – {usd.format(orgHigh * 12)} / năm · {compact.format(mau)} người dùng
        </p>
        <p class="mt-3 text-xs leading-relaxed text-cream-50/55">
          Chưa gồm phí tích hợp một lần. Đây là giá sơ bộ để thảo luận, không phải báo giá ràng buộc.
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .price-pop {
    animation: price-pop 0.35s var(--ease-out-expo) both;
  }

  input[type='range'] {
    height: 2.75rem;
    cursor: pointer;
  }

  @keyframes price-pop {
    from {
      opacity: 0.4;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
