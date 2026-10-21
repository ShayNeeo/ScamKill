<script lang="ts">
  type Variant = 'primary' | 'secondary' | 'ghost' | 'nav';
  type Mode = 'lead' | 'auth';
  type AuthMode = 'login' | 'signup';

  interface Props {
    triggerLabel?: string;
    variant?: Variant;
    initialMode?: Mode;
    compact?: boolean;
  }

  let {
    triggerLabel = 'Đăng ký nhận tin',
    variant = 'primary',
    initialMode = 'lead',
    compact = false,
  }: Props = $props();

  const variantClass: Record<Variant, string> = {
    primary:
      'bg-amber-400 text-ink-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 focus-visible:outline-amber-300',
    secondary:
      'border border-white/25 bg-white/10 text-cream-50 hover:bg-white/20 focus-visible:outline-cream-50',
    ghost:
      'border border-ink-900/15 bg-white text-ink-900 hover:border-jade-600 hover:text-jade-700 focus-visible:outline-jade-600',
    nav: 'bg-ink-900 text-cream-50 hover:bg-ink-800 focus-visible:outline-ink-900',
  };

  let open = $state(false);
  let mode = $state<Mode>('lead');
  let authMode = $state<AuthMode>('login');
  let busy = $state(false);
  let feedback = $state('');
  let success = $state(false);
  let dialogEl: HTMLDivElement | undefined = $state();
  let triggerEl: HTMLButtonElement | undefined = $state();

  let leadName = $state('');
  let leadPhone = $state('');
  let leadCity = $state('');
  let leadRole = $state('family');
  let leadConsent = $state(false);
  let website = $state(''); // honeypot

  let email = $state('');
  let password = $state('');
  let accountName = $state('');

  $effect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      dialogEl?.querySelector<HTMLInputElement>('input:not([type="checkbox"]):not([tabindex="-1"])')?.focus();
    }, 30);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  });

  function show(nextMode: Mode) {
    mode = nextMode;
    feedback = '';
    success = false;
    open = true;
  }

  function close() {
    open = false;
    feedback = '';
    triggerEl?.focus();
  }

  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !dialogEl) return;
    const focusable = Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) close();
  }

  function onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }

  async function submitLead(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    if (website) {
      success = true;
      return;
    }
    feedback = '';
    busy = true;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          city: leadCity,
          role: leadRole,
          consent: leadConsent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback = data.error ?? 'Không gửi được. Vui lòng thử lại.';
        return;
      }
      success = true;
      leadName = '';
      leadPhone = '';
      leadCity = '';
      leadConsent = false;
    } catch {
      feedback = 'Mất kết nối. Vui lòng thử lại.';
    } finally {
      busy = false;
    }
  }

  async function submitAuth(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    feedback = '';
    busy = true;
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: authMode, email, password, name: accountName }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback = data.error ?? 'Không đăng nhập được.';
        return;
      }
      window.location.assign('/dashboard');
    } catch {
      feedback = 'Mất kết nối. Vui lòng thử lại.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<button
  type="button"
  bind:this={triggerEl}
  onclick={() => show(initialMode)}
  aria-haspopup="dialog"
  aria-expanded={open}
  class={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3 text-base'} ${variantClass[variant]}`}
>
  {triggerLabel}
  <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

{#if open}
  <div
    class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm"
    role="presentation"
    onclick={onBackdrop}
  >
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      tabindex="-1"
      onkeydown={trapFocus}
      class="relative my-8 w-full max-w-lg rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl sm:p-8"
    >
      <button
        type="button"
        onclick={close}
        aria-label="Đóng hộp thoại"
        class="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-700 transition hover:bg-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
      >
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" stroke-linecap="round" />
        </svg>
      </button>

      <p class="text-xs font-bold uppercase tracking-[0.18em] text-jade-700">ScamKill · QuadDraKe</p>
      <h2 id="lead-modal-title" class="mt-2 font-serif text-2xl font-semibold text-ink-900">
        {mode === 'lead' ? 'Nhận tin thử nghiệm & báo giá' : 'Đăng nhập bảng điều khiển'}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-ink-700">
        {mode === 'lead'
          ? 'Để lại số điện thoại để đội ngũ liên hệ cài đặt PWA và chạy thử cùng gia đình bạn. Không spam.'
          : 'Dành cho đội ngũ và đối tác kiểm thử lead, phiên đăng nhập, D1 trên edge.'}
      </p>

      <div class="mt-5 inline-flex rounded-xl border border-ink-900/10 bg-white p-1" role="group" aria-label="Chọn hình thức">
        <button
          type="button"
          onclick={() => { mode = 'lead'; feedback = ''; }}
          aria-pressed={mode === 'lead'}
          class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'lead' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-cream-50'}`}
        >
          Nhận tin
        </button>
        <button
          type="button"
          onclick={() => { mode = 'auth'; feedback = ''; }}
          aria-pressed={mode === 'auth'}
          class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'auth' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-cream-50'}`}
        >
          Đăng nhập
        </button>
      </div>

      {#if success}
        <div class="mt-6 rounded-2xl border border-jade-600/30 bg-mint-100/70 p-5" role="status">
          <p class="font-bold text-jade-800">Đã ghi nhận. Cảm ơn bạn!</p>
          <p class="mt-1 text-sm text-ink-700">
            Đội ngũ ScamKill sẽ liên hệ trong 1–2 ngày làm việc. Trong lúc chờ, hãy thử kịch bản Bà Lan ngay trên trang này.
          </p>
          <button type="button" onclick={close} class="mt-4 rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-cream-50">
            Đóng
          </button>
        </div>
      {:else if mode === 'lead'}
        <form class="mt-6 space-y-4" onsubmit={submitLead} novalidate>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="lead-name" class="block text-sm font-semibold text-ink-800">Họ tên</label>
              <input
                id="lead-name"
                name="name"
                type="text"
                autocomplete="name"
                required
                minlength="2"
                maxlength="80"
                bind:value={leadName}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              />
            </div>
            <div>
              <label for="lead-phone" class="block text-sm font-semibold text-ink-800">Số điện thoại</label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                required
                placeholder="09xx xxx xxx"
                bind:value={leadPhone}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="lead-role" class="block text-sm font-semibold text-ink-800">Bạn là</label>
              <select
                id="lead-role"
                bind:value={leadRole}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              >
                <option value="family">Con/cháu của người cao tuổi</option>
                <option value="senior">Người cao tuổi</option>
                <option value="bank">Ngân hàng / tài chính</option>
                <option value="telco">Nhà mạng viễn thông</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label for="lead-city" class="block text-sm font-semibold text-ink-800">Tỉnh / thành phố</label>
              <input
                id="lead-city"
                type="text"
                autocomplete="address-level2"
                maxlength="80"
                bind:value={leadCity}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              />
            </div>
          </div>

          <label class="flex items-start gap-2.5 text-sm text-ink-700">
            <input type="checkbox" bind:checked={leadConsent} required class="mt-0.5 size-4 accent-jade-600" />
            <span>Tôi đồng ý được liên hệ về chương trình thử nghiệm. Dữ liệu dùng cho mục đích này và có thể yêu cầu xoá bất cứ lúc nào.</span>
          </label>

          <div class="hidden" aria-hidden="true">
            <label for="lead-website">Website</label>
            <input id="lead-website" type="text" tabindex="-1" autocomplete="off" bind:value={website} />
          </div>

          {#if feedback}
            <p class="rounded-xl border border-clay-500/30 bg-clay-500/10 px-3 py-2 text-sm text-clay-600" role="alert">{feedback}</p>
          {/if}

          <button
            type="submit"
            disabled={busy}
            class="w-full rounded-xl bg-jade-600 px-4 py-3 text-base font-bold text-white transition hover:bg-jade-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
          >
            {busy ? 'Đang gửi…' : 'Gửi đăng ký'}
          </button>
        </form>
      {:else}
        <form class="mt-6 space-y-4" onsubmit={submitAuth}>
          {#if authMode === 'signup'}
            <div>
              <label for="auth-name" class="block text-sm font-semibold text-ink-800">Tên</label>
              <input
                id="auth-name"
                type="text"
                autocomplete="name"
                maxlength="80"
                bind:value={accountName}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              />
            </div>
          {/if}
          <div>
            <label for="auth-email" class="block text-sm font-semibold text-ink-800">Email</label>
            <input
              id="auth-email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
            />
          </div>
          <div>
            <label for="auth-password" class="block text-sm font-semibold text-ink-800">Mật khẩu</label>
            <input
              id="auth-password"
              type="password"
              autocomplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              required
              minlength="8"
              maxlength="128"
              bind:value={password}
              class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
            />
            <p class="mt-1 text-xs text-ink-600">Tối thiểu 8 ký tự. Mật khẩu được băm PBKDF2 trước khi lưu D1.</p>
          </div>

          {#if feedback}
            <p class="rounded-xl border border-clay-500/30 bg-clay-500/10 px-3 py-2 text-sm text-clay-600" role="alert">{feedback}</p>
          {/if}

          <button
            type="submit"
            disabled={busy}
            class="w-full rounded-xl bg-jade-600 px-4 py-3 text-base font-bold text-white transition hover:bg-jade-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
          >
            {busy ? 'Đang xử lý…' : authMode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onclick={() => { authMode = authMode === 'login' ? 'signup' : 'login'; feedback = ''; }}
            class="w-full text-center text-sm font-semibold text-jade-700 underline decoration-jade-600/30 underline-offset-4 hover:decoration-jade-600"
          >
            {authMode === 'login' ? 'Chưa có tài khoản? Tạo tài khoản thử nghiệm' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </form>
      {/if}
    </div>
  </div>
{/if}
