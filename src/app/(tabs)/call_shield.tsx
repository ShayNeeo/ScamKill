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
import { ScenarioDrawer, getScenarioCopy } from '@/components/scamkill/ScenarioDrawer';
import {
  checkIncomingCallSync,
  dispatchFamilyAlert,
  getDefaultFamilySafeWord,
} from '@/api/scamkill/client';
import {
  alertReceiptSummary,
  callSignalLabel,
  callStatusLabel,
  localizeCallOutput,
} from '@/i18n';
import { useLanguageDialect } from '@/i18n/regional';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  BotChannel,
  CallCheckInput,
  CallCheckOutput,
  CallRiskStatus,
  FamilyAlertReceipt,
  FamilyAlertType,
  ScamKillScenario,
} from '@/api/scamkill/types';

const STATUS_COLORS: Record<
  CallRiskStatus,
  { color: string; background: string }
> = {
  high_risk: { color: '#B91C1C', background: '#FEF2F2' },
  caution: { color: '#D97706', background: '#FFFBEB' },
  unverified: { color: '#475569', background: '#F1F5F9' },
  safe: { color: '#0F766E', background: '#ECFDF5' },
};

const CHANNEL_LABELS: Record<BotChannel, string> = {
  sms: 'SMS',
  zalo: 'Zalo',
  telegram: 'Telegram',
};

const DELIVERY_LABELS_EN: Record<string, string> = {
  delivered: 'Delivered',
  replied_safe: 'Family confirmed safe',
  replied_scam_blocked: 'Family confirmed scam',
};

const DELIVERY_LABELS_VI: Record<string, string> = {
  delivered: 'Đã gửi',
  replied_safe: 'Người thân xác nhận an toàn',
  replied_scam_blocked: 'Người thân xác nhận lừa đảo',
};

const PRESETS = [
  { label: '👵 Bà Lan · 0918 765 432', labelEn: '👵 Grandma Lan · 0918 765 432', phone: '0918765432', inContacts: false },
  { label: '🚨 +855 12 345 678', labelEn: '🚨 +855 12 345 678', phone: '+85512345678', inContacts: false },
  { label: '🏦 1900 5555 55', labelEn: '🏦 1900 5555 55', phone: '19005555555', inContacts: false },
  { label: '👩 Con gái · 0901 234 567', labelEn: '👩 Daughter · 0901 234 567', phone: '0901234567', inContacts: true },
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
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

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
  const [sendError, setSendError] = React.useState(false);
  const [demoScenario, setDemoScenario] = React.useState<ScamKillScenario | null>(null);

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
    setSendError(false);
    try {
      const outputCopy = localizeCallOutput(output, isEn);
      const transcript = scenario ? getScenarioCopy(scenario, isEn).transcript : undefined;
      const contentParts = [outputCopy.shortReason, transcript].filter(
        (part): part is string => Boolean(part)
      );
      const alertReceipt = await dispatchFamilyAlert({
        seniorName: isEn ? 'Mrs. Lan' : 'Bà Lan',
        alertType: pickAlertType(output, scenario?.id),
        relatedPhoneNumber: output.normalizedNumber,
        timestamp: new Date().toISOString(),
        channels: ['sms', 'zalo', 'telegram'],
        consentToShareContent: consent,
        messageOrCallContent: consent ? contentParts.join(' · ') : undefined,
        recipientNames: [isEn ? 'Hương (Daughter)' : 'Chị Hương (Con gái)'],
      });
      setReceipt(alertReceipt);
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const handleScenarioSelect = (next: ScamKillScenario) => {
    setScenario(next);
    setReceipt(null);
    setSendError(false);
    setShareContent(false);
    if (!next.callInput) {
      setDemoScenario(next);
      return;
    }
    setDemoScenario(null);
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
    setDemoScenario(null);
    setShareContent(false);
  };

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setPhoneNumber(preset.phone);
    setInContacts(preset.inContacts);
    setScenario(null);
    setReceipt(null);
    setDemoScenario(null);
    setShareContent(false);
  };

  const handleVerifyAndAlert = (output: CallCheckOutput, consent: boolean) => {
    setIncomingVisible(false);
    setShareContent(consent);
    // iOS cannot present a second Modal while the first is still dismissing.
    setTimeout(() => setCoolingVisible(true), 300);
    void sendAlert(output, consent);
  };

  const statusMeta = result ? STATUS_COLORS[result.status] : null;
  const localizedResult = result ? localizeCallOutput(result, isEn) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isEn ? '🛡 Call warning for risky numbers' : '🛡 Cảnh báo cuộc gọi từ số có nguy cơ'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isEn
              ? 'Enter or pick a number to see the risk level before you answer. ScamKill gives a risk level, not a 100% certainty.'
              : 'Nhập hoặc chọn số để xem mức rủi ro trước khi nghe máy. ScamKill chỉ đưa ra mức rủi ro, không khẳng định chắc chắn 100%.'}
          </Text>
        </View>

        <ScenarioDrawer onSelectScenario={handleScenarioSelect} />

        <View style={[styles.inputCard, { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>
            {isEn ? 'Calling number' : 'Số đang gọi đến'}
          </Text>
          <TextInput
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder={isEn ? 'For example: 0918 765 432' : 'Ví dụ: 0918 765 432'}
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={20}
            style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder }]}
            accessibilityLabel={isEn ? 'Enter the incoming phone number' : 'Nhập số điện thoại đang gọi đến'}
          />

          <Text style={[styles.presetLabel, { color: theme.textSecondary }]}>{isEn ? 'Quick pick:' : 'Chọn nhanh:'}</Text>
          <View style={styles.presetWrap}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.phone}
                onPress={() => handlePreset(preset)}
                accessibilityRole="button"
                accessibilityLabel={isEn ? `Use number ${preset.phone}` : `Dùng số ${preset.phone}`}
                style={({ pressed }) => [
                  styles.presetChip,
                  phoneNumber.replace(/\s/g, '') === preset.phone && styles.presetChipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.presetChipText}>
                  {isEn ? preset.labelEn : preset.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.toggleGroup}>
            <Pressable
              onPress={() => setInContacts((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inContacts }}
              accessibilityLabel={isEn ? 'Number is in contacts' : 'Số có trong danh bạ'}
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, inContacts && styles.checkboxChecked]}>
                {inContacts ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={[styles.toggleText, { color: theme.text }]}>
                {isEn ? 'Number is in my contacts' : 'Số có trong danh bạ'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setBurstCallCount((v) => (v > 1 ? 1 : 3))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: burstCallCount > 1 }}
              accessibilityLabel={isEn ? 'Calling repeatedly in a burst' : 'Gọi dồn dập nhiều lần'}
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, burstCallCount > 1 && styles.checkboxChecked]}>
                {burstCallCount > 1 ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={[styles.toggleText, { color: theme.text }]}>
                {isEn ? 'Calling repeatedly in a burst' : 'Gọi dồn dập nhiều lần'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setUrgentMoney((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: urgentMoney }}
              accessibilityLabel={isEn ? 'Asks for urgent money' : 'Xin chuyển tiền khẩn cấp'}
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, urgentMoney && styles.checkboxChecked]}>
                {urgentMoney ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <Text style={[styles.toggleText, { color: theme.text }]}>
                {isEn ? 'Asks for urgent money' : 'Xin chuyển tiền khẩn cấp'}
              </Text>
            </Pressable>
          </View>
        </View>

        {demoScenario ? (
          <View style={styles.noticeCard} accessibilityRole="alert">
            <Text style={styles.noticeText}>
              {isEn
                ? `"${getScenarioCopy(demoScenario, true).title}" belongs to Feature 2 (message analysis). Run this scenario on the Messages screen.`
                : `“${getScenarioCopy(demoScenario, false).title}” thuộc Tính năng 2 (phân tích tin nhắn). Hãy chạy kịch bản này ở màn hình Tin nhắn.`}
            </Text>
          </View>
        ) : null}

        {result && statusMeta && localizedResult ? (
          <View style={[styles.resultCard, { backgroundColor: statusMeta.background }]}>
            <View style={styles.resultTopRow}>
              <Text style={[styles.riskBadge, { color: statusMeta.color }]}>
                {callStatusLabel(result.status, isEn)}
              </Text>
              <Text style={styles.normalizedNumber}>{result.normalizedNumber}</Text>
            </View>
            <Text style={styles.badgeLabel}>{localizedResult.badgeLabel}</Text>
            <Text style={styles.shortReason}>{localizedResult.shortReason}</Text>

            <Text style={styles.metaLine}>
              {isEn
                ? `${result.communityReportCount} community reports · ${result.signals.length} matching signals`
                : `${result.communityReportCount} báo cáo cộng đồng · ${result.signals.length} tín hiệu trùng khớp`}
            </Text>
            <View style={styles.signalWrap}>
              {result.signals.map((signal) => (
                <View key={signal} style={styles.signalChip}>
                  <Text style={styles.signalChipText}>
                    {callSignalLabel(signal, isEn)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{localizedResult.epistemicNote}</Text>
            </View>

            {result.coolingOff ? (
              <Text style={styles.coolingHint}>
                {isEn
                  ? `Suggested: keep the ${result.coolingOffHours} hour safety pause on before transferring money.`
                  : `Đề xuất: bật Khoảng dừng an toàn ${result.coolingOffHours} giờ trước khi chuyển tiền.`}
              </Text>
            ) : null}

            <View style={styles.actionGroup}>
              <Pressable
                onPress={() => setIncomingVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Simulate an incoming call' : 'Mô phỏng cuộc gọi đến'}
                style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
                <Text style={styles.callButtonText}>
                  {isEn ? '📞 Simulate incoming call' : '📞 Mô phỏng cuộc gọi đến'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCoolingVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Open the 60 second safety pause' : 'Mở khoảng dừng an toàn 60 giây'}
                style={({ pressed }) => [styles.coolingButton, pressed && styles.pressed]}>
                <Text style={styles.coolingButtonText}>
                  {isEn
                    ? '⏸ 60 second safety pause (48h lock)'
                    : '⏸ Khoảng dừng an toàn 60 giây (Khoá 48h)'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShareContent((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: shareContent }}
                accessibilityLabel={
                  isEn
                    ? 'Agree to share the call content with family'
                    : 'Đồng ý gửi kèm nội dung cuộc gọi cho người thân'
                }
                style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}>
                <View style={[styles.checkbox, shareContent && styles.checkboxChecked]}>
                  {shareContent ? <Text style={styles.checkTick}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  {isEn
                    ? 'Agree to share call content with family (OFF by default)'
                    : 'Đồng ý gửi kèm nội dung cuộc gọi cho người thân (mặc định TẮT)'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void sendAlert(result, shareContent)}
                disabled={sending}
                accessibilityRole="button"
                accessibilityState={{ disabled: sending, busy: sending }}
                accessibilityLabel={
                  isEn
                    ? 'Send an alert now via SMS, Zalo, Telegram'
                    : 'Gửi cảnh báo ngay qua SMS, Zalo, Telegram'
                }
                style={({ pressed }) => [
                  styles.alertButton,
                  sending && styles.disabledButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.alertButtonText}>
                  {sending
                    ? isEn
                      ? 'Sending alert...'
                      : 'Đang gửi cảnh báo…'
                    : isEn
                      ? '📨 Send alert now (SMS · Zalo · Telegram)'
                      : '📨 Gửi cảnh báo ngay (SMS · Zalo · Telegram)'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {isEn
                ? 'Enter a phone number to see the risk level. When data is missing, the result shows "Unverified".'
                : 'Nhập số điện thoại để xem mức rủi ro. Khi chưa đủ dữ liệu, kết quả sẽ hiển thị “Chưa xác minh”.'}
            </Text>
          </View>
        )}

        {sendError ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <Text style={styles.errorText}>
              {isEn
                ? 'Could not send the alert right now. Try again or call your family directly.'
                : 'Không gửi được cảnh báo lúc này. Hãy thử lại hoặc gọi trực tiếp cho con cháu.'}
            </Text>
          </View>
        ) : null}

        {receipt ? (
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>
              {isEn ? '✅ Alert sent to your family' : '✅ Đã gửi cảnh báo cho người thân'}
            </Text>
            <Text style={styles.receiptSummary}>
              {alertReceiptSummary(receipt, isEn)}
            </Text>
            {receipt.deliveries.map((delivery) => (
              <View key={delivery.id} style={styles.deliveryRow}>
                <Text style={styles.deliveryChannel}>
                  {CHANNEL_LABELS[delivery.channel]}
                </Text>
                <Text style={styles.deliveryRecipient}>{delivery.recipient}</Text>
                <Text style={styles.deliveryStatus}>
                  {(isEn ? DELIVERY_LABELS_EN : DELIVERY_LABELS_VI)[delivery.status] || delivery.status}
                </Text>
              </View>
            ))}
            <Text style={styles.receiptConsent}>
              {receipt.consentToShareContent
                ? isEn
                  ? 'Call content was attached with your consent.'
                  : 'Đã gửi kèm nội dung cuộc gọi (bạn đã đồng ý).'
                : isEn
                  ? 'Only the alert type, time and phone number were sent (no content).'
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
          {isEn
            ? 'ScamKill · 4-step rule: Notice, slow down, verify, decide together.'
            : 'ScamKill · Nguyên tắc 4 bước: Phát hiện, làm chậm, xác minh, cùng quyết định.'}
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
        amountOrRiskText={localizedResult ? localizedResult.shortReason : undefined}
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
    fontFamily: Fonts.heading,
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
