/// <reference lib="dom" />
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { Accessibility } from '@/theme/tokens';
import { Spacing } from '@/constants/theme';

const DISMISS_KEY = 'scamkill.pwa-banner-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
    const ua = window.navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document));
    setIsAndroid(/Android/.test(ua));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (Platform.OS !== 'web' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode may block storage */
    }
  };

  const install = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } catch {
      /* user dismissed or browser refused the prompt */
    }
    setInstallEvent(null);
  };

  const instructions = isIos
    ? isEn
      ? 'iOS Safari: Tap Share -> Add to Home Screen'
      : 'iOS Safari: Bấm Chia sẻ -> Thêm vào MH chính'
    : isAndroid
      ? isEn
        ? 'Android Chrome: Tap Install app ScamKill'
        : 'Android Chrome: Bấm Cài đặt ứng dụng ScamKill'
      : isEn
        ? 'Open this page on your phone to install ScamKill as an app'
        : 'Mở trang này trên điện thoại để cài ScamKill như ứng dụng';

  return (
    <View style={[styles.banner, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
      <Ionicons name="phone-portrait-outline" size={28} color={theme.primaryAction} />
      <View style={styles.copy}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {isEn ? 'Dev team: test ScamKill as an app (1 tap)' : 'Đội dev: test ScamKill như app (1 chạm)'}
        </ThemedText>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>{instructions}</ThemedText>
        {installEvent && (
          <Pressable
            style={[styles.installButton, { backgroundColor: theme.primaryAction }]}
            onPress={install}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Install ScamKill' : 'Cài đặt ScamKill'}>
            <ThemedText style={[styles.installText, { color: theme.primaryActionText }]}>
              {isEn ? 'Install ScamKill' : 'Cài đặt ScamKill'}
            </ThemedText>
          </Pressable>
        )}
      </View>
      <Pressable
        style={styles.close}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={isEn ? 'Dismiss install banner' : 'Đóng gợi ý cài đặt'}>
        <Ionicons name="close" size={24} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: 2,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  copy: { flex: 1, gap: Spacing.one },
  title: { fontSize: Accessibility.fontSize.normal, fontWeight: '700' },
  body: { fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  installButton: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
    minHeight: Accessibility.minTouchSize,
    justifyContent: 'center',
  },
  installText: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  close: { padding: Spacing.one, minWidth: 32, minHeight: 32, alignItems: 'center' },
});

export default PwaInstallBanner;
