import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';

import {
  checkIncomingCallSync,
  getDefaultFamilySafeWord,
} from '@/api/scamkill/client';
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
      : 'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh.';
  }
  if (output.status === 'unverified') {
    return 'Chưa xác minh — Chưa có đủ dữ liệu báo cáo. Tuyệt đối không chuyển tiền hoặc đọc mã OTP.';
  }
  return 'Trong danh bạ / Đã xác thực. Vẫn cẩn thận nếu người này xin chuyển tiền gấp.';
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
            <Text style={styles.callLabel}>📞 CUỘC GỌI ĐẾN · ScamKill</Text>
            <Text style={styles.callSource}>
              {scenario?.id === 'zalo-voice-clone'
                ? 'Cuộc gọi Zalo (mô phỏng)'
                : 'Cuộc gọi điện thoại (mô phỏng)'}
            </Text>
            <Text style={styles.ringing}>Đang đổ chuông… 00:{String(ringSeconds).padStart(2, '0')}</Text>
            <Text style={styles.callerNumber}>{callOutput.phoneNumber}</Text>
            <Text style={styles.callerHint}>
              {callInput?.callerClaimedName ||
                scenario?.callInput?.callerClaimedName ||
                scenario?.title ||
                'Người gọi chưa xác định'}
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
                🧪 Thẻ R&D: Cảnh báo giả giọng AI chỉ là tín hiệu tham khảo — không thay thế
                bước hỏi “Mã gia đình” và gọi lại số đã lưu.
              </Text>
            </View>
          </View>

          <View style={styles.signalCard}>
            <Text style={styles.sectionLabel}>Tín hiệu ghi nhận</Text>
            <Text style={styles.signalCount}>
              {callOutput.communityReportCount} báo cáo cộng đồng · {callOutput.signals.length} tín hiệu
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
            <Text style={styles.safeWordLabel}>Mã gia đình của bạn</Text>
            <Text style={styles.safeWordValue}>“{safeWord}”</Text>
            <Text style={styles.safeWordHint}>
              Hỏi người gọi: “Mã gia đình là gì?”. Người thật sẽ trả lời đúng; kẻ giả giọng AI
              thì không biết.
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
                Đồng ý gửi kèm nội dung cuộc gọi cho người thân
              </Text>
              <Text style={styles.consentSub}>
                Mặc định TẮT: chỉ gửi loại cảnh báo, thời điểm và số điện thoại.
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
            <Text style={styles.primaryButtonText}>🛡 KIỂM TRA &amp; BÁO NGƯỜI THÂN NGAY</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cúp máy an toàn"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>📵 Cúp máy an toàn</Text>
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
  callerNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
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
