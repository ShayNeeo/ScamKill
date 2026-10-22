/// <reference lib="dom" />
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';

const MODAL_SEEN_KEY = 'scamkill.pwa-autoprompt-seen-v2';
const BANNER_DISMISS_KEY = 'scamkill.pwa-banner-dismissed-v2';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __scamkillDeferredPrompt?: BeforeInstallPromptEvent | null;
    __scamkillInstalled?: boolean;
  }
}

type BrowserKind = 'chromium' | 'firefox-android' | 'firefox-desktop' | 'ios-safari' | 'other';

function detectBrowserKind(ua: string): BrowserKind {
  const lower = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(lower)) return 'ios-safari';
  if (lower.includes('firefox') && lower.includes('android')) return 'firefox-android';
  if (lower.includes('firefox')) return 'firefox-desktop';
  if (lower.includes('chrome') || lower.includes('edg') || lower.includes('samsungbrowser')) {
    return 'chromium';
  }
  return 'other';
}

export function PwaInstallBanner() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const [isStandalone, setIsStandalone] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [browserKind, setBrowserKind] = useState<BrowserKind>('other');
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'manual_guide'>('idle');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.__scamkillInstalled === true;

    if (standalone) {
      setIsStandalone(true);
      return;
    }

    const ua = window.navigator?.userAgent ?? '';
    setBrowserKind(detectBrowserKind(ua));

    if (window.__scamkillDeferredPrompt) {
      setInstallEvent(window.__scamkillDeferredPrompt);
    }

    try {
      if (window.localStorage?.getItem(BANNER_DISMISS_KEY) === '1') {
        setBannerDismissed(true);
      }
    } catch {
      // ignore storage errors
    }

    const onPromptAvailable = () => {
      if (window.__scamkillDeferredPrompt) {
        setInstallEvent(window.__scamkillDeferredPrompt);
      }
    };

    const onInstalled = () => {
      setIsStandalone(true);
      setShowAutoModal(false);
      setInstallStatus('installed');
    };

    window.addEventListener('scamkill:pwa-prompt-available', onPromptAvailable);
    window.addEventListener('scamkill:pwa-installed', onInstalled);
    const directHandler = (event: Event) => {
      event.preventDefault();
      window.__scamkillDeferredPrompt = event as BeforeInstallPromptEvent;
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', directHandler);

    let timer: number | undefined;
    try {
      const alreadySeen = window.sessionStorage?.getItem(MODAL_SEEN_KEY) === '1';
      if (!alreadySeen) {
        timer = window.setTimeout(() => {
          setShowAutoModal(true);
        }, 1100);
      }
    } catch {
      timer = window.setTimeout(() => setShowAutoModal(true), 1100);
    }

    return () => {
      window.removeEventListener('scamkill:pwa-prompt-available', onPromptAvailable);
      window.removeEventListener('scamkill:pwa-installed', onInstalled);
      window.removeEventListener('beforeinstallprompt', directHandler);
      clearTimeout(timer);
    };
  }, []);

  if (Platform.OS !== 'web' || isStandalone) return null;

  const closeAutoModal = () => {
    setShowAutoModal(false);
    try {
      window.sessionStorage?.setItem(MODAL_SEEN_KEY, '1');
    } catch {
      // ignore
    }
  };

  const dismissTopBar = () => {
    setBannerDismissed(true);
    try {
      window.localStorage?.setItem(BANNER_DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const triggerNativeInstall = async () => {
    const promptObj = installEvent || (typeof window !== 'undefined' ? window.__scamkillDeferredPrompt : null);
    if (promptObj) {
      try {
        await promptObj.prompt();
        const choice = await promptObj.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallEvent(null);
          window.__scamkillDeferredPrompt = null;
          setShowAutoModal(false);
          setIsStandalone(true);
          return;
        }
      } catch {
        // Fallback to showing step-by-step browser guide inside modal
      }
    }
    setInstallStatus('manual_guide');
    setShowAutoModal(true);
  };

  const renderBrowserSpecificGuide = () => {
    if (browserKind === 'ios-safari') {
      return (
        <View style={[styles.guideBox, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <ThemedText style={[styles.guideStepTitle, { color: theme.primaryAction }]}>
            {isEn ? 'How to place ScamKill on iPhone / iPad Home Screen:' : 'Cách đặt ScamKill ra Màn hình chính iPhone / iPad:'}
          </ThemedText>
          <ThemedText style={styles.guideStepText}>
            {isEn
              ? '1. Tap the Share icon [↑] at the bottom of Safari.\n2. Scroll down and tap "Add to Home Screen".\n3. Tap "Add" in the top right corner.'
              : '1. Chạm nút Chia sẻ [↑] ở thanh dưới cùng của Safari.\n2. Kéo xuống và chạm vào dòng "Thêm vào Màn hình chính".\n3. Chạm chữ "Thêm" ở góc trên bên phải.'}
          </ThemedText>
        </View>
      );
    }

    if (browserKind === 'firefox-android' || browserKind === 'firefox-desktop') {
      return (
        <View style={[styles.guideBox, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
          <ThemedText style={[styles.guideStepTitle, { color: theme.primaryAction }]}>
            {isEn ? 'How to install on Firefox:' : 'Cách đặt ra Màn hình chính trên Firefox:'}
          </ThemedText>
          <ThemedText style={styles.guideStepText}>
            {isEn
              ? '1. Tap the 3-dots menu (⋮) in the Firefox address bar.\n2. Tap "Install" or "Add app to Home screen".\n3. Confirm "Add" so Mom/Dad can open it in 1 tap.'
              : '1. Chạm biểu tượng 3 chấm (⋮) ở góc trình duyệt Firefox.\n2. Chọn "Cài đặt" (Install) hoặc "Thêm vào màn hình chính".\n3. Bấm "Thêm" để Bố/Mẹ mở nhanh chỉ bằng 1 chạm.'}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={[styles.guideBox, { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder }]}>
        <ThemedText style={[styles.guideStepTitle, { color: theme.primaryAction }]}>
          {isEn ? 'Install via Chrome / Edge / Browser menu:' : 'Đặt nhanh ra Màn hình chính trên Chrome / Cốc Cốc:'}
        </ThemedText>
        <ThemedText style={styles.guideStepText}>
          {isEn
            ? '1. Tap the install icon [⊕] in the address bar or the 3-dots menu (⋮).\n2. Select "Install app" or "Add to Home screen".'
            : '1. Chạm nút Cài đặt [⊕] trên thanh địa chỉ hoặc menu 3 chấm (⋮) góc phải.\n2. Chọn "Cài đặt ứng dụng" (Install app) hoặc "Thêm vào màn hình chính".'}
        </ThemedText>
      </View>
    );
  };

  return (
    <>
      {!bannerDismissed ? (
        <View style={[styles.banner, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
          <View style={styles.leftRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.primaryAction }]}>
              <Ionicons name="shield-checkmark" size={22} color={theme.primaryActionText} />
            </View>
            <View style={styles.textWrap}>
              <ThemedText style={styles.title}>
                {isEn
                  ? 'Put ScamKill on the Home Screen for 1-tap protection'
                  : 'Đặt ScamKill ra Màn hình chính cho Bố/Mẹ'}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {installEvent
                  ? isEn
                    ? 'Ready to install: opens full-screen like a native app, even offline.'
                    : 'Cài 1 chạm: mở toàn màn hình chữ to, chạy ngay cả khi mạng yếu.'
                  : isEn
                    ? 'Works on both iPhone (Safari) and Android (Chrome/Firefox).'
                    : 'Mở nhanh 1 chạm như ứng dụng thật trên cả iPhone và Android.'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={triggerNativeInstall}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Install ScamKill to Home Screen' : 'Cài đặt ScamKill ra màn hình chính'}
              style={({ pressed }) => [
                styles.installBtn,
                { backgroundColor: theme.primaryAction, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}>
              <Ionicons name="download-outline" size={18} color={theme.primaryActionText} />
              <ThemedText style={[styles.installText, { color: theme.primaryActionText }]}>
                {installEvent
                  ? isEn
                    ? 'Install in 1 Tap'
                    : 'Cài ngay (1 chạm)'
                  : isEn
                    ? 'How to Install'
                    : 'Cài ra màn hình'}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={dismissTopBar}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Dismiss install banner' : 'Đóng thanh nhắc cài đặt'}
              style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Active Auto-Popup Native-Style Bottom Sheet Recommendation */}
      <Modal visible={showAutoModal} transparent animationType="slide" onRequestClose={closeAutoModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <View style={[styles.sheetAppIcon, { backgroundColor: theme.primaryAction }]}>
                <Ionicons name="shield-checkmark" size={30} color={theme.primaryActionText} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sheetTitle}>
                  {isEn ? 'Add ScamKill to Home Screen?' : 'Đặt ScamKill ra Màn hình chính?'}
                </ThemedText>
                <ThemedText style={[styles.sheetDomain, { color: theme.textSecondary }]}>
                  {isEn
                    ? 'Recommended so older adults can tap once during a suspicious call'
                    : 'Giúp Bố/Mẹ bấm "Kiểm tra" ngay khi có cuộc gọi xin tiền gấp'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.benefitList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.riskSafe} />
                <ThemedText style={styles.benefitText}>
                  {isEn
                    ? 'Opens full-screen with extra-large letters'
                    : 'Nằm ngay ngoài màn hình chính, chữ to, không cần tìm trình duyệt'}
                </ThemedText>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.riskSafe} />
                <ThemedText style={styles.benefitText}>
                  {isEn
                    ? 'Works offline for Family Safe-Word & emergency pause'
                    : 'Xem ngay "Mã gia đình" và báo cho con cháu chỉ bằng 1 chạm'}
                </ThemedText>
              </View>
            </View>

            {installEvent && installStatus !== 'manual_guide' ? (
              <Pressable
                onPress={triggerNativeInstall}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.sheetPrimaryBtn,
                  { backgroundColor: theme.primaryAction, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}>
                <Ionicons name="add-circle-outline" size={24} color={theme.primaryActionText} />
                <ThemedText style={[styles.sheetPrimaryBtnText, { color: theme.primaryActionText }]}>
                  {isEn ? 'Install ScamKill Now' : 'Cài đặt ứng dụng ScamKill ngay'}
                </ThemedText>
              </Pressable>
            ) : (
              renderBrowserSpecificGuide()
            )}

            <Pressable
              onPress={closeAutoModal}
              accessibilityRole="button"
              style={[styles.sheetSecondaryBtn, { borderColor: theme.cardBorder }]}>
              <ThemedText style={[styles.sheetSecondaryText, { color: theme.textSecondary }]}>
                {isEn ? 'Continue in browser for now' : 'Để sau, dùng thử trên trình duyệt trước'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 220,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  installText: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    width: '100%',
    maxWidth: 640,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 3,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetAppIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
  },
  sheetDomain: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2,
  },
  benefitList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 16,
    lineHeight: 23,
    flex: 1,
  },
  guideBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  guideStepTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  guideStepText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sheetPrimaryBtn: {
    minHeight: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  sheetPrimaryBtnText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  sheetSecondaryBtn: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheetSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PwaInstallBanner;
