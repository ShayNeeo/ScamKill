import * as React from 'react';
import {
  Animated,
  Easing,
  Modal,
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
import { hapticWarning } from '@/lib/haptics';
import type {
  CallCheckInput,
  CallCheckOutput,
  CallRiskStatus,
  CallSourceSignal,
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

const DEFAULT_CLAIM = 'Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp!';

const FALLBACK_INPUT: CallCheckInput = {
  phoneNumber: '0918 765 432',
  callerClaimedName: 'Con gái (giọng nói giống người thân)',
  inContacts: false,
  burstCallCount: 2,
  asksForUrgentMoney: true,
  spokenTranscriptPreview: DEFAULT_CLAIM,
};

const RISK_META: Record<
  CallRiskStatus,
  { label: string; color: string; textColor: string }
> = {
  high_risk: {
    label: 'Nguy cơ cao',
    color: '#B91C1C',
    textColor: '#FFFFFF',
  },
  caution: {
    label: 'Cần cảnh giác',
    color: '#D97706',
    textColor: '#1C1917',
  },
  unverified: {
    label: 'Chưa xác minh',
    color: '#475569',
    textColor: '#FFFFFF',
  },
  safe: {
    label: 'Trong danh bạ',
    color: '#0F766E',
    textColor: '#FFFFFF',
  },
};

const SIGNAL_LABELS: Record<CallSourceSignal, string> = {
  scamkill_community: 'Báo cáo cộng đồng ScamKill',
  official_ntrust_boca: 'Nguồn công khai / Bộ Công an',
  foreign_prefix_rule: 'Đầu số quốc tế lạ',
  burst_calling_rule: 'Gọi dồn dập nhiều lần',
  not_in_contacts_rule: 'Không có trong danh bạ',
  saved_family_contact: 'Số người thân đã lưu',
};

function bannerHeadline(output: CallCheckOutput): string {
  if (output.status === 'high_risk') {
    return output.badgeLabel.toLowerCase().includes('nguy cơ cao')
      ? output.badgeLabel
      : `Nguy cơ cao: ${output.badgeLabel}`;
  }
  if (output.status === 'caution') {
    return output.signals.includes('saved_family_contact')
      ? output.badgeLabel
      : 'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, mình khoan đã và kiểm tra lại nhé.';
  }
  if (output.status === 'unverified') {
    return 'Mình chưa kiểm tra được người này. Mình tuyệt đối không chuyển tiền và không đọc mã OTP nhé.';
  }
  return 'Người này có trong danh bạ của mình. Nhưng nếu họ xin chuyển tiền gấp, mình vẫn kiểm tra lại nhé.';
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

  const callOutput = React.useMemo(
    () => resolveCallOutput(callInput, scenario),
    [callInput, scenario]
  );
  const meta = RISK_META[callOutput.status];
  const headline = bannerHeadline(callOutput);
  const safeWord = familySafeWord || getDefaultFamilySafeWord();
  const callerClaim =
    callInput?.spokenTranscriptPreview ||
    scenario?.callInput?.spokenTranscriptPreview ||
    DEFAULT_CLAIM;

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
        language: 'vi-VN',
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
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}>
          <View style={styles.callHeader}>
            <Text style={styles.callLabel}>📞 Có cuộc gọi đến · ScamKill đang canh chừng</Text>
            <Text style={styles.callSource}>
              {scenario?.id === 'zalo-voice-clone'
                ? 'Cuộc gọi Zalo (bản mô phỏng để tập luyện)'
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

            <Text style={styles.ringing}>Máy đang đổ chuông… 00:{String(ringSeconds).padStart(2, '0')}</Text>
            <Text style={styles.callerNumber} numberOfLines={1} adjustsFontSizeToFit>
              {formatPhoneDisplay(callOutput.phoneNumber)}
            </Text>
            <Text style={styles.callerHint}>
              {callInput?.callerClaimedName ||
                scenario?.callInput?.callerClaimedName ||
                scenario?.title ||
                'Mình chưa rõ người gọi là ai'}
            </Text>
          </View>

          <View
            style={[styles.riskBanner, { backgroundColor: meta.color }]}
            accessibilityRole="alert"
            accessibilityLabel={`Cảnh báo: ${meta.label}. ${headline}`}>
            <View style={styles.riskBadgeRow}>
              <Text style={[styles.riskBadgeText, { color: meta.textColor }]}>
                {meta.label.toUpperCase()}
              </Text>
              {callOutput.coolingOff ? (
                <Text style={[styles.riskPill, { color: meta.textColor }]}>
                  Khoảng dừng {callOutput.coolingOffHours}h
                </Text>
              ) : null}
            </View>
            <Text style={[styles.riskHeadline, { color: meta.textColor }]}>
              {headline}
            </Text>
            {callOutput.reasons.slice(0, 3).map((reason) => (
              <Text
                key={reason}
                style={[styles.riskReason, { color: meta.textColor }]}>
                • {reason}
              </Text>
            ))}
          </View>

          <View style={styles.claimCard}>
            <Text style={styles.sectionLabel}>🗣 Người gọi đang nói (mô phỏng):</Text>
            <Text style={styles.claimText}>“{callerClaim}”</Text>
            <Pressable
              onPress={handleSpeakPreview}
              accessibilityRole="button"
              accessibilityLabel={speaking ? 'Dừng phát thử giọng nói' : 'Nghe thử giọng người gọi'}
              style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
              <Text style={styles.audioButtonText}>
                {speaking ? '⏹ Dừng phát thử' : '▶ Nghe thử giọng nói (mô phỏng)'}
              </Text>
            </Pressable>
            <View style={styles.rndTag}>
              <Text style={styles.rndTagText}>
                🧪 Lưu ý: Cảnh báo giọng AI chỉ để tham khảo. Mình vẫn hỏi “Mã gia đình” và gọi
                lại số đã lưu nhé.
              </Text>
            </View>
          </View>

          <View style={styles.signalCard}>
            <Text style={styles.sectionLabel}>ScamKill đã ghi nhận</Text>
            <Text style={styles.signalCount}>
              {callOutput.communityReportCount} báo cáo từ cộng đồng · {callOutput.signals.length} dấu hiệu
            </Text>
            <View style={styles.signalWrap}>
              {callOutput.signals.map((signal) => (
                <View key={signal} style={styles.signalChip}>
                  <Text style={styles.signalChipText}>{SIGNAL_LABELS[signal]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.epistemicNote}>{callOutput.epistemicNote}</Text>
          </View>

          <View style={styles.safeWordCard}>
            <Text style={styles.safeWordLabel}>Mã gia đình của mình</Text>
            <Text style={styles.safeWordValue}>“{safeWord}”</Text>
            <Text style={styles.safeWordHint}>
              Mình hỏi người gọi: “Mã gia đình là gì?”. Người thật sẽ trả lời đúng; kẻ giả giọng
              AI thì không biết đâu.
            </Text>
          </View>

          <Pressable
            onPress={() => setShareConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: shareConsent }}
            accessibilityLabel="Đồng ý gửi kèm nội dung cuộc gọi cho người thân"
            style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, shareConsent && styles.checkboxChecked]}>
              {shareConsent ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <View style={styles.consentBody}>
              <Text style={styles.consentText}>
                Cho phép gửi kèm nội dung cuộc gọi cho con cháu
              </Text>
              <Text style={styles.consentSub}>
                Mặc định TẮT: chỉ gửi loại cảnh báo, thời gian và số điện thoại.
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => onTriggerVerifyAndAlert?.(callOutput, shareConsent)}
            accessibilityRole="button"
            accessibilityLabel="Kiểm tra và báo người thân ngay"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>🛡 KIỂM TRA &amp; BÁO CON CHÁU NGAY</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cúp máy an toàn"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>📵 Cúp máy cho an toàn</Text>
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
