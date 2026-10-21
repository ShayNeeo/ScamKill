/**
 * Canonical demo / pitch scenarios.
 *
 * Kept deterministic so the Expo Web demo works offline and server-side
 * analysis can short-circuit known pitch fingerprints.
 */

import type { AnalyzeOutput } from '../contract';
import { evaluateIncomingCall } from './call-shield';
import type {
  CallCheckInput,
  FamilyAlertInput,
  ScamKillScenario,
} from './types';

const baLanCallInput: CallCheckInput = {
  phoneNumber: '0918 765 432',
  callerClaimedName: 'Con gái (giả giọng)',
  inContacts: false,
  burstCallCount: 1,
  spokenTranscriptPreview:
    'Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp, đừng nói với ai nhé',
  asksForUrgentMoney: true,
};

const fakePoliceCallInput: CallCheckInput = {
  phoneNumber: '+855 88 912 3456',
  callerClaimedName: 'Công an / Viện kiểm sát',
  inContacts: false,
  burstCallCount: 4,
  spokenTranscriptPreview:
    'Chúng tôi là Công an, tài khoản của bà liên quan vụ án. Yêu cầu chuyển tiền ngay để tránh lệnh bắt tạm giam.',
  asksForUrgentMoney: true,
};

const unverifiedCallInput: CallCheckInput = {
  phoneNumber: '0939 404 505',
  inContacts: false,
  burstCallCount: 1,
  asksForUrgentMoney: false,
};

const fakeBankCallInput: CallCheckInput = {
  phoneNumber: '1900 888 999',
  callerClaimedName: 'Ngân hàng (giả danh)',
  inContacts: false,
  burstCallCount: 1,
  spokenTranscriptPreview:
    'Tài khoản của quý khách sẽ bị khóa trong 24 giờ. Truy cập http://vcb-xacminh-otp.xyz để nhập mã OTP.',
  asksForUrgentMoney: false,
};

const zaloCloneCallInput: CallCheckInput = {
  phoneNumber: '0977 123 456',
  callerClaimedName: 'Cháu ngoại (giả giọng)',
  inContacts: false,
  burstCallCount: 1,
  spokenTranscriptPreview:
    'Bà ơi cháu bị tai nạn, cần 15 triệu đặt cọc viện phí gấp, bà đừng nói với ai.',
  asksForUrgentMoney: true,
};

const baLanAlertInput: FamilyAlertInput = {
  seniorName: 'Bà Lan',
  alertType: 'relative_impersonation',
  relatedPhoneNumber: '0918 765 432',
  timestamp: '2026-10-22T08:30:00.000Z',
  channels: ['sms', 'zalo', 'telegram'],
  consentToShareContent: false,
  recipientNames: ['Chị Hương (Con gái)'],
};

const fakePoliceAlertInput: FamilyAlertInput = {
  seniorName: 'Bà Lan',
  alertType: 'high_risk_call',
  relatedPhoneNumber: '+855 88 912 3456',
  channels: ['sms', 'zalo', 'telegram'],
  consentToShareContent: false,
  recipientNames: ['Chị Hương (Con gái)'],
};

const baLanAnalyzeOutput: AnalyzeOutput = {
  riskLevel: 'high_risk',
  redFlags: [
    {
      signal: 'urgency',
      explanation: 'Tạo cảm giác tai nạn khẩn cấp và đòi chuyển tiền ngay.',
    },
    {
      signal: 'upfront_payment',
      explanation: 'Yêu cầu chuyển 30 triệu trước khi xác minh danh tính.',
    },
  ],
  verificationSteps: [
    'Hỏi "Mã gia đình" đã đặt trước.',
    'Cúp máy và gọi lại số con gái đã lưu trong danh bạ.',
    'Không chuyển tiền cho đến khi xác minh trực tiếp.',
  ],
  nextAction:
    'Cúp máy, hỏi Mã gia đình và gọi lại số con gái đã lưu. Không chuyển 30 triệu.',
  lessonCard: {
    title: 'Giả giọng người thân báo tai nạn',
    points: [
      'Tai nạn khẩn cấp là chiêu tạo hoảng loạn để giục chuyển tiền.',
      'Giọng nói có thể bị AI sao chép, không đủ để xác minh danh tính.',
      'Mã gia đình + gọi lại số đã lưu là bước kiểm tra bắt buộc.',
    ],
    quiz: {
      question: 'Người thân gọi báo tai nạn và đòi chuyển tiền gấp, bạn nên làm gì?',
      answer: 'Hỏi Mã gia đình, cúp máy và gọi lại số đã lưu.',
    },
  },
  disclaimer:
    'ScamKill đưa ra mức rủi ro dựa trên dấu hiệu, không khẳng định tuyệt đối.',
};

const fakePoliceAnalyzeOutput: AnalyzeOutput = {
  riskLevel: 'high_risk',
  redFlags: [
    {
      signal: 'authority_impersonation',
      explanation: 'Tự xưng Công an / Viện kiểm sát để đe dọa.',
    },
    {
      signal: 'urgency',
      explanation: 'Đe dọa lệnh bắt tạm giam và yêu cầu xử lý ngay.',
    },
    {
      signal: 'upfront_payment',
      explanation: 'Yêu cầu chuyển tiền để chứng minh tài khoản.',
    },
  ],
  verificationSteps: [
    'Cúp máy, không trao đổi thêm với số lạ.',
    'Gọi lại cơ quan chức năng qua số chính thức đã công bố.',
    'Báo người thân và không chuyển tiền, không đọc OTP.',
  ],
  nextAction:
    'Cúp máy. Không chuyển tiền. Gọi cơ quan chức năng qua số chính thức và báo người thân.',
  lessonCard: {
    title: 'Cơ quan chức năng không yêu cầu chuyển tiền qua điện thoại',
    points: [
      'Không có lệnh bắt tạm giam nào được xử lý qua cuộc gọi điện thoại.',
      'Số đầu số quốc tế +855 không phải số làm việc của Công an Việt Nam.',
      'Hãy cúp máy và gọi lại qua tổng đài chính thức.',
    ],
    quiz: {
      question: 'Người tự xưng Công an gọi điện yêu cầu chuyển tiền, bạn nên làm gì?',
      answer: 'Cúp máy và gọi lại cơ quan chức năng qua số chính thức.',
    },
  },
  disclaimer:
    'ScamKill đưa ra mức rủi ro dựa trên dấu hiệu, không khẳng định tuyệt đối.',
};

const zaloCloneAnalyzeOutput: AnalyzeOutput = {
  riskLevel: 'high_risk',
  redFlags: [
    {
      signal: 'urgency',
      explanation: 'Dùng tình huống tai nạn và viện phí để giục chuyển tiền.',
    },
    {
      signal: 'upfront_payment',
      explanation: 'Yêu cầu đặt cọc 15 triệu trước khi xác minh.',
    },
  ],
  verificationSteps: [
    'Hỏi "Mã gia đình" đã đặt trước.',
    'Cúp máy và gọi lại số cháu ngoại đã lưu.',
    'Không chuyển tiền dựa trên video hoặc ghi âm.',
  ],
  nextAction:
    'Cúp máy, hỏi Mã gia đình và gọi lại số cháu ngoại đã lưu. Không chuyển 15 triệu.',
  lessonCard: {
    title: 'Video / ghi âm Zalo cũng có thể bị giả giọng',
    points: [
      'AI có thể sao chép giọng nói từ vài giây ghi âm.',
      'Yêu cầu giữ bí mật là dấu hiệu cô lập người cao tuổi.',
      'Mã gia đình và gọi lại số đã lưu là bước xác minh độc lập.',
    ],
    quiz: {
      question: 'Cháu ngoại nhắn Zalo mượn tiền viện phí gấp, bạn nên làm gì?',
      answer: 'Hỏi Mã gia đình và gọi lại số cháu đã lưu.',
    },
  },
  disclaimer:
    'ScamKill đưa ra mức rủi ro dựa trên dấu hiệu, không khẳng định tuyệt đối.',
};

const fakeBankAnalyzeOutput: AnalyzeOutput = {
  riskLevel: 'high_risk',
  redFlags: [
    {
      signal: 'authority_impersonation',
      explanation: 'Tự xưng là ngân hàng để tạo áp lực.',
    },
    {
      signal: 'urgency',
      explanation: 'Đe dọa khóa tài khoản trong 24 giờ.',
    },
    {
      signal: 'suspicious_url',
      explanation:
        'Đường dẫn vcb-xacminh-otp.xyz không phải tên miền chính thức của ngân hàng.',
    },
    {
      signal: 'personal_data_request',
      explanation: 'Yêu cầu nhập mã OTP trên trang lạ.',
    },
  ],
  verificationSteps: [
    'Không bấm vào đường dẫn trong tin nhắn.',
    'Mở ứng dụng ngân hàng chính thức hoặc gọi hotline in trên thẻ.',
    'Không đọc mã OTP cho bất kỳ ai.',
  ],
  nextAction:
    'Không bấm liên kết và không nhập OTP. Gọi ngân hàng bằng số chính thức để kiểm tra.',
  lessonCard: {
    title: 'Ngân hàng không bao giờ hỏi OTP qua link lạ',
    points: [
      'OTP chỉ nhập trong ứng dụng ngân hàng chính thức.',
      'Tin nhắn đe dọa khóa tài khoản trong 24 giờ là chiêu tạo áp lực.',
      'Tên miền .xyz không phải trang ngân hàng.',
    ],
    quiz: {
      question: 'Khi nhận tin nhắn đòi nhập OTP qua link lạ, bạn nên làm gì?',
      answer: 'Không bấm link, không nhập OTP, gọi hotline ngân hàng chính thức.',
    },
  },
  disclaimer:
    'ScamKill đưa ra mức rủi ro dựa trên dấu hiệu, không khẳng định tuyệt đối.',
};

export const SCAMKILL_SCENARIOS: ScamKillScenario[] = [
  {
    id: 'ba-lan-30m',
    title: 'Kịch bản Bà Lan — 30 triệu gấp',
    subtitle:
      'Số lạ giả giọng con gái: "Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp".',
    layer: 3,
    badge: 'Cần cảnh giác',
    callInput: baLanCallInput,
    expectedCallOutput: evaluateIncomingCall(baLanCallInput),
    expectedAnalyzeOutput: baLanAnalyzeOutput,
    autoTriggerAlertInput: baLanAlertInput,
  },
  {
    id: 'fake-police-call',
    title: 'Giả danh Công an / Viện kiểm sát',
    subtitle:
      'Đầu số +855 gọi 4 lần, đe dọa khóa tài khoản và lệnh bắt tạm giam.',
    layer: 1,
    badge: 'Nguy cơ cao',
    callInput: fakePoliceCallInput,
    expectedCallOutput: evaluateIncomingCall(fakePoliceCallInput),
    expectedAnalyzeOutput: fakePoliceAnalyzeOutput,
    autoTriggerAlertInput: fakePoliceAlertInput,
  },
  {
    id: 'unverified-number',
    title: 'Số lạ chưa có dữ liệu',
    subtitle:
      'Minh họa giới hạn trung thực: hệ thống hiển thị "Chưa xác minh" thay vì đoán bừa.',
    layer: 1,
    badge: 'Chưa xác minh',
    callInput: unverifiedCallInput,
    expectedCallOutput: evaluateIncomingCall(unverifiedCallInput),
  },
  {
    id: 'fake-bank-otp-sms',
    title: 'Tin nhắn giả danh ngân hàng',
    subtitle:
      'Đe dọa khóa tài khoản trong 24 giờ và dụ nhập OTP vào tên miền lạ.',
    layer: 2,
    badge: 'Nguy cơ cao',
    callInput: fakeBankCallInput,
    messageText:
      'TK VCB của quý khách sẽ bị khóa trong 24 giờ. Truy cập http://vcb-xacminh-otp.xyz để nhập mã OTP',
    expectedCallOutput: evaluateIncomingCall(fakeBankCallInput),
    expectedAnalyzeOutput: fakeBankAnalyzeOutput,
    autoTriggerAlertInput: {
      seniorName: 'Bà Lan',
      alertType: 'suspicious_message',
      relatedPhoneNumber: '1900 888 999',
      channels: ['sms', 'zalo', 'telegram'],
      consentToShareContent: false,
      recipientNames: ['Chị Hương (Con gái)'],
    },
  },
  {
    id: 'zalo-voice-clone',
    title: 'Zalo giả giọng cháu ngoại',
    subtitle:
      'Video / ghi âm Zalo mượn 15 triệu đặt cọc viện phí, yêu cầu giữ bí mật.',
    layer: 3,
    badge: 'Cần cảnh giác',
    callInput: zaloCloneCallInput,
    expectedCallOutput: evaluateIncomingCall(zaloCloneCallInput),
    expectedAnalyzeOutput: zaloCloneAnalyzeOutput,
    autoTriggerAlertInput: {
      seniorName: 'Bà Lan',
      alertType: 'relative_impersonation',
      relatedPhoneNumber: '0977 123 456',
      channels: ['sms', 'zalo', 'telegram'],
      consentToShareContent: false,
      recipientNames: ['Chị Hương (Con gái)'],
    },
  },
];

export function getScenarioById(
  id: ScamKillScenario['id'],
): ScamKillScenario | undefined {
  return SCAMKILL_SCENARIOS.find((scenario) => scenario.id === id);
}
