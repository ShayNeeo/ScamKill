/**
 * ScamKill Core Shared Types & Zod Schemas
 * Covers:
 * - Feature 1: Pre-Call Risk Warning (Call Shield)
 * - Feature 2: Suspicious Message Analysis (Plain-language 1-3 reasons + Cooling-off)
 * - Feature 3: Relative Verification (Family Safe-Word + Consent-Gated Multi-Bot Alert via SMS/Zalo/Telegram)
 * - Wizard-of-Oz Pitch Scenarios ("Kịch bản Bà Lan" & presets)
 */

import { z } from 'zod';
import type { AnalyzeOutput, RiskLevel } from '../contract';

// ── Feature 1: Pre-Call Risk Warning (Call Shield) ──────────────────────────

export const CallRiskStatusSchema = z.enum([
  'high_risk',   // Nguy cơ cao (reported by community / official blacklist / international spoof)
  'caution',     // Cần cảnh giác (unknown number + money/urgency context or burst calls)
  'unverified',  // Chưa xác minh (honest epistemic boundary when data is insufficient)
  'safe',        // Trong danh bạ / Đã xác thực
]);
export type CallRiskStatus = z.infer<typeof CallRiskStatusSchema>;

export const CallSourceSignalSchema = z.enum([
  'scamkill_community',     // Báo cáo cộng đồng trong ScamKill
  'official_ntrust_boca',   // Nguồn công khai / đối tác (nTrust / Bộ Công an)
  'foreign_prefix_rule',    // Đầu số quốc tế lạ (+855, +856, +234...)
  'burst_calling_rule',     // Gọi dồn dập nhiều cuộc liên tiếp
  'not_in_contacts_rule',   // Số không có trong danh bạ
  'saved_family_contact',   // Số người thân đã lưu trong danh bạ
]);
export type CallSourceSignal = z.infer<typeof CallSourceSignalSchema>;

export const CallCheckInputSchema = z.object({
  phoneNumber: z.string().min(1),
  callerClaimedName: z.string().optional(),
  inContacts: z.boolean().optional().default(false),
  burstCallCount: z.number().int().min(1).optional().default(1),
  spokenTranscriptPreview: z.string().optional(),
  asksForUrgentMoney: z.boolean().optional().default(false),
});
export type CallCheckInput = z.input<typeof CallCheckInputSchema>;

export const CallCheckOutputSchema = z.object({
  phoneNumber: z.string(),
  normalizedNumber: z.string(),
  status: CallRiskStatusSchema,
  badgeLabel: z.string(),        // e.g. "Nguy cơ cao: số bị nhiều người báo cáo giả danh cơ quan chức năng" or "Chưa xác minh"
  shortReason: z.string(),
  reasons: z.array(z.string()).min(1).max(3),
  signals: z.array(CallSourceSignalSchema),
  communityReportCount: z.number().int().min(0),
  epistemicNote: z.string(),     // Explicit note: system provides risk level, not 100% certainty
  requiresRelativeVerification: z.boolean(),
  recommendedLoopStep: z.enum(['detect', 'slow_down', 'verify', 'co_decide']),
  verificationProtocol: z.object({
    askFamilySafeWord: z.boolean(),
    hangUpAndCallSavedNumber: z.boolean(),
    promptText: z.string(),
  }),
  coolingOff: z.boolean(),
  coolingOffHours: z.number().int(),
  suggestedReply: z.string(),
});
export type CallCheckOutput = z.infer<typeof CallCheckOutputSchema>;

// ── Feature 3: Multi-Bot Family Alert & Relative Verification ───────────────

export const BotChannelSchema = z.enum(['sms', 'zalo', 'telegram']);
export type BotChannel = z.infer<typeof BotChannelSchema>;

export const FamilyAlertTypeSchema = z.enum([
  'high_risk_call',        // Cảnh báo cuộc gọi nguy cơ cao
  'relative_impersonation',// Nghi vấn giả giọng người thân mượn tiền gấp (Kịch bản Bà Lan)
  'suspicious_message',    // Tin nhắn có dấu hiệu lừa đảo / OTP / Link lạ
  'senior_manual_sos',     // Người cao tuổi chủ động bấm "Tôi nghi ngờ" / "Kiểm tra"
]);
export type FamilyAlertType = z.infer<typeof FamilyAlertTypeSchema>;

export const FamilyAlertInputSchema = z.object({
  seniorName: z.string().default('Bà Lan'),
  alertType: FamilyAlertTypeSchema,
  relatedPhoneNumber: z.string().default('Không rõ'),
  timestamp: z.string().optional(),
  channels: z.array(BotChannelSchema).min(1).default(['sms', 'zalo', 'telegram']),
  consentToShareContent: z.boolean().default(false),
  messageOrCallContent: z.string().optional(),
  recipientNames: z.array(z.string()).optional().default(['Chị Hương (Con gái)']),
  telegramChatId: z.string().optional(),
});
export type FamilyAlertInput = z.input<typeof FamilyAlertInputSchema>;

export interface BotDeliveryMessage {
  id: string;
  channel: BotChannel;
  recipient: string;
  seniorName: string;
  alertType: FamilyAlertType;
  alertTypeLabel: string;
  timestamp: string;
  relatedPhoneNumber: string;
  consentGranted: boolean;
  sharedContent: string | null; // Strictly null when consentToShareContent === false
  formattedText: string;
  deliveryMode: 'live_telegram_api' | 'simulated_gateway';
  status: 'delivered' | 'replied_safe' | 'replied_scam_blocked';
  familyReply?: {
    from: string;
    action: 'call_back_now' | 'confirm_scam_block' | 'confirm_safe';
    note: string;
    repliedAt: string;
  };
}

export interface FamilyAlertReceipt {
  alertId: string;
  timestamp: string;
  consentToShareContent: boolean;
  sharedContentIncluded: boolean;
  deliveries: BotDeliveryMessage[];
  summaryText: string;
}

// ── Canonical Pitch Scenarios ("Fake It Until You Make It") ─────────────────

export interface ScamKillScenario {
  id: 'ba-lan-30m' | 'fake-police-call' | 'unverified-number' | 'fake-bank-otp-sms' | 'zalo-voice-clone';
  title: string;
  subtitle: string;
  layer: 1 | 2 | 3;
  badge: string;
  callInput?: CallCheckInput;
  messageText?: string;
  expectedCallOutput?: CallCheckOutput;
  expectedAnalyzeOutput?: AnalyzeOutput;
  autoTriggerAlertInput?: FamilyAlertInput;
}
