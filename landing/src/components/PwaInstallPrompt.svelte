<script lang="ts">
  import { subscribeLang, type Lang } from '../lib/i18n';

  interface Props {
    appUrl?: string;
  }

  interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  let { appUrl = 'https://scamkill-pwa.9ez.workers.dev' }: Props = $props();

  type View = 'hidden' | 'card' | 'pill';
  type Device = 'ios' | 'android' | 'desktop';

  const STORAGE_KEY = 'scamkill:pwa-prompt';
  const launchUrl = $derived(`${appUrl}?autoinstall=1`);

  let lang = $state<Lang>('en');
  let view = $state<View>('hidden');
  let device = $state<Device>('desktop');
  let inAppBrowser = $state(false);
  let installEvent = $state<InstallPromptEvent | null>(null);
  let copied = $state(false);

  $effect(() => subscribeLang((next) => (lang = next)));

  const copy = {
    en: {
      pill: 'Install ScamKill',
      title: 'Install ScamKill on the home screen (iOS and Android)',
      body: 'One tap to open whenever a strange call arrives. Works on patchy networks, no App Store required.',
      inAppTitle: 'You are inside another app',
      inAppBody:
        'Tap the menu in the top corner and choose Open in Safari (iPhone) or Open in Chrome (Android), then follow the steps below.',
      copy: 'Copy',
      copied: 'Copied',
      cta: 'Open and install in one tap',
      later: 'Later',
      fine: 'No sign-in needed. No notifications unless you agree.',
      close: 'Close the install prompt',
      devices: {
        ios: {
          label: 'You are on iPhone or iPad',
          body: 'Open in Safari, tap Share [↑] on the bottom bar, then choose Add to Home Screen.',
        },
        android: {
          label: 'You are on Android',
          body: 'Open in Chrome or Firefox, tap the three-dot menu, then choose Install app or Add to Home Screen.',
        },
        desktop: {
          label: 'You are on a computer',
          body: 'Open the link below on your phone, or copy it and send it to a family member over Zalo.',
        },
      },
    },
    vi: {
      pill: 'Cài ScamKill',
      title: 'Cài ứng dụng ScamKill ra màn hình chính (iOS và Android)',
      body: 'Mở một chạm mỗi khi có cuộc gọi lạ. Dùng được cả khi mạng chập chờn, không cần vào App Store.',
      inAppTitle: 'Bạn đang mở trong ứng dụng khác',
      inAppBody:
        'Chạm nút “…” ở góc trên và chọn “Mở bằng Safari” (iPhone) hoặc “Mở bằng Chrome” (Android), rồi làm theo hướng dẫn bên dưới.',
      copy: 'Sao chép',
      copied: 'Đã chép',
      cta: 'Mở và cài trong 1 chạm',
      later: 'Để sau',
      fine: 'Không cần đăng nhập. Không gửi thông báo nếu bạn không đồng ý.',
      close: 'Đóng lời mời cài ứng dụng',
      devices: {
        ios: {
          label: 'Bạn đang dùng iPhone hoặc iPad',
          body: 'Mở bằng Safari, chạm nút Chia sẻ [↑] ở thanh dưới, rồi chọn “Thêm vào Màn hình chính”.',
        },
        android: {
          label: 'Bạn đang dùng Android',
          body: 'Mở bằng Chrome hoặc Firefox, chạm menu ba chấm ở góc trên, rồi chọn “Cài đặt ứng dụng” hoặc “Thêm vào Màn hình chính”.',
        },
        desktop: {
          label: 'Bạn đang dùng máy tính',
          body: 'Mở đường link dưới đây trên điện thoại, hoặc sao chép rồi gửi qua Zalo cho người thân.',
        },
      },
    },
  };
  const t = $derived(copy[lang]);

  function detectDevice() {
    const ua = navigator.userAgent;
    const iPadOnDesktop = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    device = /iPhone|iPad|iPod/i.test(ua) || iPadOnDesktop ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
    inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Zalo|Line\//i.test(ua);
  }

  function closeToPill() {
    view = 'pill';
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* storage blocked: hide for this session only */
    }
  }

  async function launch(event: MouseEvent) {
    if (!installEvent) return; // No native event: let the link open the PWA.
    event.preventDefault();
    const promptEvent = installEvent;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    installEvent = null;
    if (choice.outcome === 'accepted') {
      view = 'hidden';
      try {
        localStorage.setItem(STORAGE_KEY, 'dismissed');
      } catch {
        /* ignore */
      }
    } else {
      // Browsers may block popups after an await; same-tab navigation is the reliable fallback.
      const opened = window.open(launchUrl, '_blank', 'noopener');
      if (!opened) window.location.assign(launchUrl);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(appUrl);
      copied = true;
      window.setTimeout(() => (copied = false), 2200);
    } catch {
      copied = false;
    }
  }

  $effect(() => {
    detectDevice();

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === 'dismissed';
    } catch {
      dismissed = false;
    }
    if (dismissed) {
      view = 'pill';
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      installEvent = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      view = 'hidden';
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    const timer = window.setTimeout(() => {
      view = 'card';
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && view === 'card') closeToPill();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if view === 'pill'}
  <button
    type="button"
    onclick={() => (view = 'card')}
    class="prompt-pill fixed bottom-4 right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-900/10 bg-white py-2.5 pl-3 pr-4 text-sm font-bold text-ink-900 shadow-lg shadow-ink-950/15 transition hover:border-jade-600/40 hover:text-jade-700 active:scale-[0.98] sm:bottom-6 sm:right-6"
  >
    <span class="grid size-6 place-items-center rounded-full bg-ink-900 text-amber-400">
      <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M4.5 17.5v1A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-1" stroke-linecap="round" />
      </svg>
    </span>
    {t.pill}
  </button>
{:else if view === 'card'}
  <aside
    class="prompt-sheet fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[25rem]"
    aria-labelledby="pwa-prompt-title"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="relative overflow-hidden rounded-3xl border border-ink-900/10 bg-white p-5 shadow-2xl shadow-ink-950/25 sm:p-6">
      <div class="flex items-start justify-between gap-3">
        <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink-900 text-amber-400">
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="6" y="2.5" width="12" height="19" rx="3" />
            <path d="M12 7v7m0 0 3-3m-3 3-3-3M10 18.5h4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <button
          type="button"
          onclick={closeToPill}
          aria-label={t.close}
          class="grid size-11 place-items-center rounded-full text-ink-600 transition hover:bg-cream-100 hover:text-ink-900 active:scale-95"
        >
          <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <h2 id="pwa-prompt-title" class="mt-3 text-lg font-bold leading-snug text-ink-900">
        {t.title}
      </h2>
      <p class="mt-2 text-[15px] leading-relaxed text-ink-700">{t.body}</p>

      {#if inAppBrowser}
        <div class="mt-4 rounded-2xl border border-amber-500/40 bg-amber-400/10 p-3.5">
          <p class="text-base font-semibold text-ink-900">{t.inAppTitle}</p>
          <p class="mt-1 text-[15px] leading-relaxed text-ink-700">{t.inAppBody}</p>
        </div>
      {:else}
        <div class="mt-4 rounded-2xl bg-cream-50 p-3.5">
          <p class="text-xs font-bold uppercase tracking-wider text-jade-700">{t.devices[device].label}</p>
          <p class="mt-1.5 text-[15px] leading-relaxed text-ink-700">{t.devices[device].body}</p>
        </div>
      {/if}

      {#if device === 'desktop'}
        <div class="mt-3 flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-3 py-2">
          <code class="min-w-0 flex-1 truncate font-mono text-xs text-ink-700">{appUrl}</code>
          <button
            type="button"
            onclick={copyLink}
            class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-jade-700 transition hover:bg-mint-100 active:scale-95"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
      {/if}

      <div class="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={launchUrl}
          onclick={launch}
          target="_blank"
          rel="noopener"
          class="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-3 text-base font-bold text-cream-50 transition hover:bg-ink-800 active:scale-[0.98]"
        >
          {t.cta}
          <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
        <button
          type="button"
          onclick={closeToPill}
          class="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-ink-600 transition hover:bg-cream-100 hover:text-ink-900 active:scale-[0.98]"
        >
          {t.later}
        </button>
      </div>

      <p class="mt-3 text-xs leading-relaxed text-ink-500">{t.fine}</p>
    </div>
  </aside>
{/if}

<style>
  .prompt-sheet {
    animation: sheet-in 0.55s var(--ease-out-expo) both;
  }

  .prompt-pill {
    animation: pill-in 0.35s var(--ease-out-expo) both;
  }

  @keyframes sheet-in {
    from {
      opacity: 0;
      translate: 0 22px;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes pill-in {
    from {
      opacity: 0;
      scale: 0.94;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @media (max-width: 639px) {
    .prompt-sheet > div {
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
    }
  }
</style>
