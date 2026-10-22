<script lang="ts">
  import { subscribeLang, type Lang } from '../lib/i18n';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'nav';
  type Mode = 'lead' | 'auth';
  type AuthMode = 'login' | 'signup';

  interface Props {
    triggerLabel?: string;
    variant?: Variant;
    initialMode?: Mode;
    compact?: boolean;
  }

  let { triggerLabel, variant = 'primary', initialMode = 'lead', compact = false }: Props = $props();

  const variantClass: Record<Variant, string> = {
    primary:
      'bg-amber-400 text-ink-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 focus-visible:outline-amber-300',
    secondary:
      'border border-white/25 bg-white/10 text-cream-50 hover:bg-white/20 focus-visible:outline-cream-50',
    ghost:
      'border border-ink-900/15 bg-white text-ink-900 hover:border-jade-600 hover:text-jade-700 focus-visible:outline-jade-600',
    nav: 'bg-ink-900 text-cream-50 hover:bg-ink-800 focus-visible:outline-ink-900',
  };

  let lang = $state<Lang>('en');
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

  $effect(() => subscribeLang((next) => (lang = next)));

  const copy = {
    en: {
      triggerLead: 'Join the pilot',
      triggerAuth: 'Sign in',
      titleLead: 'Pilot news and pricing',
      titleAuth: 'Dashboard sign-in',
      leadBody:
        'Leave a phone number and the team will help install the PWA and run a session with your family. No spam.',
      authBody: 'For the team and testing partners: leads, sessions, and D1 on the edge.',
      tabLead: 'Pilot news',
      tabAuth: 'Sign in',
      successTitle: 'Received. Thank you.',
      successBody:
        'The ScamKill team will contact you within 1 to 2 business days. Meanwhile, try the Mrs. Lan scenario on this page.',
      close: 'Close',
      closeDialog: 'Close dialog',
      fullName: 'Full name',
      phone: 'Phone number',
      phonePlaceholder: '09xx xxx xxx',
      role: 'You are',
      roleFamily: 'Child or grandchild of an older adult',
      roleSenior: 'Older adult',
      roleBank: 'Bank or finance',
      roleTelco: 'Telecom carrier',
      roleOther: 'Other',
      city: 'Province or city',
      consent:
        'I agree to be contacted about the pilot program. My data is used for this purpose and I can ask for deletion at any time.',
      sending: 'Sending...',
      submitLead: 'Send my details',
      email: 'Email',
      password: 'Password',
      passwordHint: 'At least 8 characters. Passwords are hashed with PBKDF2 before D1 storage.',
      processing: 'Working...',
      createAccount: 'Create account',
      signIn: 'Sign in',
      toSignup: 'No account yet? Create a test account',
      toLogin: 'Already have an account? Sign in',
      errorLead: 'Could not send. Please try again.',
      errorAuth: 'Could not sign in.',
      errorNetwork: 'Connection lost. Please try again.',
      name: 'Name',
      chooseForm: 'Choose form type',
    },
    vi: {
      triggerLead: 'Đăng ký thử nghiệm',
      triggerAuth: 'Đăng nhập',
      titleLead: 'Nhận tin thử nghiệm và báo giá',
      titleAuth: 'Đăng nhập bảng điều khiển',
      leadBody:
        'Để lại số điện thoại để đội ngũ liên hệ cài đặt PWA và chạy thử cùng gia đình bạn. Không spam.',
      authBody: 'Dành cho đội ngũ và đối tác kiểm thử lead, phiên đăng nhập, D1 trên edge.',
      tabLead: 'Nhận tin',
      tabAuth: 'Đăng nhập',
      successTitle: 'Đã ghi nhận. Cảm ơn bạn!',
      successBody:
        'Đội ngũ ScamKill sẽ liên hệ trong 1 đến 2 ngày làm việc. Trong lúc chờ, hãy thử kịch bản Bà Lan ngay trên trang này.',
      close: 'Đóng',
      closeDialog: 'Đóng hộp thoại',
      fullName: 'Họ tên',
      phone: 'Số điện thoại',
      phonePlaceholder: '09xx xxx xxx',
      role: 'Bạn là',
      roleFamily: 'Con hoặc cháu của người cao tuổi',
      roleSenior: 'Người cao tuổi',
      roleBank: 'Ngân hàng hoặc tài chính',
      roleTelco: 'Nhà mạng viễn thông',
      roleOther: 'Khác',
      city: 'Tỉnh hoặc thành phố',
      consent:
        'Tôi đồng ý được liên hệ về chương trình thử nghiệm. Dữ liệu dùng cho mục đích này và có thể yêu cầu xoá bất cứ lúc nào.',
      sending: 'Đang gửi...',
      submitLead: 'Gửi đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      passwordHint: 'Tối thiểu 8 ký tự. Mật khẩu được băm PBKDF2 trước khi lưu D1.',
      processing: 'Đang xử lý...',
      createAccount: 'Tạo tài khoản',
      signIn: 'Đăng nhập',
      toSignup: 'Chưa có tài khoản? Tạo tài khoản thử nghiệm',
      toLogin: 'Đã có tài khoản? Đăng nhập',
      errorLead: 'Không gửi được. Vui lòng thử lại.',
      errorAuth: 'Không đăng nhập được.',
      errorNetwork: 'Mất kết nối. Vui lòng thử lại.',
      name: 'Tên',
      chooseForm: 'Chọn hình thức',
    },
  };
  const t = $derived(copy[lang]);
  const buttonLabel = $derived(
    triggerLabel ?? (initialMode === 'auth' ? t.triggerAuth : t.triggerLead),
  );

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
        feedback = data.error ?? t.errorLead;
        return;
      }
      success = true;
      leadName = '';
      leadPhone = '';
      leadCity = '';
      leadConsent = false;
    } catch {
      feedback = t.errorNetwork;
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
        feedback = data.error ?? t.errorAuth;
        return;
      }
      window.location.assign('/dashboard');
    } catch {
      feedback = t.errorNetwork;
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
  class={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? 'px-4 py-2 text-sm' : 'px-5 py-3 text-base'} ${variantClass[variant]}`}
>
  {buttonLabel}
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
        aria-label={t.closeDialog}
        class="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-700 transition hover:bg-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
      >
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" stroke-linecap="round" />
        </svg>
      </button>

      <h2 id="lead-modal-title" class="mt-1 font-display text-2xl font-semibold text-ink-900">
        {mode === 'lead' ? t.titleLead : t.titleAuth}
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-ink-700">
        {mode === 'lead' ? t.leadBody : t.authBody}
      </p>

      <div class="mt-5 inline-flex rounded-xl border border-ink-900/10 bg-white p-1" role="group" aria-label={t.chooseForm}>
        <button
          type="button"
          onclick={() => { mode = 'lead'; feedback = ''; }}
          aria-pressed={mode === 'lead'}
          class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'lead' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-cream-50'}`}
        >
          {t.tabLead}
        </button>
        <button
          type="button"
          onclick={() => { mode = 'auth'; feedback = ''; }}
          aria-pressed={mode === 'auth'}
          class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'auth' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-cream-50'}`}
        >
          {t.tabAuth}
        </button>
      </div>

      {#if success}
        <div class="mt-6 rounded-2xl border border-jade-600/30 bg-mint-100/70 p-5" role="status">
          <p class="font-bold text-jade-800">{t.successTitle}</p>
          <p class="mt-1 text-sm text-ink-700">{t.successBody}</p>
          <button type="button" onclick={close} class="mt-4 rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-cream-50">
            {t.close}
          </button>
        </div>
      {:else if mode === 'lead'}
        <form class="mt-6 space-y-4" onsubmit={submitLead} novalidate>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="lead-name" class="block text-sm font-semibold text-ink-800">{t.fullName}</label>
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
              <label for="lead-phone" class="block text-sm font-semibold text-ink-800">{t.phone}</label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                required
                placeholder={t.phonePlaceholder}
                bind:value={leadPhone}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="lead-role" class="block text-sm font-semibold text-ink-800">{t.role}</label>
              <select
                id="lead-role"
                bind:value={leadRole}
                class="mt-1.5 w-full rounded-xl border border-ink-900/15 bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition focus:border-jade-600 focus:ring-2 focus:ring-jade-600/20"
              >
                <option value="family">{t.roleFamily}</option>
                <option value="senior">{t.roleSenior}</option>
                <option value="bank">{t.roleBank}</option>
                <option value="telco">{t.roleTelco}</option>
                <option value="other">{t.roleOther}</option>
              </select>
            </div>
            <div>
              <label for="lead-city" class="block text-sm font-semibold text-ink-800">{t.city}</label>
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
            <span>{t.consent}</span>
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
            {busy ? t.sending : t.submitLead}
          </button>
        </form>
      {:else}
        <form class="mt-6 space-y-4" onsubmit={submitAuth}>
          {#if authMode === 'signup'}
            <div>
              <label for="auth-name" class="block text-sm font-semibold text-ink-800">{t.name}</label>
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
            <label for="auth-email" class="block text-sm font-semibold text-ink-800">{t.email}</label>
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
            <label for="auth-password" class="block text-sm font-semibold text-ink-800">{t.password}</label>
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
            <p class="mt-1 text-xs text-ink-600">{t.passwordHint}</p>
          </div>

          {#if feedback}
            <p class="rounded-xl border border-clay-500/30 bg-clay-500/10 px-3 py-2 text-sm text-clay-600" role="alert">{feedback}</p>
          {/if}

          <button
            type="submit"
            disabled={busy}
            class="w-full rounded-xl bg-jade-600 px-4 py-3 text-base font-bold text-white transition hover:bg-jade-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
          >
            {busy ? t.processing : authMode === 'signup' ? t.createAccount : t.signIn}
          </button>

          <button
            type="button"
            onclick={() => { authMode = authMode === 'login' ? 'signup' : 'login'; feedback = ''; }}
            class="w-full text-center text-sm font-semibold text-jade-700 underline decoration-jade-600/30 underline-offset-4 hover:decoration-jade-600"
          >
            {authMode === 'login' ? t.toSignup : t.toLogin}
          </button>
        </form>
      {/if}
    </div>
  </div>
{/if}
