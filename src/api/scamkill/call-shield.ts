/**
 * Feature 1 — Pre-call risk warning (call shield).
 *
 * Deterministic reputation + heuristic evaluation. The engine returns a risk
 * level, never a claim of certainty; "unverified" is a first-class state.
 */

import type { CallCheckInput, CallCheckOutput, CallSourceSignal } from './types';

const EPISTEMIC_NOTE =
  'Hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn một số là lừa đảo; khi dữ liệu chưa đủ, ứng dụng hiển thị Chưa xác minh.';

const UNKNOWN_CAUTION_BADGE =
  'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh';

const RELATIVE_VERIFICATION_PROTOCOL: CallCheckOutput['verificationProtocol'] = {
  askFamilySafeWord: true,
  hangUpAndCallSavedNumber: true,
  promptText:
    '1. Hỏi "Mã gia đình" đã đặt trước. 2. Cúp máy và gọi lại số con/cháu đã lưu trong danh bạ.',
};

const NO_VERIFICATION_PROTOCOL: CallCheckOutput['verificationProtocol'] = {
  askFamilySafeWord: false,
  hangUpAndCallSavedNumber: false,
  promptText:
    'Chưa có dấu hiệu khẩn cấp. Nếu người gọi yêu cầu chuyển tiền hoặc đọc mã OTP, hãy dừng lại và xác minh với người thân.',
};

const FOREIGN_PREFIXES = ['+855', '+856', '+234', '+675'] as const;

const URGENT_CUES = [
  'tai nạn',
  'chuyển gấp',
  '30 triệu',
  'cấp cứu',
  'bí mật',
  'chuyển tiền',
  'đặt cọc',
  'viện phí',
  'otp',
] as const;

const AUTHORITY_CUES = [
  'công an',
  'viện kiểm sát',
  'lệnh bắt',
  'khóa tài khoản',
  'tòa án',
  'ngân hàng',
  'thuế',
  'vneid',
] as const;

interface ReportProfile {
  communityReportCount: number;
  category: 'police_impersonation' | 'fake_bank_lock' | 'relative_impersonation';
  highRisk: boolean;
  badgeLabel: string;
}

/**
 * Curated high-risk / known-pattern numbers. `0918765432` is the Bà Lan demo
 * number: it has no community reports yet, but matches the relative-emergency
 * pattern and is therefore only `caution` until corroborated.
 */
const REPORTED_NUMBERS: Record<string, ReportProfile> = {
  '02477778888': {
    communityReportCount: 142,
    category: 'police_impersonation',
    highRisk: true,
    badgeLabel:
      'Nguy cơ cao: số bị nhiều người báo cáo giả danh cơ quan chức năng',
  },
  '+855889123456': {
    communityReportCount: 142,
    category: 'police_impersonation',
    highRisk: true,
    badgeLabel:
      'Nguy cơ cao: số bị nhiều người báo cáo giả danh cơ quan chức năng',
  },
  '1900888999': {
    communityReportCount: 87,
    category: 'fake_bank_lock',
    highRisk: true,
    badgeLabel: 'Nguy cơ cao: số bị nhiều người báo cáo giả danh ngân hàng',
  },
  '0918765432': {
    communityReportCount: 0,
    category: 'relative_impersonation',
    highRisk: false,
    badgeLabel: 'Số lạ có mẫu giả giọng người thân đòi tiền gấp',
  },
};

/** Saved relatives used for demo / human-readable context only. */
const SAVED_FAMILY_CONTACTS: Record<string, string> = {
  '0905111222': 'Chị Hương (Con gái)',
};

/** Strip formatting characters while preserving an international prefix. */
export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function containsAny(text: string, needles: readonly string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const plain = stripDiacritics(lower);
  return needles.some((needle) => {
    const n = needle.toLowerCase();
    return lower.includes(n) || plain.includes(stripDiacritics(n));
  });
}

function isForeignPrefix(normalizedNumber: string): boolean {
  return FOREIGN_PREFIXES.some((prefix) => normalizedNumber.startsWith(prefix));
}

interface OutputDraft {
  status: CallCheckOutput['status'];
  badgeLabel: string;
  shortReason: string;
  reasons: string[];
  signals: CallSourceSignal[];
  communityReportCount: number;
  requiresRelativeVerification: boolean;
  recommendedLoopStep: CallCheckOutput['recommendedLoopStep'];
  coolingOff: boolean;
  coolingOffHours: number;
  suggestedReply: string;
  verificationProtocol?: CallCheckOutput['verificationProtocol'];
}

function makeOutput(
  phoneNumber: string,
  normalizedNumber: string,
  draft: OutputDraft,
): CallCheckOutput {
  return {
    ...draft,
    phoneNumber,
    normalizedNumber,
    epistemicNote: EPISTEMIC_NOTE,
    verificationProtocol: draft.verificationProtocol ?? NO_VERIFICATION_PROTOCOL,
    signals: [...new Set(draft.signals)],
    reasons: draft.reasons.slice(0, 3),
  };
}

function highRiskOutput(
  phoneNumber: string,
  normalizedNumber: string,
  report: ReportProfile | undefined,
  signals: CallSourceSignal[],
  options: { burstCallCount: number; authorityCue: boolean; inContacts: boolean },
): CallCheckOutput {
  const foreign = isForeignPrefix(normalizedNumber);
  const reasons: string[] = [];

  if (report && report.communityReportCount > 0) {
    reasons.push(`Số đã bị ${report.communityReportCount} người dùng báo cáo`);
  } else if (foreign) {
    reasons.push(`Đầu số quốc tế lạ (${FOREIGN_PREFIXES.find((p) => normalizedNumber.startsWith(p))})`);
  }
  reasons.push(
    options.authorityCue
      ? 'Nội dung có dấu hiệu giả danh cơ quan chức năng'
      : 'Có dấu hiệu thúc ép chuyển tiền hoặc đe dọa',
  );
  if (options.burstCallCount >= 3) reasons.push('Gọi dồn dập nhiều cuộc liên tiếp');
  if (options.inContacts) reasons.push('Số đã lưu nhưng có dấu hiệu bất thường');

  return makeOutput(phoneNumber, normalizedNumber, {
    status: 'high_risk',
    badgeLabel: report?.highRisk
      ? report.badgeLabel
      : foreign
        ? 'Nguy cơ cao: đầu số quốc tế lạ kèm dấu hiệu giả danh hoặc đòi tiền'
        : 'Nguy cơ cao: số lạ gọi dồn dập kèm dấu hiệu giả danh hoặc đòi tiền',
    shortReason:
      report && report.communityReportCount > 0
        ? 'Số này nằm trong danh sách báo cáo lừa đảo.'
        : foreign
          ? 'Đầu số quốc tế lạ kèm dấu hiệu giả danh hoặc đòi tiền.'
          : 'Số lạ gọi dồn dập kèm dấu hiệu giả danh hoặc đòi tiền.',
    reasons,
    signals,
    communityReportCount: report?.communityReportCount ?? 0,
    requiresRelativeVerification: true,
    recommendedLoopStep: 'slow_down',
    coolingOff: true,
    coolingOffHours: 48,
    suggestedReply: 'Chặn số này và không trả lời',
    verificationProtocol: RELATIVE_VERIFICATION_PROTOCOL,
  });
}

function unknownCautionOutput(
  phoneNumber: string,
  normalizedNumber: string,
  overlay: Pick<OutputDraft, 'badgeLabel' | 'shortReason' | 'reasons'>,
  signals: CallSourceSignal[],
  burstCallCount: number,
  communityReportCount = 0,
): CallCheckOutput {
  const cautionSignals: CallSourceSignal[] = [...signals, 'not_in_contacts_rule'];
  if (burstCallCount > 1) cautionSignals.push('burst_calling_rule');

  return makeOutput(phoneNumber, normalizedNumber, {
    status: 'caution',
    ...overlay,
    signals: cautionSignals,
    communityReportCount,
    requiresRelativeVerification: true,
    recommendedLoopStep: 'verify',
    coolingOff: true,
    coolingOffHours: 48,
    suggestedReply:
      'Đừng chuyển tiền ngay. Hỏi "Mã gia đình" và cúp máy, gọi lại số người thân đã lưu.',
    verificationProtocol: RELATIVE_VERIFICATION_PROTOCOL,
  });
}

/**
 * Evaluate an incoming call. Pure and deterministic: same input -> same output.
 */
export function evaluateIncomingCall(input: CallCheckInput): CallCheckOutput {
  const phoneNumber = input.phoneNumber;
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  const savedName = SAVED_FAMILY_CONTACTS[normalizedNumber];
  const inContacts = input.inContacts ?? Boolean(savedName);
  const burstCallCount = Math.max(1, input.burstCallCount ?? 1);
  const asksForUrgentMoney = input.asksForUrgentMoney ?? false;
  const transcript = input.spokenTranscriptPreview ?? '';

  const report = REPORTED_NUMBERS[normalizedNumber];
  const foreign = isForeignPrefix(normalizedNumber);
  const urgentCue = asksForUrgentMoney || containsAny(transcript, URGENT_CUES);
  const authorityCue =
    containsAny(transcript, AUTHORITY_CUES) ||
    containsAny(input.callerClaimedName ?? '', AUTHORITY_CUES) ||
    report?.category === 'police_impersonation';

  const signals: CallSourceSignal[] = [];
  if (report && report.communityReportCount > 0) signals.push('scamkill_community');
  if (foreign) signals.push('foreign_prefix_rule');
  if (!inContacts) signals.push('not_in_contacts_rule');
  if (burstCallCount >= 3) signals.push('burst_calling_rule');
  if (inContacts) signals.push('saved_family_contact');

  // Known high-risk number always wins, even if the user saved it by mistake.
  if (report?.highRisk) {
    return highRiskOutput(phoneNumber, normalizedNumber, report, signals, {
      burstCallCount,
      authorityCue,
      inContacts,
    });
  }

  // Unknown or suspicious foreign prefix plus authority/money cues is high risk.
  if (foreign && (authorityCue || urgentCue)) {
    return highRiskOutput(phoneNumber, normalizedNumber, report, signals, {
      burstCallCount,
      authorityCue,
      inContacts,
    });
  }

  // Saved contact: trusted unless the call suddenly demands emergency money.
  if (inContacts) {
    if (urgentCue) {
      return makeOutput(phoneNumber, normalizedNumber, {
        status: 'caution',
        badgeLabel:
          'Số đã lưu trong danh bạ nhưng yêu cầu chuyển tiền gấp — cẩn thận giả mạo SIM/Zalo',
        shortReason:
          'Số đã lưu nhưng nội dung đòi tiền gấp là dấu hiệu bất thường.',
        reasons: [
          `Số có trong danh bạ${savedName ? ` (${savedName})` : ''}`,
          'Yêu cầu chuyển tiền gấp có thể do SIM/Zalo bị chiếm đoạt',
          'Hỏi Mã gia đình và gọi lại số đã lưu trước khi chuyển tiền',
        ],
        signals,
        communityReportCount: 0,
        requiresRelativeVerification: true,
        recommendedLoopStep: 'verify',
        coolingOff: true,
        coolingOffHours: 48,
        suggestedReply:
          'Đừng chuyển tiền ngay. Hỏi "Mã gia đình" và gọi lại số đã lưu.',
        verificationProtocol: RELATIVE_VERIFICATION_PROTOCOL,
      });
    }

    return makeOutput(phoneNumber, normalizedNumber, {
      status: 'safe',
      badgeLabel: 'Số đã lưu trong danh bạ',
      shortReason: `Số này có trong danh bạ${savedName ? ` (${savedName})` : ''}.`,
      reasons: [
        `Số đã lưu trong danh bạ${savedName ? ` (${savedName})` : ''}`,
        'Chưa phát hiện dấu hiệu yêu cầu tiền gấp',
      ],
      signals,
      communityReportCount: 0,
      requiresRelativeVerification: false,
      recommendedLoopStep: 'detect',
      coolingOff: false,
      coolingOffHours: 0,
      suggestedReply:
        'Số đã lưu trong danh bạ. Vẫn xác nhận trực tiếp nếu có yêu cầu chuyển tiền.',
      verificationProtocol: NO_VERIFICATION_PROTOCOL,
    });
  }

  // Unknown number + emergency money + burst calling => escalate to high risk.
  if (urgentCue && burstCallCount >= 3) {
    return highRiskOutput(phoneNumber, normalizedNumber, report, signals, {
      burstCallCount,
      authorityCue,
      inContacts,
    });
  }

  // The canonical Bà Lan pattern: unknown number, accident story, urgent money.
  if (urgentCue) {
    return unknownCautionOutput(
      phoneNumber,
      normalizedNumber,
      {
        badgeLabel: UNKNOWN_CAUTION_BADGE,
        shortReason:
          'Số lạ kèm nội dung tai nạn / chuyển tiền gấp — cần xác minh qua người thân.',
        reasons: [
          'Số không có trong danh bạ',
          'Nội dung có dấu hiệu thúc ép chuyển tiền gấp',
          'Cần xác minh bằng Mã gia đình và gọi lại số đã lưu',
        ],
      },
      signals,
      burstCallCount,
      report?.communityReportCount ?? 0,
    );
  }

  if (authorityCue) {
    return unknownCautionOutput(
      phoneNumber,
      normalizedNumber,
      {
        badgeLabel:
          'Số lạ tự xưng cơ quan chức năng. Hãy cúp máy và gọi lại qua số chính thức.',
        shortReason:
          'Số lạ tự xưng cơ quan chức năng nhưng chưa có báo cáo cộng đồng.',
        reasons: [
          'Số không có trong danh bạ',
          'Người gọi tự xưng cơ quan chức năng',
          'Không chuyển tiền hoặc đọc mã OTP qua điện thoại',
        ],
      },
      signals,
      burstCallCount,
      report?.communityReportCount ?? 0,
    );
  }

  if (burstCallCount >= 3) {
    return unknownCautionOutput(
      phoneNumber,
      normalizedNumber,
      {
        badgeLabel: `Số lạ gọi dồn dập ${burstCallCount} lần. Hãy kiểm tra trước khi nghe máy.`,
        shortReason: 'Số lạ gọi dồn dập nhiều cuộc liên tiếp.',
        reasons: [
          'Số không có trong danh bạ',
          `Đã gọi ${burstCallCount} lần liên tiếp`,
          'Hãy kiểm tra với người thân trước khi trao đổi thông tin',
        ],
      },
      signals,
      burstCallCount,
      report?.communityReportCount ?? 0,
    );
  }

  if (foreign) {
    return unknownCautionOutput(
      phoneNumber,
      normalizedNumber,
      {
        badgeLabel: 'Đầu số quốc tế lạ — cần cảnh giác, không chuyển tiền.',
        shortReason: 'Đầu số quốc tế lạ nhưng chưa có báo cáo cộng đồng.',
        reasons: [
          'Số không có trong danh bạ',
          'Đầu số quốc tế lạ (+855, +856, +234, +675)',
          'Không chuyển tiền hoặc đọc mã OTP khi chưa xác minh',
        ],
      },
      signals,
      burstCallCount,
      report?.communityReportCount ?? 0,
    );
  }

  // No reports, no money cues, no structural warning: stay honest.
  return makeOutput(phoneNumber, normalizedNumber, {
    status: 'unverified',
    badgeLabel: 'Chưa xác minh',
    shortReason: 'Chưa có dữ liệu báo cáo về số này.',
    reasons: [
      'Số không có trong danh bạ',
      'Chưa có báo cáo cộng đồng về số này',
      'Không chuyển tiền hoặc đọc mã OTP khi chưa xác minh',
    ],
    signals,
    communityReportCount: 0,
    requiresRelativeVerification: false,
    recommendedLoopStep: 'detect',
    coolingOff: false,
    coolingOffHours: 0,
    suggestedReply:
      'Không chuyển tiền hoặc đọc mã OTP. Hãy kiểm tra lại với người thân.',
    verificationProtocol: NO_VERIFICATION_PROTOCOL,
  });
}
