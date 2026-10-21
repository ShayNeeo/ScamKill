import { beforeEach, describe, expect, it } from 'vitest';
import {
  evaluateIncomingCall,
  normalizePhoneNumber,
} from '../../src/api/scamkill/call-shield';
import {
  SCAMKILL_SCENARIOS,
  getScenarioById,
} from '../../src/api/scamkill/scenarios';
import {
  dispatchFamilyAlert,
  getBotInboxHistory,
  recordFamilyReply,
} from '../../src/api/scamkill/multi-bot-hub';
import {
  checkIncomingCall,
  checkIncomingCallSync,
  getBotInbox,
  getDefaultFamilySafeWord,
  simulateFamilyReply,
} from '../../src/api/scamkill/client';
import type {
  CallCheckInput,
  FamilyAlertInput,
} from '../../src/api/scamkill/types';

const PRIVACY_WITHHELD_TEXT =
  'Nội dung chi tiết được ẩn để bảo vệ quyền riêng tư (chưa bật đồng ý chia sẻ)';

function callInput(
  overrides: Partial<CallCheckInput> & { phoneNumber: string },
): CallCheckInput {
  return {
    inContacts: false,
    burstCallCount: 1,
    asksForUrgentMoney: false,
    ...overrides,
  };
}

function alertInput(overrides: Partial<FamilyAlertInput> = {}): FamilyAlertInput {
  return {
    seniorName: 'Bà Lan',
    alertType: 'relative_impersonation',
    relatedPhoneNumber: '0918 765 432',
    channels: ['sms', 'zalo', 'telegram'],
    consentToShareContent: false,
    recipientNames: ['Chị Hương (Con gái)'],
    ...overrides,
  };
}

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_DEFAULT_CHAT_ID;
});

describe('Feature 1 — call shield', () => {
  it('flags a reported police-impersonation number as high risk', () => {
    const result = evaluateIncomingCall(
      callInput({ phoneNumber: '+855 88 912 3456' }),
    );

    expect(result.normalizedNumber).toBe('+855889123456');
    expect(result.status).toBe('high_risk');
    expect(result.badgeLabel).toContain('giả danh cơ quan chức năng');
    expect(result.communityReportCount).toBe(142);
    expect(result.signals).toEqual(
      expect.arrayContaining(['scamkill_community', 'foreign_prefix_rule']),
    );
    expect(result.coolingOff).toBe(true);
    expect(result.suggestedReply).toBe('Chặn số này và không trả lời');
  });

  it('flags the domestic reported police number as high risk', () => {
    const result = evaluateIncomingCall(
      callInput({ phoneNumber: '024 7777 8888' }),
    );

    expect(result.normalizedNumber).toBe('02477778888');
    expect(result.status).toBe('high_risk');
    expect(result.communityReportCount).toBe(142);
  });

  it('returns caution for the Bà Lan unknown-number emergency call', () => {
    const result = evaluateIncomingCall(
      callInput({
        phoneNumber: '0918 765 432',
        asksForUrgentMoney: true,
        spokenTranscriptPreview:
          'Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp, đừng nói với ai nhé',
        burstCallCount: 1,
      }),
    );

    expect(result.normalizedNumber).toBe('0918765432');
    expect(result.status).toBe('caution');
    expect(result.badgeLabel).toBe(
      'Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh',
    );
    expect(result.requiresRelativeVerification).toBe(true);
    expect(result.recommendedLoopStep).toBe('verify');
    expect(result.coolingOff).toBe(true);
    expect(result.reasons.length).toBeLessThanOrEqual(3);
  });

  it('returns unverified when there is no data and no money cue', () => {
    const result = evaluateIncomingCall(
      callInput({ phoneNumber: '0939 404 505' }),
    );

    expect(result.status).toBe('unverified');
    expect(result.badgeLabel).toBe('Chưa xác minh');
    expect(result.epistemicNote).toBe(
      'Hệ thống đưa ra mức rủi ro chứ không khẳng định chắc chắn một số là lừa đảo; khi dữ liệu chưa đủ, ứng dụng hiển thị Chưa xác minh.',
    );
    expect(result.communityReportCount).toBe(0);
    expect(result.coolingOff).toBe(false);
  });

  it('treats a saved contact as safe when no emergency money is requested', () => {
    const result = evaluateIncomingCall(
      callInput({ phoneNumber: '0905 111 222', inContacts: true }),
    );

    expect(result.status).toBe('safe');
    expect(result.badgeLabel).toBe('Số đã lưu trong danh bạ');
    expect(result.signals).toContain('saved_family_contact');
  });

  it('warns about SIM/Zalo hijack when a saved contact demands urgent money', () => {
    const result = evaluateIncomingCall(
      callInput({
        phoneNumber: '0905 111 222',
        inContacts: true,
        asksForUrgentMoney: true,
      }),
    );

    expect(result.status).toBe('caution');
    expect(result.badgeLabel).toContain('giả mạo SIM/Zalo');
    expect(result.requiresRelativeVerification).toBe(true);
    expect(result.verificationProtocol.askFamilySafeWord).toBe(true);
  });

  it('escalates unknown-number urgency plus burst calling to high risk', () => {
    const result = evaluateIncomingCall(
      callInput({
        phoneNumber: '0939 404 505',
        asksForUrgentMoney: true,
        burstCallCount: 4,
      }),
    );

    expect(result.status).toBe('high_risk');
    expect(result.signals).toContain('burst_calling_rule');
  });

  it('normalizes formatting characters', () => {
    expect(normalizePhoneNumber('0918 765 432')).toBe('0918765432');
    expect(normalizePhoneNumber('+855 88 912 3456')).toBe('+855889123456');
  });
});

describe('Feature 3B — deterministic relative verification', () => {
  it('exposes the 2-step Safe-Word protocol on the Bà Lan scenario', () => {
    const scenario = getScenarioById('ba-lan-30m');
    expect(scenario).toBeDefined();
    expect(scenario?.callInput).toBeDefined();

    const output = evaluateIncomingCall(scenario!.callInput!);

    expect(output.status).toBe('caution');
    expect(output.verificationProtocol).toEqual({
      askFamilySafeWord: true,
      hangUpAndCallSavedNumber: true,
      promptText:
        '1. Hỏi "Mã gia đình" đã đặt trước. 2. Cúp máy và gọi lại số con/cháu đã lưu trong danh bạ.',
    });
    expect(output.coolingOff).toBe(true);
    expect(scenario?.expectedCallOutput?.status).toBe('caution');
  });

  it('returns the default family safe-word', () => {
    expect(getDefaultFamilySafeWord()).toBe('Cây khế ngọt');
  });
});

describe('Feature 3A — consent-gated family alerts', () => {
  it('sends metadata only when consent is false', async () => {
    const receipt = await dispatchFamilyAlert(
      alertInput({
        consentToShareContent: false,
        messageOrCallContent:
          'Mẹ ơi con bị tai nạn, chuyển gấp 30 triệu. OTP 123456, CCCD 012345678901',
      }),
    );

    expect(receipt.consentToShareContent).toBe(false);
    expect(receipt.sharedContentIncluded).toBe(false);
    expect(receipt.deliveries).toHaveLength(3);

    for (const delivery of receipt.deliveries) {
      expect(delivery.sharedContent).toBeNull();
      expect(delivery.consentGranted).toBe(false);
      expect(delivery.formattedText).toContain(PRIVACY_WITHHELD_TEXT);
      expect(delivery.formattedText).toContain('0918 765 432');
      expect(delivery.formattedText).not.toContain('tai nạn');
      expect(delivery.formattedText).not.toContain('012345678901');
      expect(delivery.formattedText).not.toContain('123456');
      expect(delivery.deliveryMode).toBe('simulated_gateway');
    }
  });

  it('includes redacted content when consent is true', async () => {
    const receipt = await dispatchFamilyAlert(
      alertInput({
        consentToShareContent: true,
        messageOrCallContent:
          'Mẹ ơi con bị tai nạn, chuyển gấp 30 triệu. OTP 123456, CCCD 012345678901',
      }),
    );

    expect(receipt.consentToShareContent).toBe(true);
    expect(receipt.sharedContentIncluded).toBe(true);

    for (const delivery of receipt.deliveries) {
      expect(delivery.sharedContent).not.toBeNull();
      expect(delivery.sharedContent).toContain('tai nạn');
      expect(delivery.sharedContent).toContain('[ĐÃ CHE]');
      expect(delivery.sharedContent).not.toContain('012345678901');
      expect(delivery.sharedContent).not.toContain('123456');
      expect(delivery.formattedText).toContain('Nội dung được chia sẻ');
      expect(delivery.formattedText).toContain(delivery.sharedContent!);
    }
  });

  it('seeds a rich privacy-safe demo inbox message', async () => {
    const inbox = await getBotInbox();
    const seed = inbox.find((message) => message.id === 'seed-demo-ba-lan');

    expect(seed).toBeDefined();
    expect(seed?.sharedContent).toBeNull();
    expect(seed?.consentGranted).toBe(false);
    expect(seed?.formattedText).toContain(PRIVACY_WITHHELD_TEXT);
    expect(seed?.status).toBe('replied_safe');
  });
});

describe('Feature 3C — family co-decision replies', () => {
  it('marks a message as replied_scam_blocked', async () => {
    const receipt = await dispatchFamilyAlert(alertInput());
    const target = receipt.deliveries[0];

    const updated = await simulateFamilyReply(target.id, {
      action: 'confirm_scam_block',
      note: 'Đã xác nhận và chặn số',
    });

    expect(updated?.status).toBe('replied_scam_blocked');
    expect(updated?.familyReply?.action).toBe('confirm_scam_block');
    expect(updated?.familyReply?.note).toBe('Đã xác nhận và chặn số');

    const fromHistory = getBotInboxHistory().find(
      (message) => message.id === target.id,
    );
    expect(fromHistory?.status).toBe('replied_scam_blocked');
  });

  it('marks a message as replied_safe', async () => {
    const receipt = await dispatchFamilyAlert(alertInput());
    const target = receipt.deliveries[1];

    const updated = await simulateFamilyReply(target.id, {
      action: 'confirm_safe',
    });

    expect(updated?.status).toBe('replied_safe');
    expect(updated?.familyReply?.action).toBe('confirm_safe');
    expect(updated?.familyReply?.note).toContain('an toàn');
  });

  it('returns null for an unknown message id', () => {
    expect(
      recordFamilyReply('missing-message', { action: 'confirm_safe' }),
    ).toBeNull();
  });
});

describe('client fallback', () => {
  it('runs call checks in-process when no API URL is configured', async () => {
    const input = callInput({
      phoneNumber: '0918 765 432',
      asksForUrgentMoney: true,
    });

    await expect(checkIncomingCall(input)).resolves.toEqual(
      checkIncomingCallSync(input),
    );
  });

  it('exposes the full scenario catalog', () => {
    expect(SCAMKILL_SCENARIOS).toHaveLength(5);
    expect(SCAMKILL_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'ba-lan-30m',
      'fake-police-call',
      'unverified-number',
      'fake-bank-otp-sms',
      'zalo-voice-clone',
    ]);
    expect(getScenarioById('fake-bank-otp-sms')?.expectedAnalyzeOutput?.riskLevel).toBe(
      'high_risk',
    );
    expect(getScenarioById('zalo-voice-clone')?.expectedCallOutput?.status).toBe(
      'caution',
    );
  });
});
