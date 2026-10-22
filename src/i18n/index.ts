import { I18n } from 'i18n-js';
import vi from '../locales/vi.json';
import en from '../locales/en.json';
import { getDialect } from './regional';
import type {
  CallCheckOutput,
  CallRiskStatus,
  CallSourceSignal,
  FamilyAlertReceipt,
  FamilyAlertType,
} from '../api/scamkill/types';

const translations = { vi, en } as const;

const i18n = new I18n(translations);
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

/** Typed internationalization wrapper. Returns key as fallback if missing. */
export function t(key: string, params?: Record<string, string | number>): string {
  const activeLocale = getDialect() === 'en' ? 'en' : 'vi';
  if (i18n.locale !== activeLocale) {
    i18n.locale = activeLocale;
  }
  return i18n.t(key, params) ?? key;
}

const CALL_STATUS_EN: Record<CallRiskStatus, string> = {
  high_risk: 'High risk',
  caution: 'Use caution',
  unverified: 'Unverified',
  safe: 'In contacts',
};

const CALL_STATUS_VI: Record<CallRiskStatus, string> = {
  high_risk: 'Nguy cơ cao',
  caution: 'Cần cảnh giác',
  unverified: 'Chưa xác minh',
  safe: 'Trong danh bạ',
};

const CALL_SIGNAL_EN: Record<CallSourceSignal, string> = {
  scamkill_community: 'Community reports',
  official_ntrust_boca: 'Public / Ministry of Public Security source',
  foreign_prefix_rule: 'Unknown international prefix',
  burst_calling_rule: 'Repeated burst calls',
  not_in_contacts_rule: 'Not in your contacts',
  saved_family_contact: 'Saved family number',
};

const CALL_SIGNAL_VI: Record<CallSourceSignal, string> = {
  scamkill_community: 'Báo cáo cộng đồng',
  official_ntrust_boca: 'Nguồn công khai / Bộ Công an',
  foreign_prefix_rule: 'Đầu số quốc tế lạ',
  burst_calling_rule: 'Gọi dồn dập nhiều lần',
  not_in_contacts_rule: 'Không có trong danh bạ',
  saved_family_contact: 'Số người thân đã lưu',
};

export function callStatusLabel(status: CallRiskStatus, isEn: boolean): string {
  return (isEn ? CALL_STATUS_EN : CALL_STATUS_VI)[status];
}

export function callSignalLabel(signal: CallSourceSignal, isEn: boolean): string {
  return (isEn ? CALL_SIGNAL_EN : CALL_SIGNAL_VI)[signal];
}

export interface LocalizedCallOutput {
  badgeLabel: string;
  shortReason: string;
  reasons: string[];
  epistemicNote: string;
}

const CALL_COPY_EN: Record<CallRiskStatus, { badgeLabel: string; shortReason: string; tail: string }> = {
  high_risk: {
    badgeLabel: 'High risk: known scam pattern or strong pressure to transfer money',
    shortReason: 'This call shows several strong scam signs.',
    tail: 'Signs of impersonating authorities or pushing for urgent money',
  },
  caution: {
    badgeLabel:
      'Unknown number, not in your contacts. If this caller asks for urgent money, pause and verify first.',
    shortReason: 'This number is unknown and the story creates urgency.',
    tail: 'Caller asks for urgent money or claims an emergency',
  },
  unverified: {
    badgeLabel:
      'We could not verify this caller. Never transfer money and never read out an OTP.',
    shortReason: 'There is no community data about this number yet.',
    tail: 'No community reports for this number yet',
  },
  safe: {
    badgeLabel: 'This number is in your contacts. If they ask for urgent money, verify anyway.',
    shortReason: 'This number is saved in your contacts.',
    tail: 'No urgent money request detected',
  },
};

/**
 * English presentation for call-risk engine output. The engine returns
 * Vietnamese copy; components render this overlay when the app is in EN mode.
 */
export function localizeCallOutput(
  output: CallCheckOutput,
  isEn: boolean
): LocalizedCallOutput {
  if (!isEn) {
    return {
      badgeLabel: output.badgeLabel,
      shortReason: output.shortReason,
      reasons: output.reasons,
      epistemicNote: output.epistemicNote,
    };
  }

  const copy = CALL_COPY_EN[output.status];
  const savedCaution =
    output.status === 'caution' && output.signals.includes('saved_family_contact');
  const reasons: string[] = [];
  if (output.signals.includes('scamkill_community')) {
    reasons.push(`Reported by ${output.communityReportCount} community members`);
  }
  if (output.signals.includes('foreign_prefix_rule')) {
    reasons.push('Foreign international prefix');
  }
  if (output.signals.includes('burst_calling_rule')) {
    reasons.push('Calling repeatedly in a burst');
  }
  if (output.signals.includes('not_in_contacts_rule')) {
    reasons.push('Number is not in your contacts');
  }
  if (output.signals.includes('saved_family_contact')) {
    reasons.push('Saved family number');
  }
  reasons.push(copy.tail);

  const badgeLabel =
    output.status === 'high_risk' && output.communityReportCount > 0
      ? `High risk: reported by ${output.communityReportCount} community members`
      : savedCaution
        ? 'This number is in your contacts but asks for urgent money. Verify before sending anything.'
        : copy.badgeLabel;

  return {
    badgeLabel,
    shortReason: savedCaution
      ? 'A saved contact suddenly asks for urgent money, which is unusual.'
      : copy.shortReason,
    reasons: reasons.slice(0, 3),
    epistemicNote:
      'Limit: the app gives a risk level, not 100% certainty. When data is missing it shows Unverified.',
  };
}

const ALERT_TYPE_EN: Record<FamilyAlertType, string> = {
  high_risk_call: 'High-risk call warning',
  relative_impersonation: 'Possible relative voice clone asking for urgent money',
  suspicious_message: 'Message with scam signs',
  senior_manual_sos: 'Senior asked family to check',
};

const ALERT_TYPE_VI: Record<FamilyAlertType, string> = {
  high_risk_call: 'Cảnh báo cuộc gọi nguy cơ cao',
  relative_impersonation: 'Nghi vấn giả giọng người thân mượn tiền gấp',
  suspicious_message: 'Tin nhắn có dấu hiệu lừa đảo',
  senior_manual_sos: 'Người cao tuổi chủ động nhờ kiểm tra',
};

export function alertTypeLabel(type: FamilyAlertType, isEn: boolean): string {
  return (isEn ? ALERT_TYPE_EN : ALERT_TYPE_VI)[type];
}

/** Localized one-line receipt summary; Vietnamese uses the stored summary. */
export function alertReceiptSummary(receipt: FamilyAlertReceipt, isEn: boolean): string {
  if (!isEn) return receipt.summaryText;
  const count = receipt.deliveries.length;
  const type = receipt.deliveries[0]?.alertType;
  const label = type ? alertTypeLabel(type, true) : ALERT_TYPE_EN.senior_manual_sos;
  const privacy = receipt.sharedContentIncluded
    ? 'Content was shared with your consent.'
    : 'Only minimal metadata was sent to protect privacy.';
  return `Alert "${label}" sent to ${count} channel${count === 1 ? '' : 's'}. ${privacy}`;
}

const REPLY_NOTE_EN: Record<'call_back_now' | 'confirm_scam_block' | 'confirm_safe', string> = {
  call_back_now: 'I am calling Mom back now.',
  confirm_scam_block: 'Confirmed the scam number and blocked it.',
  confirm_safe: 'I am safe, please do not transfer money.',
};

export function familyReplyNote(
  action: 'call_back_now' | 'confirm_scam_block' | 'confirm_safe',
  isEn: boolean
): string {
  if (isEn) return REPLY_NOTE_EN[action];
  return (action === 'call_back_now'
    ? 'Con gọi lại cho Mẹ ngay.'
    : action === 'confirm_scam_block'
      ? 'Đã xác nhận số lừa đảo và chặn.'
      : 'Con đang an toàn, Mẹ đừng chuyển tiền.');
}

export { i18n, translations };
