import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageContainer } from '@/components/page-container';
import { SafeWordCard } from '@/components/scamkill/SafeWordCard';
import { alertReceiptSummary, alertTypeLabel, familyReplyNote, t } from '@/i18n';
import { useLanguageDialect } from '@/i18n/regional';
import { Accessibility } from '@/theme/tokens';
import { Spacing, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  dispatchFamilyAlert,
  getBotInbox,
  getDefaultFamilySafeWord,
  simulateFamilyReply,
} from '@/api/scamkill/client';
import type {
  BotChannel,
  BotDeliveryMessage,
  FamilyAlertReceipt,
} from '@/api/scamkill/types';

const CHANNELS: { id: BotChannel; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'sms', label: 'SMS', icon: 'chatbox-ellipses-outline' },
  { id: 'zalo', label: 'Zalo', icon: 'chatbubbles-outline' },
  { id: 'telegram', label: 'Telegram', icon: 'paper-plane-outline' },
];

export default function TrustedCircleScreen() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const [safeWord, setSafeWord] = useState(() => getDefaultFamilySafeWord());
  const [channels, setChannels] = useState<BotChannel[]>(['sms', 'zalo', 'telegram']);
  const [consent, setConsent] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [relatedPhone, setRelatedPhone] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<FamilyAlertReceipt | null>(null);

  const [inbox, setInbox] = useState<BotDeliveryMessage[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [replyBusyId, setReplyBusyId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('scamkill.family-safe-word')
      .then((saved) => {
        if (saved) setSafeWord(saved);
      })
      .catch(() => undefined);
  }, []);

  const handleSafeWordChange = (next: string) => {
    setSafeWord(next);
    AsyncStorage.setItem('scamkill.family-safe-word', next).catch(() => undefined);
  };

  const refreshInbox = useCallback(async () => {
    try {
      setInbox(await getBotInbox());
    } catch {
      setError('common.error');
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshInbox();
  }, [refreshInbox]);

  const toggleChannel = (channel: BotChannel) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  };

  async function onDispatch() {
    if (busy) return;
    if (channels.length === 0) {
      setError('trusted.requiredChannel');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const nextReceipt = await dispatchFamilyAlert({
        seniorName: isEn ? 'Mrs. Lan' : 'Bà Lan',
        alertType: 'senior_manual_sos',
        relatedPhoneNumber: relatedPhone.trim() || (isEn ? 'Unknown' : 'Không rõ'),
        channels,
        consentToShareContent: consent,
        messageOrCallContent: content.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
        recipientNames: [isEn ? 'Hương (Daughter)' : 'Chị Hương (Con gái)'],
      });
      setReceipt(nextReceipt);
      setContent('');
      await refreshInbox();
    } catch {
      setError('common.error');
    } finally {
      setBusy(false);
    }
  }

  async function onReply(id: string, action: 'call_back_now' | 'confirm_safe') {
    if (replyBusyId) return;
    setReplyBusyId(id);
    try {
      const updated = await simulateFamilyReply(id, {
        from: isEn ? 'Hương (Daughter)' : 'Chị Hương (Con gái)',
        action,
        note: action === 'call_back_now'
          ? isEn ? 'Calling Mom now.' : 'Đang gọi lại cho Mẹ ngay.'
          : isEn ? 'Confirmed safe.' : 'Đã xác nhận an toàn.',
      });
      if (updated) {
        setInbox((current) => current.map((message) => (message.id === id ? updated : message)));
      } else {
        await refreshInbox();
      }
    } catch {
      setError('common.error');
    } finally {
      setReplyBusyId(null);
    }
  }

  return (
    <PageContainer>
      <ThemedText style={[styles.screenTitle, { color: theme.text }]}>{t('circle.title')}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isEn
          ? 'Verify real relatives with a family code, then alert every channel at once.'
          : 'Xác minh người thân thật bằng Mã gia đình, rồi báo cùng lúc qua mọi kênh.'}
      </ThemedText>

      <SafeWordCard safeWord={safeWord} onChangeSafeWord={handleSafeWordChange} />

      <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: theme.cardBorder }]}>
        <View style={styles.panelHeader}>
          <Ionicons name="warning-outline" size={28} color={theme.riskHigh} />
          <ThemedText style={[styles.panelTitle, { color: theme.text }]}>{t('trusted.dispatchTitle')}</ThemedText>
        </View>
        <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{t('trusted.dispatchHint')}</ThemedText>

        <ThemedText style={[styles.label, { color: theme.text }]}>{t('trusted.channels')}</ThemedText>
        <View style={styles.channelRow}>
          {CHANNELS.map((channel) => {
            const active = channels.includes(channel.id);
            return (
              <Pressable
                key={channel.id}
                style={[
                  styles.channelButton,
                  {
                    backgroundColor: active ? theme.primaryAction : theme.surfaceCard,
                    borderColor: theme.primaryAction,
                  },
                ]}
                onPress={() => toggleChannel(channel.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={channel.label}>
                <Ionicons
                  name={channel.icon}
                  size={22}
                  color={active ? theme.primaryActionText : theme.primaryAction}
                />
                <ThemedText
                  style={[
                    styles.channelLabel,
                    { color: active ? theme.primaryActionText : theme.primaryAction },
                  ]}>
                  {channel.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.label, { color: theme.text }]}>PDPD 2025</ThemedText>
        <Pressable
          style={styles.consentRow}
          onPress={() => setConsent((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          accessibilityLabel={t('trusted.consent')}>
          <Ionicons
            name={consent ? 'checkbox' : 'square-outline'}
            size={28}
            color={consent ? theme.primaryAction : theme.textSecondary}
          />
          <ThemedText style={[styles.consentText, { color: theme.textSecondary }]}>
            {t('trusted.consent')}
          </ThemedText>
        </Pressable>

        <Field
          label={t('trusted.relatedPhone')}
          value={relatedPhone}
          onChangeText={setRelatedPhone}
          placeholder="0912 345 678"
          keyboardType="phone-pad"
        />
        <Field
          label={t('trusted.telegramChatId')}
          value={telegramChatId}
          onChangeText={setTelegramChatId}
          placeholder="123456789"
        />
        <Field
          label={t('trusted.content')}
          value={content}
          onChangeText={setContent}
          placeholder={isEn ? 'Paste the suspicious message...' : 'Dán nội dung tin nhắn đáng ngờ...'}
          multiline
        />

        {error && <ThemedText style={[styles.error, { color: theme.riskHigh }]}>{t(error)}</ThemedText>}

        <Pressable
          style={[styles.sendButton, { backgroundColor: theme.riskHigh }, busy && styles.pressed]}
          onPress={onDispatch}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('trusted.send')}>
          <ThemedText style={[styles.sendText, { color: '#FFF' }]}>
            {busy ? t('common.loading') : t('trusted.send')}
          </ThemedText>
        </Pressable>

        {receipt && (
          <View style={[styles.receipt, { borderColor: theme.riskSafe, backgroundColor: theme.surfaceCard }]}>
            <View style={styles.receiptHeader}>
              <Ionicons name="checkmark-circle" size={24} color={theme.riskSafe} />
              <ThemedText style={[styles.receiptTitle, { color: theme.riskSafe }]}>
                {t('home.alertSent')}
              </ThemedText>
            </View>
            <ThemedText style={[styles.receiptBody, { color: theme.text }]}>
              {alertReceiptSummary(receipt, isEn)}
            </ThemedText>
            <View style={styles.badgeRow}>
              {receipt.deliveries.map((delivery) => (
                <ChannelBadge key={delivery.id} channel={delivery.channel} />
              ))}
            </View>
          </View>
        )}
      </ThemedView>

      <View style={styles.inboxSection}>
        <View style={styles.panelHeader}>
          <Ionicons name="mail-unread-outline" size={28} color={theme.primaryAction} />
          <ThemedText style={[styles.panelTitle, { color: theme.text }]}>{t('trusted.inboxTitle')}</ThemedText>
        </View>

        {inboxLoading && <ActivityIndicator size="large" color={theme.primaryAction} />}
        {!inboxLoading && inbox.length === 0 && (
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{t('trusted.emptyInbox')}</ThemedText>
        )}

        {inbox.map((message) => (
          <ThemedView
            key={message.id}
            type="backgroundElement"
            style={[styles.messageCard, { borderColor: theme.cardBorder }]}>
            <View style={styles.messageHeader}>
              <ChannelBadge channel={message.channel} />
              <ThemedText style={[styles.messageTime, { color: theme.textSecondary }]}>
                {new Date(message.timestamp).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
              </ThemedText>
            </View>

            <ThemedText style={[styles.messageType, { color: theme.text }]}>
              {alertTypeLabel(message.alertType, isEn)}
            </ThemedText>
            <ThemedText style={[styles.messageMeta, { color: theme.textSecondary }]}>
              {isEn ? 'Phone' : 'Số điện thoại'}: {message.relatedPhoneNumber} • {isEn ? 'To' : 'Gửi'}{' '}
              {isEn && message.recipient.includes('Hương')
                ? 'Hương (Daughter)'
                : message.recipient}
            </ThemedText>

            <View style={[styles.contentBox, { backgroundColor: theme.surfaceCard, borderColor: message.consentGranted ? theme.riskSafe : theme.cardBorder }]}>
              <ThemedText style={[styles.contentLabel, { color: theme.textSecondary }]}>
                {message.consentGranted ? t('trusted.sharedContent') : t('trusted.hiddenContent')}
              </ThemedText>
              {message.sharedContent ? (
                <ThemedText style={[styles.contentText, { color: theme.text }]}>{message.sharedContent}</ThemedText>
              ) : null}
            </View>

            <ThemedText style={[styles.messageMeta, { color: theme.textSecondary }]}>
              {message.deliveryMode === 'live_telegram_api'
                ? isEn ? 'Live Telegram API' : 'Telegram API thật'
                : isEn ? 'Simulated gateway' : 'Cổng mô phỏng'}
            </ThemedText>

            {message.familyReply ? (
              <View style={[styles.replyBox, { backgroundColor: theme.riskSafeBg, borderColor: theme.riskSafe }]}>
                <ThemedText style={[styles.replyFrom, { color: theme.riskSafe }]}>
                  {isEn ? 'Hương (Daughter)' : message.familyReply.from}
                </ThemedText>
                <ThemedText style={[styles.replyNote, { color: theme.text }]}>
                  {isEn
                    ? familyReplyNote(message.familyReply.action, true)
                    : message.familyReply.note}
                </ThemedText>
                <ThemedText style={[styles.messageMeta, { color: theme.textSecondary }]}>
                  {new Date(message.familyReply.repliedAt).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN')}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.replyActions}>
                <Pressable
                  style={[styles.replyButton, { backgroundColor: theme.primaryAction }]}
                  onPress={() => onReply(message.id, 'call_back_now')}
                  disabled={replyBusyId === message.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('trusted.replyCall')}>
                  <ThemedText style={[styles.replyButtonText, { color: theme.primaryActionText }]}>
                    {t('trusted.replyCall')}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.replyButton, { backgroundColor: theme.riskSafeBg, borderColor: theme.riskSafe, borderWidth: 2 }]}
                  onPress={() => onReply(message.id, 'confirm_safe')}
                  disabled={replyBusyId === message.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('trusted.replySafe')}>
                  <ThemedText style={[styles.replyButtonText, { color: theme.riskSafe }]}>
                    {t('trusted.replySafe')}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ThemedView>
        ))}
      </View>
    </PageContainer>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={[styles.label, { color: theme.text }]}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder, color: theme.text },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChannelBadge({ channel }: { channel: BotChannel }) {
  const theme = useTheme();
  return (
    <View style={[styles.channelBadge, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
      <ThemedText style={[styles.channelBadgeText, { color: theme.primaryAction }]}>
        [{channel.toUpperCase()}]
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: Accessibility.fontSize.large, fontWeight: '800', lineHeight: 32, fontFamily: Fonts.heading },
  subtitle: { fontSize: Accessibility.fontSize.normal, lineHeight: 26, marginVertical: Spacing.two },
  panel: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three, marginTop: Spacing.three },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  panelTitle: { fontSize: Accessibility.fontSize.large, fontWeight: '800', flex: 1 },
  hint: { fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  label: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 2,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: Accessibility.minTouchSize,
  },
  channelLabel: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, minHeight: Accessibility.minTouchSize },
  consentText: { flex: 1, fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: Accessibility.minTouchSize,
    fontSize: Accessibility.fontSize.normal,
  },
  textArea: { minHeight: 100, paddingTop: Spacing.two },
  error: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  sendButton: {
    minHeight: Accessibility.minTouchSize,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sendText: { fontSize: Accessibility.fontSize.normal, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.85 },
  receipt: { borderWidth: 2, borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  receiptTitle: { fontSize: Accessibility.fontSize.normal, fontWeight: '800' },
  receiptBody: { fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  channelBadge: { borderWidth: 1, borderRadius: Spacing.one, paddingHorizontal: Spacing.one, paddingVertical: 1 },
  channelBadgeText: { fontSize: 12, fontWeight: '800' },
  inboxSection: { gap: Spacing.two, marginTop: Spacing.four },
  messageCard: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  messageTime: { fontSize: 12 },
  messageType: { fontSize: Accessibility.fontSize.normal, fontWeight: '800' },
  messageMeta: { fontSize: Accessibility.fontSize.small, lineHeight: 20 },
  contentBox: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one },
  contentLabel: { fontSize: 12, fontWeight: '700' },
  contentText: { fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  replyBox: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one },
  replyFrom: { fontSize: Accessibility.fontSize.small, fontWeight: '800' },
  replyNote: { fontSize: Accessibility.fontSize.small },
  replyActions: { gap: Spacing.two },
  replyButton: {
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: Accessibility.minTouchSize,
    justifyContent: 'center',
  },
  replyButtonText: { fontSize: Accessibility.fontSize.small, fontWeight: '800', textAlign: 'center' },
});
