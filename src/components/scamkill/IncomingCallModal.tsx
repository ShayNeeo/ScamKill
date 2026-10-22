import * as React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

import {
  checkIncomingCallSync,
  getDefaultFamilySafeWord,
} from '@/api/scamkill/client';
import { Fonts } from '@/constants/theme';
import { callSignalLabel, callStatusLabel, localizeCallOutput } from '@/i18n';
import { useLanguageDialect } from '@/i18n/regional';
import { hapticWarning } from '@/lib/haptics';
import { getScenarioCopy } from './ScenarioDrawer';
import type {
  CallCheckInput,
  CallCheckOutput,
  CallRiskStatus,
  ScamKillScenario,
} from '@/api/scamkill/types';

export interface IncomingCallModalProps {
  visible: boolean;
  scenario?: ScamKillScenario | null;
  callInput?: CallCheckInput | null;
  familySafeWord?: string;
  onClose: () => void;
  onTriggerVerifyAndAlert?: (callOutput: CallCheckOutput, shareTranscriptConsent: boolean) => void;
}

const DEFAULT_CLAIM_VI = 'Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp!';
const DEFAULT_CLAIM_EN = 'Mom, I had an accident, please send 30 million right away!';

const FALLBACK_INPUT: CallCheckInput = {
  phoneNumber: '0918 765 432',
  callerClaimedName: 'Con gái (giọng nói giống người thân)',
  inContacts: false,
  burstCallCount: 2,
  asksForUrgentMoney: true,
  spokenTranscriptPreview: DEFAULT_CLAIM_VI,
};

const RISK_META: Record<CallRiskStatus, { color: string; textColor: string }> = {
  high_risk: {
    color: '#B91C1C',
    textColor: '#FFFFFF',
  },
  caution: {
    color: '#D97706',
    textColor: '#1C1917',
  },
  unverified: {
    color: '#475569',
    textColor: '#FFFFFF',
  },
  safe: {
    color: '#0F766E',
    textColor: '#FFFFFF',
  },
};

function bannerHeadline(output: CallCheckOutput, isEn: boolean): string {
  if (output.status === 'high_risk') return localizeCallOutput(output, isEn).badgeLabel;
  if (output.status === 'caution') {
    return localizeCallOutput(output, isEn).badgeLabel;
  }
  if (output.status === 'unverified') {
    return localizeCallOutput(output, isEn).badgeLabel;
  }
  return isEn
    ? 'This number is in your contacts. If they ask for urgent money, verify anyway.'
    : 'Người này có trong danh bạ của mình. Nhưng nếu họ xin chuyển tiền gấp, mình vẫn kiểm tra lại nhé.';
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('84')) {
    return `+84 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return digits.length === 10 ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : raw;
}

function resolveCallOutput(
  callInput?: CallCheckInput | null,
  scenario?: ScamKillScenario | null
): CallCheckOutput {
  const input =
    callInput ?? scenario?.callInput ?? scenario?.expectedCallOutput ?? FALLBACK_INPUT;
  if ('status' in input) return input;
  return checkIncomingCallSync(input);
}

export function IncomingCallModal(props: IncomingCallModalProps): React.JSX.Element | null {
  const {
    visible,
    scenario,
    callInput,
    familySafeWord,
    onClose,
    onTriggerVerifyAndAlert,
  } = props;

  const [shareConsent, setShareConsent] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [ringSeconds, setRingSeconds] = React.useState(0);

  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const rootRef = React.useRef<View>(null);
  const headerRef = React.useRef<View>(null);
  const bannerRef = React.useRef<View>(null);
  const footerRef = React.useRef<View>(null);

  const rippleA = React.useRef(new Animated.Value(0)).current;
  const rippleB = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) return;
    const ripple = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 1, useNativeDriver: true }),
        ])
      );
    const first = ripple(rippleA, 0);
    const second = ripple(rippleB, 900);
    first.start();
    second.start();
    return () => {
      first.stop();
      second.stop();
    };
  }, [visible, rippleA, rippleB]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled) return;
      const scope = rootRef.current as unknown as Element | null;
      const targets = [headerRef.current, bannerRef.current, footerRef.current]
        .filter((node): node is View => Boolean(node))
        .map((node) => node as unknown as Element);
      if (!scope || targets.length === 0) return;

      ctx = gsap.context(() => {
        gsap.from(targets, {
          y: 24,
          opacity: 0,
          duration: 0.5,
          stagger: 0.09,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });
      }, scope);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [visible]);

  const callOutput = React.useMemo(
    () => resolveCallOutput(callInput, scenario),
    [callInput, scenario]
  );
  const meta = RISK_META[callOutput.status];
  const statusLabel = callStatusLabel(callOutput.status, isEn);
  const localized = localizeCallOutput(callOutput, isEn);
  const headline = bannerHeadline(callOutput, isEn);
  const scenarioCopy = scenario ? getScenarioCopy(scenario, isEn) : null;
  const safeWord = familySafeWord || getDefaultFamilySafeWord();
  const callerClaim = isEn
    ? scenarioCopy?.transcript ?? DEFAULT_CLAIM_EN
    : callInput?.spokenTranscriptPreview ||
      scenarioCopy?.transcript ||
      DEFAULT_CLAIM_VI;
  const callerHint = isEn
    ? scenarioCopy?.callerClaim ?? 'Unknown caller'
    : callInput?.callerClaimedName ||
      scenarioCopy?.callerClaim ||
      'Mình chưa rõ người gọi là ai';

  React.useEffect(() => {
    if (!visible) {
      setShareConsent(false);
      setSpeaking(false);
      setRingSeconds(0);
      void Speech.stop();
      return;
    }
    setShareConsent(false);
    if (callOutput.status === 'high_risk' || callOutput.status === 'caution') {
      void hapticWarning();
    }
    setRingSeconds(0);
    const timer = setInterval(() => setRingSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(timer);
      void Speech.stop();
    };
  }, [visible]);

  const handleSpeakPreview = () => {
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      Speech.speak(callerClaim, {
        language: isEn ? 'en-US' : 'vi-VN',
        rate: 0.85,
        pitch: 1,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} ref={rootRef}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}>
          <View style={styles.callHeader} ref={headerRef}>
            <Text style={styles.callLabel}>
              {isEn
                ? '📞 Incoming call · ScamKill is watching'
                : '📞 Có cuộc gọi đến · ScamKill đang canh chừng'}
            </Text>
            <Text style={styles.callSource}>
              {scenario?.id === 'zalo-voice-clone'
                ? isEn
                  ? 'Zalo call (practice simulation)'
                  : 'Cuộc gọi Zalo (bản mô phỏng để tập luyện)'
                : isEn
                  ? 'Phone call (practice simulation)'
                  : 'Cuộc gọi điện thoại (bản mô phỏng để tập luyện)'}
            </Text>

            <View style={styles.callerBadge}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.rippleRing,
                  {
                    borderColor: meta.color,
                    opacity: rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                    transform: [
                      { scale: rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.2] }) },
                    ],
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.rippleRing,
                  {
                    borderColor: meta.color,
                    opacity: rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                    transform: [
                      { scale: rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.2] }) },
                    ],
                  },
                ]}
              />
              <View style={[styles.callerBadgeCore, { backgroundColor: meta.color }]}>
                <Ionicons name="call" size={34} color={meta.textColor} />
              </View>
            </View>

            <Text style={styles.ringing}>
              {isEn ? 'Ringing... 00:' : 'Máy đang đổ chuông… 00:'}
              {String(ringSeconds).padStart(2, '0')}
            </Text>
            <Text style={styles.callerNumber} numberOfLines={1} adjustsFontSizeToFit>
              {formatPhoneDisplay(callOutput.phoneNumber)}
            </Text>
            <Text style={styles.callerHint}>{callerHint}</Text>
          </View>

          <View
            ref={bannerRef}
            style={[styles.riskBanner, { backgroundColor: meta.color }]}
            accessibilityRole="alert"
            accessibilityLabel={`${isEn ? 'Warning' : 'Cảnh báo'}: ${statusLabel}. ${headline}`}>
            <View style={styles.riskBadgeRow}>
              <Text style={[styles.riskBadgeText, { color: meta.textColor }]}>
                {statusLabel.toUpperCase()}
              </Text>
              {callOutput.coolingOff ? (
                <Text style={[styles.riskPill, { color: meta.textColor }]}>
                  {isEn ? 'Pause' : 'Khoảng dừng'} {callOutput.coolingOffHours}h
                </Text>
              ) : null}
            </View>
            <Text style={[styles.riskHeadline, { color: meta.textColor }]}>
              {headline}
            </Text>
            {localized.reasons.slice(0, 3).map((reason) => (
              <Text
                key={reason}
                style={[styles.riskReason, { color: meta.textColor }]}>
                • {reason}
              </Text>
            ))}
          </View>

          <View style={styles.claimCard}>
            <Text style={styles.sectionLabel}>
              {isEn ? '🗣 The caller is saying (simulated):' : '🗣 Người gọi đang nói (mô phỏng):'}
            </Text>
            <Text style={styles.claimText}>“{callerClaim}”</Text>
            <Pressable
              onPress={handleSpeakPreview}
              accessibilityRole="button"
              accessibilityLabel={
                speaking
                  ? isEn
                    ? 'Stop the voice preview'
                    : 'Dừng phát thử giọng nói'
                  : isEn
                    ? 'Listen to the caller voice preview'
                    : 'Nghe thử giọng người gọi'
              }
              style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
              <Text style={styles.audioButtonText}>
                {speaking
                  ? isEn
                    ? '⏹ Stop preview'
                    : '⏹ Dừng phát thử'
                  : isEn
                    ? '▶ Listen to the voice preview (simulated)'
                    : '▶ Nghe thử giọng nói (mô phỏng)'}
              </Text>
            </Pressable>
            <View style={styles.rndTag}>
              <Text style={styles.rndTagText}>
                {isEn
                  ? '🧪 R&D note: AI voice detection is a hint only. Still ask for the family code and call back the saved number.'
                  : '🧪 Lưu ý R&D: Cảnh báo giọng AI chỉ để tham khảo. Mình vẫn hỏi “Mã gia đình” và gọi lại số đã lưu nhé.'}
              </Text>
            </View>
          </View>

          <View style={styles.signalCard}>
            <Text style={styles.sectionLabel}>
              {isEn ? 'What ScamKill found' : 'ScamKill đã ghi nhận'}
            </Text>
            <Text style={styles.signalCount}>
              {isEn
                ? `${callOutput.communityReportCount} community reports · ${callOutput.signals.length} signals`
                : `${callOutput.communityReportCount} báo cáo từ cộng đồng · ${callOutput.signals.length} dấu hiệu`}
            </Text>
            <View style={styles.signalWrap}>
              {callOutput.signals.map((signal) => (
                <View key={signal} style={styles.signalChip}>
                  <Text style={styles.signalChipText}>
                    {callSignalLabel(signal, isEn)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.epistemicNote}>{localized.epistemicNote}</Text>
          </View>

          <View style={styles.safeWordCard}>
            <Text style={styles.safeWordLabel}>
              {isEn ? 'Our family code' : 'Mã gia đình của mình'}
            </Text>
            <Text style={styles.safeWordValue}>“{safeWord}”</Text>
            <Text style={styles.safeWordHint}>
              {isEn
                ? 'Ask the caller: "What is our family code?" A real relative will answer correctly. An AI voice clone will not know it.'
                : 'Mình hỏi người gọi: “Mã gia đình là gì?”. Người thật sẽ trả lời đúng; kẻ giả giọng AI thì không biết đâu.'}
            </Text>
          </View>

          <Pressable
            onPress={() => setShareConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: shareConsent }}
            accessibilityLabel={
              isEn
                ? 'Agree to share the call content with family'
                : 'Đồng ý gửi kèm nội dung cuộc gọi cho người thân'
            }
            style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, shareConsent && styles.checkboxChecked]}>
              {shareConsent ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <View style={styles.consentBody}>
              <Text style={styles.consentText}>
                {isEn
                  ? 'Allow sharing the call content with my family'
                  : 'Cho phép gửi kèm nội dung cuộc gọi cho con cháu'}
              </Text>
              <Text style={styles.consentSub}>
                {isEn
                  ? 'OFF by default: only the alert type, time and phone number are sent.'
                  : 'Mặc định TẮT: chỉ gửi loại cảnh báo, thời gian và số điện thoại.'}
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.footer} ref={footerRef}>
          <Pressable
            onPress={() => onTriggerVerifyAndAlert?.(callOutput, shareConsent)}
            accessibilityRole="button"
            accessibilityLabel={
              isEn ? 'Check and alert family now' : 'Kiểm tra và báo người thân ngay'
            }
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>
              {isEn ? '🛡 CHECK & ALERT FAMILY NOW' : '🛡 KIỂM TRA & BÁO CON CHÁU NGAY'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Hang up safely' : 'Cúp máy an toàn'}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>
              {isEn ? '📵 Hang up and stay safe' : '📵 Cúp máy cho an toàn'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 28,
    gap: 16,
  },
  callHeader: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  callLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#475569',
  },
  ringing: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F766E',
  },
  callSource: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  callerBadge: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  rippleRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
  },
  callerBadgeCore: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: Fonts.mono,
    letterSpacing: 3,
  },
  callerHint: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
  },
  riskBanner: {
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  riskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  riskBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  riskPill: {
    fontSize: 18,
    fontWeight: '800',
  },
  riskHeadline: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    fontFamily: Fonts.heading,
  },
  riskReason: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 18,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  claimText: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '700',
    color: '#0F172A',
  },
  audioButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  audioButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  rndTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  rndTagText: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    color: '#78350F',
  },
  signalCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  signalCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  signalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signalChipText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  epistemicNote: {
    fontSize: 18,
    lineHeight: 27,
    color: '#475569',
  },
  safeWordCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0F766E',
    padding: 18,
    gap: 6,
  },
  safeWordLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  safeWordValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#065F46',
  },
  safeWordHint: {
    fontSize: 18,
    lineHeight: 26,
    color: '#065F46',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 56,
    paddingVertical: 10,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  consentText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  consentBody: {
    flex: 1,
    gap: 4,
  },
  consentSub: {
    fontSize: 18,
    fontWeight: '500',
    color: '#475569',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 19,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
