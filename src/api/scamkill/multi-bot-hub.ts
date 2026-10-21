/**
 * Feature 3A — Consent-gated multi-bot family notification hub.
 *
 * Privacy invariant: without explicit consent the outgoing SMS/Zalo/Telegram
 * text carries metadata only (alert type, timestamp, related number). Message
 * content is attached only when `consentToShareContent === true`, and is
 * PII-redacted before it leaves the device/server.
 */

import { redactPii } from '../preprocess/redact';
import type {
  BotChannel,
  BotDeliveryMessage,
  FamilyAlertInput,
  FamilyAlertReceipt,
  FamilyAlertType,
} from './types';

export interface FamilyReplyPayload {
  from?: string;
  action: 'call_back_now' | 'confirm_scam_block' | 'confirm_safe';
  note?: string;
}

const PRIVACY_WITHHELD_TEXT =
  'Nội dung chi tiết được ẩn để bảo vệ quyền riêng tư (chưa bật đồng ý chia sẻ)';

const DEFAULT_RECIPIENTS = ['Chị Hương (Con gái)'];

const ALERT_TYPE_LABELS: Record<FamilyAlertType, string> = {
  high_risk_call: 'Cảnh báo cuộc gọi nguy cơ cao',
  relative_impersonation:
    'Nghi vấn giả giọng người thân mượn tiền gấp',
  suspicious_message: 'Tin nhắn có dấu hiệu lừa đảo',
  senior_manual_sos: 'Người cao tuổi chủ động nhờ kiểm tra',
};

const REPLY_NOTES: Record<FamilyReplyPayload['action'], string> = {
  call_back_now: 'Con gọi lại cho Mẹ ngay.',
  confirm_scam_block: 'Đã xác nhận số lừa đảo và chặn.',
  confirm_safe: 'Con đang an toàn, Mẹ đừng chuyển tiền.',
};

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

function buildFormattedText(params: {
  alertTypeLabel: string;
  timestamp: string;
  relatedPhoneNumber: string;
  consentGranted: boolean;
  sharedContent: string | null;
}): string {
  const header = [
    `[ScamKill] ${params.alertTypeLabel}`,
    `Thời điểm: ${params.timestamp}`,
    `Số điện thoại liên quan: ${params.relatedPhoneNumber}`,
  ].join('\n');

  const footer =
    'Hành động: Gọi lại cho người thân ngay hoặc xác nhận an toàn.';

  if (!params.consentGranted) {
    return `${header}\n${PRIVACY_WITHHELD_TEXT}\n${footer}`;
  }

  const content = params.sharedContent ?? 'Không có nội dung được cung cấp.';
  return `${header}\nNội dung được chia sẻ (đã làm mờ OTP/CCCD): ${content}\n${footer}`;
}

async function sendTelegramMessage(
  text: string,
  chatId?: string,
): Promise<boolean> {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const token = env?.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || env?.TELEGRAM_DEFAULT_CHAT_ID;

  if (!token || !targetChatId || typeof fetch !== 'function') return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      },
    );

    if (response.ok === false) return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function createSeedMessage(): BotDeliveryMessage {
  const timestamp = '2026-10-22T08:30:00.000Z';
  return {
    id: 'seed-demo-ba-lan',
    channel: 'telegram',
    recipient: 'Chị Hương (Con gái)',
    seniorName: 'Bà Lan',
    alertType: 'relative_impersonation',
    alertTypeLabel: ALERT_TYPE_LABELS.relative_impersonation,
    timestamp,
    relatedPhoneNumber: '0918 765 432',
    consentGranted: false,
    sharedContent: null,
    formattedText: buildFormattedText({
      alertTypeLabel: ALERT_TYPE_LABELS.relative_impersonation,
      timestamp,
      relatedPhoneNumber: '0918 765 432',
      consentGranted: false,
      sharedContent: null,
    }),
    deliveryMode: 'simulated_gateway',
    status: 'replied_safe',
    familyReply: {
      from: 'Chị Hương (Con gái)',
      action: 'call_back_now',
      note: 'Con đang ở cơ quan, Mẹ đừng chuyển tiền. Con gọi lại ngay.',
      repliedAt: '2026-10-22T08:31:00.000Z',
    },
  };
}

const inbox: BotDeliveryMessage[] = [createSeedMessage()];

/**
 * Dispatch one alert across selected channels. Metadata-only by default.
 */
export async function dispatchFamilyAlert(
  input: FamilyAlertInput,
): Promise<FamilyAlertReceipt> {
  const consentGranted = input.consentToShareContent ?? false;
  const alertTypeLabel = ALERT_TYPE_LABELS[input.alertType];
  const seniorName = input.seniorName || 'Bà Lan';
  const relatedPhoneNumber = input.relatedPhoneNumber || 'Không rõ';
  const timestamp = input.timestamp ?? new Date().toISOString();
  const channels: BotChannel[] =
    input.channels && input.channels.length > 0
      ? input.channels
      : ['sms', 'zalo', 'telegram'];
  const recipientNames =
    input.recipientNames && input.recipientNames.length > 0
      ? input.recipientNames
      : DEFAULT_RECIPIENTS;

  const sharedContent =
    consentGranted && input.messageOrCallContent?.trim()
      ? redactPii(input.messageOrCallContent).text
      : null;

  const formattedText = buildFormattedText({
    alertTypeLabel,
    timestamp,
    relatedPhoneNumber,
    consentGranted,
    sharedContent,
  });

  const deliveries: BotDeliveryMessage[] = [];
  const uniqueChannels = [...new Set(channels)];

  for (const channel of uniqueChannels) {
    const recipient =
      recipientNames[deliveries.length] ?? recipientNames[0] ?? 'Người thân';

    const deliveredLive =
      channel === 'telegram'
        ? await sendTelegramMessage(formattedText, input.telegramChatId)
        : false;

    deliveries.push({
      id: nextId('bot'),
      channel,
      recipient,
      seniorName,
      alertType: input.alertType,
      alertTypeLabel,
      timestamp,
      relatedPhoneNumber,
      consentGranted,
      sharedContent,
      formattedText,
      deliveryMode: deliveredLive
        ? 'live_telegram_api'
        : 'simulated_gateway',
      status: 'delivered',
    });
  }

  inbox.unshift(...deliveries);
  if (inbox.length > 100) inbox.length = 100;

  return {
    alertId: nextId('alert'),
    timestamp,
    consentToShareContent: consentGranted,
    sharedContentIncluded: sharedContent !== null,
    deliveries,
    summaryText: consentGranted
      ? `Đã gửi "${alertTypeLabel}" tới ${deliveries.length} kênh kèm nội dung đã được đồng ý chia sẻ.`
      : `Đã gửi "${alertTypeLabel}" tới ${deliveries.length} kênh. Chỉ gửi thông tin tối thiểu để bảo vệ quyền riêng tư.`,
  };
}

/** Snapshot of the demo family inbox, newest first. */
export function getBotInboxHistory(): BotDeliveryMessage[] {
  return inbox.map((message) => ({
    ...message,
    familyReply: message.familyReply ? { ...message.familyReply } : undefined,
  }));
}

/**
 * Record a relative's co-decision reply against one delivery.
 * Returns null when the message does not exist.
 */
export function recordFamilyReply(
  messageId: string,
  reply: FamilyReplyPayload,
): BotDeliveryMessage | null {
  const message = inbox.find((item) => item.id === messageId);
  if (!message) return null;

  const status =
    reply.action === 'confirm_scam_block'
      ? 'replied_scam_blocked'
      : 'replied_safe';

  const familyReply = {
    from: reply.from?.trim() || 'Người thân',
    action: reply.action,
    note: reply.note?.trim() || REPLY_NOTES[reply.action],
    repliedAt: new Date().toISOString(),
  };

  message.status = status;
  message.familyReply = familyReply;

  return {
    ...message,
    familyReply: { ...familyReply },
  };
}
