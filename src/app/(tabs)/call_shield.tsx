import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IncomingCallModal } from '@/components/scamkill/IncomingCallModal';
import { CoolingOffModal } from '@/components/scamkill/CoolingOffModal';
import { SafeWordCard } from '@/components/scamkill/SafeWordCard';
import { ScenarioDrawer } from '@/components/scamkill/ScenarioDrawer';
import {
  checkIncomingCallSync,
  dispatchFamilyAlert,
  getDefaultFamilySafeWord,
} from '@/api/scamkill/client';
import type {
  BotChannel,
  CallCheckInput,
  CallCheckOutput,
  CallRiskStatus,
  CallSourceSignal,
  FamilyAlertReceipt,
  FamilyAlertType,
  ScamKillScenario,
} from '@/api/scamkill/types';

const STATUS_META: Record<
  CallRiskStatus,
  { label: string; color: string; background: string }
> = {
  high_risk: { label: 'Nguy cơ cao', color: '#B91C1C', background: '#FEF2F2' },
  caution: { label: 'Cần cảnh giác', color: '#D97706', background: '#FFFBEB' },
  unverified: { label: 'Chưa xác minh', color: '#475569', background: '#F1F5F9' },
  safe: { label: 'Trong danh bạ', color: '#0F766E', background: '#ECFDF5' },
};

const SIGNAL_LABELS: Record<CallSourceSignal, string> = {
  scamkill_community: 'Báo cáo cộng đồng',
  official_ntrust_boca: 'Nguồn công khai / Bộ Công an',
  foreign_prefix_rule: 'Đầu số quốc tế lạ',
  burst_calling_rule: 'Gọi dồn dập',
  not_in_contacts_rule: 'Không có trong danh bạ',
  saved_family_contact: 'Số người thân đã lưu',
};

const CHANNEL_LABELS: Record<BotChannel, string> = {
  sms: 'SMS',
  zalo: 'Zalo',
  telegram: 'Telegram',
};

const DELIVERY_LABELS: Record<string, string> = {
  delivered: 'Đã gửi',
  replied_safe: 'Người thân xác nhận an toàn',
  replied_scam_blocked: 'Người thân xác nhận lừa đảo',
};

const EPISTEMIC_NOTE =
  'Giới hạn: hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn 100%; khi dữ liệu chưa đủ sẽ hiển thị Chưa xác minh';

const PRESETS = [
  { label: '👵 Bà Lan · 0918 765 432', phone: '0918765432', inContacts: false },
  { label: '🚨 +855 12 345 678', phone: '+85512345678', inContacts: false },
  { label: '🏦 1900 5555 55', phone: '19005555555', inContacts: false },
  { label: '👩 Con gái · 0901 234 567', phone: '0901234567', inContacts: true },
];

function pickAlertType(
  output: CallCheckOutput,
  scenarioId?: ScamKillScenario['id']
): FamilyAlertType {
  if (scenarioId === 'fake-bank-otp-sms') return 'suspicious_message';
  if (scenarioId === 'ba-lan-30m' || scenarioId === 'zalo-voice-clone') {
    return 'relative_impersonation';
  }
  if (output.status === 'high_risk') return 'high_risk_call';
  return 'senior_manual_sos';
}

export default function CallShieldScreen() {
  const [phoneNumber, setPhoneNumber] = React.useState('0918765432');
  const [inContacts, setInContacts] = React.useState(false);
  const [burstCallCount, setBurstCallCount] = React.useState(2);
  const [urgentMoney, setUrgentMoney] = React.useState(true);
  const [scenario, setScenario] = React.useState<ScamKillScenario | null>(null);
  const [safeWord, setSafeWord] = React.useState(() => getDefaultFamilySafeWord());
  const [incomingVisible, setIncomingVisible] = React.useState(false);
  const [coolingVisible, setCoolingVisible] = React.useState(false);
  const [shareContent, setShareContent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [receipt, setReceipt] = React.useState<FamilyAlertReceipt | null>(null);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [demoNotice, setDemoNotice] = React.useState<string | null>(null);

  const liveInput = React.useMemo<CallCheckInput | null>(() => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) return null;
    return {
      phoneNumber: trimmed,
      inContacts,
      burstCallCount,
      asksForUrgentMoney: urgentMoney,
      callerClaimedName: scenario?.callInput?.callerClaimedName,
      spokenTranscriptPreview: scenario?.callInput?.spokenTranscriptPreview,
    };
  }, [phoneNumber, inContacts, burstCallCount, urgentMoney, scenario]);

  const result = React.useMemo<CallCheckOutput | null>(
    () => (liveInput ? checkIncomingCallSync(liveInput) : null),
    [liveInput]
  );

  const sendAlert = async (output: CallCheckOutput, consent: boolean) => {
    setSending(true);
    setSendError(null);
    try {
      const transcript = scenario?.callInput?.spokenTranscriptPreview;
      const contentParts = [output.shortReason, transcript].filter(
        (part): part is string => Boolean(part)
      );
      const alertReceipt = await dispatchFamilyAlert({
        seniorName: 'Bà Lan',
        alertType: pickAlertType(output, scenario?.id),
        relatedPhoneNumber: output.normalizedNumber,
        timestamp: new Date().toISOString(),
        channels: ['sms', 'zalo', 'telegram'],
        consentToShareContent: consent,
        messageOrCallContent: consent ? contentParts.join(' · ') : undefined,
        recipientNames: ['Chị Hương (Con gái)'],
      });
      setReceipt(alertReceipt);
    } catch {
      setSendError(
        'Không gửi được cảnh báo lúc này. Hãy thử lại hoặc gọi trực tiếp cho con cháu.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleScenarioSelect = (next: ScamKillScenario) => {
    setScenario(next);
    setReceipt(null);
    setSendError(null);
    setShareContent(false);
    if (!next.callInput) {
      setDemoNotice(
        `“${next.title}” thuộc Tính năng 2 (phân tích tin nhắn) — hãy chạy kịch bản này ở màn hình Tin nhắn.`
      );
      return;
    }
    setDemoNotice(null);
    setPhoneNumber(next.callInput.phoneNumber);
    setInContacts(next.callInput.inContacts ?? false);
    setBurstCallCount(next.callInput.burstCallCount ?? 1);
    setUrgentMoney(next.callInput.asksForUrgentMoney ?? false);
    setIncomingVisible(true);
  };

  const handlePhoneChange = (next: string) => {
    setPhoneNumber(next);
    setScenario(null);
    setReceipt(null);
    setDemoNotice(null);
    setShareContent(false);
  };

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setPhoneNumber(preset.phone);
    setInContacts(preset.inContacts);
    setScenario(null);
    setReceipt(null);
    setDemoNotice(null);
    setShareContent(false);
  };

  const handleVerifyAndAlert = (output: CallCheckOutput, consent: boolean) => {
    setIncomingVisible(false);
    setShareContent(consent);
    // iOS cannot present a second Modal while the first is still dismissing.
    setTimeout(() => setCoolingVisible(true), 300);
    void sendAlert(output, consent);
  };

  const statusMeta = result ? STATUS_META[result.status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TÍNH NĂNG 1 · TRƯỚC KHI BẮT MÁY</Text>
          <Text style={styles.title}>🛡 Cảnh báo cuộc gọi từ số có nguy cơ</Text>
          <Text style={styles.subtitle}>
            Nhập hoặc chọn số để xem mức rủi ro trước khi nghe máy. ScamKill chỉ đưa ra mức rủi
            ro, không khẳng định chắc chắn 100%.
          </Text>
        </View>

        <ScenarioDrawer onSelectScenario={handleScenarioSelect} />

        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>Số đang gọi đến</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder="Ví dụ: 0918 765 432"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={20}
            style={styles.input}
            accessibilityLabel="Nhập số điện thoại đang gọi đến"
          />

          <Text style={styles.presetLabel}>Chọn nhanh:</Text>
          <View style={styles.presetWrap}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.phone}
                onPress={() => handlePreset(preset)}
                accessibilityRole="button"
                accessibilityLabel={`Dùng số ${preset.phone}`}
                style={({ pressed }) => [
                  styles.presetChip,
                  phoneNumber.replace(/\s/g, '') === preset.phone && styles.presetChipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.presetChipText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.toggleGroup}>
            <Pressable
              onPress={() => setInContacts((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inContacts }}
              accessibilityLabel="Số có trong danh bạ"
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, inContacts && styles.checkboxChecked]}>
                {inContacts ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={styles.toggleText}>Số có trong danh bạ</Text>
            </Pressable>

            <Pressable
              onPress={() => setBurstCallCount((v) => (v > 1 ? 1 : 3))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: burstCallCount > 1 }}
              accessibilityLabel="Gọi dồn dập nhiều lần"
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, burstCallCount > 1 && styles.checkboxChecked]}>
                {burstCallCount > 1 ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={styles.toggleText}>Gọi dồn dập nhiều lần</Text>
            </Pressable>

            <Pressable
              onPress={() => setUrgentMoney((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: urgentMoney }}
              accessibilityLabel="Xin chuyển tiền khẩn cấp"
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, urgentMoney && styles.checkboxChecked]}>
                {urgentMoney ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={styles.toggleText}>Xin chuyển tiền khẩn cấp</Text>
            </Pressable>
          </View>
        </View>

        {demoNotice ? (
          <View style={styles.noticeCard} accessibilityRole="alert">
            <Text style={styles.noticeText}>{demoNotice}</Text>
          </View>
        ) : null}

        {result && statusMeta ? (
          <View style={[styles.resultCard, { backgroundColor: statusMeta.background }]}>
            <View style={styles.resultTopRow}>
              <Text style={[styles.riskBadge, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
              <Text style={styles.normalizedNumber}>{result.normalizedNumber}</Text>
            </View>
            <Text style={styles.badgeLabel}>{result.badgeLabel}</Text>
            <Text style={styles.shortReason}>{result.shortReason}</Text>

            <Text style={styles.metaLine}>
              {result.communityReportCount} báo cáo cộng đồng · {result.signals.length} tín hiệu
              trùng khớp
            </Text>
            <View style={styles.signalWrap}>
              {result.signals.map((signal) => (
                <View key={signal} style={styles.signalChip}>
                  <Text style={styles.signalChipText}>{SIGNAL_LABELS[signal]}</Text>
                </View>
              ))}
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{EPISTEMIC_NOTE}</Text>
            </View>

            {result.coolingOff ? (
              <Text style={styles.coolingHint}>
                Đề xuất: bật Khoảng dừng an toàn {result.coolingOffHours} giờ trước khi chuyển
                tiền.
              </Text>
            ) : null}

            <View style={styles.actionGroup}>
              <Pressable
                onPress={() => setIncomingVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Mô phỏng cuộc gọi đến"
                style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
                <Text style={styles.callButtonText}>📞 Mô phỏng cuộc gọi đến</Text>
              </Pressable>

              <Pressable
                onPress={() => setCoolingVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Mở khoảng dừng an toàn 60 giây"
                style={({ pressed }) => [styles.coolingButton, pressed && styles.pressed]}>
                <Text style={styles.coolingButtonText}>
                  ⏸ Khoảng dừng an toàn 60 giây (Khoá 48h)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShareContent((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: shareContent }}
                accessibilityLabel="Đồng ý gửi kèm nội dung cuộc gọi cho người thân"
                style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}>
                <View style={[styles.checkbox, shareContent && styles.checkboxChecked]}>
                  {shareContent ? <Text style={styles.checkTick}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  Đồng ý gửi kèm nội dung cuộc gọi cho người thân (mặc định TẮT)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void sendAlert(result, shareContent)}
                disabled={sending}
                accessibilityRole="button"
                accessibilityState={{ disabled: sending, busy: sending }}
                accessibilityLabel="Gửi cảnh báo ngay qua SMS, Zalo, Telegram"
                style={({ pressed }) => [
                  styles.alertButton,
                  sending && styles.disabledButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.alertButtonText}>
                  {sending
                    ? 'Đang gửi cảnh báo…'
                    : '📨 Gửi cảnh báo ngay (SMS · Zalo · Telegram)'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nhập số điện thoại để xem mức rủi ro. Khi chưa đủ dữ liệu, kết quả sẽ hiển thị
              “Chưa xác minh”.
            </Text>
          </View>
        )}

        {sendError ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <Text style={styles.errorText}>{sendError}</Text>
          </View>
        ) : null}

        {receipt ? (
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>✅ Đã gửi cảnh báo cho người thân</Text>
            <Text style={styles.receiptSummary}>{receipt.summaryText}</Text>
            {receipt.deliveries.map((delivery) => (
              <View key={delivery.id} style={styles.deliveryRow}>
                <Text style={styles.deliveryChannel}>
                  {CHANNEL_LABELS[delivery.channel]}
                </Text>
                <Text style={styles.deliveryRecipient}>{delivery.recipient}</Text>
                <Text style={styles.deliveryStatus}>
                  {DELIVERY_LABELS[delivery.status] || delivery.status}
                </Text>
              </View>
            ))}
            <Text style={styles.receiptConsent}>
              {receipt.consentToShareContent
                ? 'Đã gửi kèm nội dung cuộc gọi (bạn đã đồng ý).'
                : 'Chỉ gửi loại cảnh báo, thời điểm và số điện thoại (không gửi nội dung).'}
            </Text>
          </View>
        ) : null}

        <SafeWordCard
          safeWord={safeWord}
          onChangeSafeWord={setSafeWord}
          onOpenCoolingOff={() => setCoolingVisible(true)}
        />

        <Text style={styles.footerNote}>
          ScamKill · Nguyên tắc 4 bước: Phát hiện → Làm chậm → Xác minh → Cùng quyết định.
        </Text>
      </ScrollView>

      <IncomingCallModal
        visible={incomingVisible}
        scenario={scenario}
        callInput={liveInput}
        familySafeWord={safeWord}
        onClose={() => setIncomingVisible(false)}
        onTriggerVerifyAndAlert={handleVerifyAndAlert}
      />

      <CoolingOffModal
        visible={coolingVisible}
        amountOrRiskText={result ? result.shortReason : undefined}
        familySafeWord={safeWord}
        callerNumber={result?.normalizedNumber || phoneNumber.trim()}
        onClose={() => setCoolingVisible(false)}
        onNotifyFamily={() => {
          if (result) void sendAlert(result, shareContent);
          setCoolingVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#B45309',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 27,
    color: '#475569',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 18,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  input: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  presetChipActive: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  presetChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleGroup: {
    gap: 6,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 6,
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
  checkTick: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  toggleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  noticeCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#D97706',
    borderRadius: 14,
    padding: 14,
  },
  noticeText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    color: '#78350F',
  },
  resultCard: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  riskBadge: {
    fontSize: 26,
    fontWeight: '900',
  },
  normalizedNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  badgeLabel: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  shortReason: {
    fontSize: 18,
    lineHeight: 27,
    color: '#334155',
  },
  metaLine: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  noteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
  coolingHint: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: '#B45309',
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  callButton: {
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  coolingButton: {
    minHeight: 60,
    borderRadius: 14,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  coolingButtonText: {
    color: '#1C1917',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 6,
  },
  consentText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#0F172A',
  },
  alertButton: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  emptyCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 18,
  },
  emptyText: {
    fontSize: 18,
    lineHeight: 27,
    color: '#334155',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#B91C1C',
    borderRadius: 14,
    padding: 14,
  },
  errorText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: '#991B1B',
  },
  receiptCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#15803D',
    padding: 18,
    gap: 8,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14532D',
  },
  receiptSummary: {
    fontSize: 18,
    lineHeight: 27,
    color: '#14532D',
  },
  deliveryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  deliveryChannel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  deliveryRecipient: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  deliveryStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  receiptConsent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#166534',
  },
  footerNote: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
