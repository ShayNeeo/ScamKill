export type Lang = 'en' | 'vi';

const STORAGE_KEY = 'scamkill.lang';
const EVENT_NAME = 'scamkill:lang';

const listeners = new Set<(lang: Lang) => void>();

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'vi';
}

function storedLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = 'en';

function paintDocument(lang: Lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

function notify() {
  for (const listener of listeners) listener(current);
}

if (typeof window !== 'undefined') {
  current = storedLang();
  paintDocument(current);

  window.addEventListener(EVENT_NAME, (event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    current = isLang(detail) ? detail : storedLang();
    paintDocument(current);
    notify();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    current = isLang(event.newValue) ? event.newValue : 'en';
    paintDocument(current);
    notify();
  });
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  paintDocument(lang);
  if (typeof window === 'undefined') {
    notify();
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage blocked: language still switches for this page */
  }
  window.dispatchEvent(new CustomEvent<Lang>(EVENT_NAME, { detail: lang }));
}

export function subscribeLang(callback: (lang: Lang) => void): () => void {
  listeners.add(callback);
  callback(current);
  return () => {
    listeners.delete(callback);
  };
}

/** Re-apply the stored language after hydration; safe to call on every page. */
export function initLang() {
  if (typeof window === 'undefined') return;
  current = storedLang();
  paintDocument(current);
}
