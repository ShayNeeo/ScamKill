/**
 * Warnings & Threat Intelligence Engine (WP4 Extension)
 *
 * Ingests real-time fraud alerts from official databases (Bộ Công an, Cục ATTT, SBV)
 * and enables automated dispatch to a user's Trusted Circle.
 */

import { redactPii } from '@/api/preprocess/redact';

export type ThreatSource =
  | 'Bộ Công an'
  | 'Cục An toàn thông tin'
  | 'Ngân hàng Nhà nước'
  | 'Cổng thông tin Chính phủ'
  | 'Ministry of Public Security'
  | 'Authority of Information Security'
  | 'Government Information Portal'
  | 'State Bank of Vietnam';

export const THREAT_SOURCES_VI: ThreatSource[] = [
  'Bộ Công an',
  'Cục An toàn thông tin',
  'Ngân hàng Nhà nước',
  'Cổng thông tin Chính phủ',
];

export const THREAT_SOURCES_EN: ThreatSource[] = [
  'Ministry of Public Security',
  'Authority of Information Security',
  'State Bank of Vietnam',
  'Government Information Portal',
];

export type ThreatCategory = 'Scam' | 'Fake Authority' | 'Health' | 'Banking' | 'E-Commerce';

export function formatCategory(category: ThreatCategory, lang: string = 'vi'): string {
  const isEn = lang === 'en';
  switch (category) {
    case 'Fake Authority':
      return isEn ? 'Fake Authority' : 'Giả mạo Cơ quan';
    case 'Scam':
      return isEn ? 'Scam' : 'Bẫy Lừa đảo';
    case 'Health':
      return isEn ? 'Health' : 'Y tế & Sức khỏe';
    case 'Banking':
      return isEn ? 'Banking' : 'Tài chính Ngân hàng';
    case 'E-Commerce':
      return isEn ? 'E-Commerce' : 'Mua sắm & Việc làm';
    default:
      return category;
  }
}

export interface ThreatAlert {
  id: string;
  title: string;
  category: ThreatCategory;
  risk: 'high_risk' | 'caution';
  summary: string;
  source: ThreatSource;
  sourceUrl?: string;
  publishedAt: string; // ISO date or formatted date
  verifiedBy: string;
  affectedDemographic?: string;
}

export interface CircleDispatchLog {
  id: string;
  alertId: string;
  alertTitle: string;
  recipientsCount: number;
  dispatchedAt: number;
  redactedSummary: string;
  customNote?: string;
}

export const OFFICIAL_THREAT_FEEDS: ThreatAlert[] = [
  {
    id: 'feed-1',
    title: 'Giả mạo Công an gọi điện đe dọa nợ tiền phạt',
    category: 'Fake Authority',
    risk: 'high_risk',
    summary: 'Đối tượng gọi điện tự xưng là công an, thông báo người dân liên quan đến vụ án ma túy/phạt nguội và yêu cầu chuyển tiền vào tài khoản "tạm giữ".',
    source: 'Bộ Công an',
    sourceUrl: 'https://bocongan.gov.vn',
    publishedAt: '2026-07-30',
    verifiedBy: 'Trung tâm Giám sát an toàn không gian mạng Quốc gia (NCSC)',
    affectedDemographic: 'Người cao tuổi (55+)',
  },
  {
    id: 'feed-2',
    title: 'Lừa đảo tuyển CTV "Việc nhẹ lương cao" chốt đơn',
    category: 'Scam',
    risk: 'high_risk',
    summary: 'Mời chào tham gia làm CTV chốt đơn Shopee, Lazada để nhận hoa hồng, sau đó yêu cầu nạp số tiền lớn và chiếm đoạt.',
    source: 'Cục An toàn thông tin',
    sourceUrl: 'https://khonggianmang.vn',
    publishedAt: '2026-07-28',
    verifiedBy: 'Cục An toàn thông tin - Bộ TT&TT',
    affectedDemographic: 'Người về hưu, phụ nữ nội trợ',
  },
  {
    id: 'feed-3',
    title: 'Tin giả về "Thuốc thần" trị bách bệnh cho người già',
    category: 'Health',
    risk: 'caution',
    summary: 'Các quảng cáo trên Facebook/Zalo sử dụng cắt ghép hình ảnh bác sĩ đài truyền hình để thổi phồng công dụng thực phẩm chức năng.',
    source: 'Bộ Công an',
    sourceUrl: 'https://moh.gov.vn',
    publishedAt: '2026-07-25',
    verifiedBy: 'Bộ Y tế & NCSC',
    affectedDemographic: 'Người cao tuổi',
  },
  {
    id: 'feed-4',
    title: 'Cảnh báo link lạ giả mạo VNeID đánh cắp tài khoản ngân hàng',
    category: 'Fake Authority',
    risk: 'high_risk',
    summary: 'Tin nhắn SMS yêu cầu cập nhật VNeID mức độ 2 qua một đường link lạ (.apk) để cài mã độc vào điện thoại chiếm quyền ứng dụng ngân hàng.',
    source: 'Cổng thông tin Chính phủ',
    sourceUrl: 'https://chinhphu.vn',
    publishedAt: '2026-07-24',
    verifiedBy: 'Cục Cảnh sát QLHC về TTXH',
    affectedDemographic: 'Tất cả công dân',
  },
  {
    id: 'feed-5',
    title: 'Mạo danh Ngân hàng Nhà nước thông báo nâng cấp mã QR chuyển tiền',
    category: 'Banking',
    risk: 'high_risk',
    summary: 'Gửi email/tin nhắn thông báo mã QR thanh toán của cửa hàng bị lỗi, ép quét mã QR mới để chiếm đoạt số dư tài khoản.',
    source: 'Ngân hàng Nhà nước',
    sourceUrl: 'https://sbv.gov.vn',
    publishedAt: '2026-07-22',
    verifiedBy: 'Vụ Thanh toán - NHNN',
    affectedDemographic: 'Hộ kinh doanh nhỏ & Người cao tuổi',
  },
];

export const OFFICIAL_THREAT_FEEDS_EN: ThreatAlert[] = [
  {
    id: 'feed-1',
    title: 'Fake Law Enforcement Scam Calls Demanding Traffic Fines',
    category: 'Fake Authority',
    risk: 'high_risk',
    summary: 'Scammers impersonate police officers, claiming citizens are involved in illegal cases or traffic fines, demanding funds transferred to "escrow" accounts.',
    source: 'Ministry of Public Security',
    sourceUrl: 'https://bocongan.gov.vn',
    publishedAt: '2026-07-30',
    verifiedBy: 'National Cyber Security Center (NCSC)',
    affectedDemographic: 'Senior Citizens (55+)',
  },
  {
    id: 'feed-2',
    title: 'Fake High-Paying E-Commerce Job Commission Scam',
    category: 'Scam',
    risk: 'high_risk',
    summary: 'Invitations to work as online ordering agents with high commissions, demanding large upfront deposits that scammers steal.',
    source: 'Authority of Information Security',
    sourceUrl: 'https://khonggianmang.vn',
    publishedAt: '2026-07-28',
    verifiedBy: 'Authority of Information Security',
    affectedDemographic: 'Retirees & Homemakers',
  },
  {
    id: 'feed-3',
    title: 'Fake Health Miracle Cure Advertisements Target Elderly',
    category: 'Health',
    risk: 'caution',
    summary: 'Ads on social media use deepfake videos of TV doctors to exaggerate functional food benefits.',
    source: 'Ministry of Public Security',
    sourceUrl: 'https://moh.gov.vn',
    publishedAt: '2026-07-25',
    verifiedBy: 'Ministry of Health & NCSC',
    affectedDemographic: 'Senior Citizens',
  },
  {
    id: 'feed-4',
    title: 'Phishing SMS Demanding Digital ID Updates via Fake Links',
    category: 'Fake Authority',
    risk: 'high_risk',
    summary: 'SMS messages asking users to update Digital ID level 2 via suspicious links (.apk) to install malware and hijack banking apps.',
    source: 'Government Information Portal',
    sourceUrl: 'https://chinhphu.vn',
    publishedAt: '2026-07-24',
    verifiedBy: 'Department of Administrative Police',
    affectedDemographic: 'All Citizens',
  },
  {
    id: 'feed-5',
    title: 'Malicious QR Code Payments at Merchant Counters',
    category: 'Banking',
    risk: 'high_risk',
    summary: 'Scammers paste fake QR codes over store payment codes, redirecting customer transfers to scammer accounts.',
    source: 'State Bank of Vietnam',
    sourceUrl: 'https://sbv.gov.vn',
    publishedAt: '2026-07-20',
    verifiedBy: 'SBV Payment Department',
    affectedDemographic: 'Small Business Owners & Elderly',
  },
];

let dispatchHistory: CircleDispatchLog[] = [];

/**
 * Filter threat alerts by source, category, or search query
 */
export function filterThreatAlerts(
  alerts?: ThreatAlert[],
  options?: {
    source?: ThreatSource | 'All';
    category?: ThreatCategory | 'All';
    search?: string;
    lang?: string;
  }
): ThreatAlert[] {
  const isEn = options?.lang === 'en';
  const defaultFeeds = isEn ? OFFICIAL_THREAT_FEEDS_EN : OFFICIAL_THREAT_FEEDS;
  const feedList = alerts || defaultFeeds;

  const source = options?.source || 'All';
  const category = options?.category || 'All';
  const search = (options?.search || '').toLowerCase().trim();

  return feedList.filter((item) => {
    const matchSource = source === 'All' || item.source === source;
    const matchCat = category === 'All' || item.category === category;
    const matchQuery =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.summary.toLowerCase().includes(search) ||
      item.source.toLowerCase().includes(search);

    return matchSource && matchCat && matchQuery;
  });
}

/**
 * Dispatch threat alert notification to Trusted Circle with automatic PII redaction
 */
export function dispatchAlertToCircle(
  alert: ThreatAlert,
  contactsCount: number,
  customNote?: string
): CircleDispatchLog {
  const redactedSummary = redactPii(alert.summary).text;

  const log: CircleDispatchLog = {
    id: `dispatch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    alertId: alert.id,
    alertTitle: alert.title,
    recipientsCount: contactsCount,
    dispatchedAt: Date.now(),
    redactedSummary,
    customNote: customNote ? redactPii(customNote).text : undefined,
  };

  dispatchHistory.unshift(log);
  return log;
}

export function getDispatchHistory(): CircleDispatchLog[] {
  return [...dispatchHistory];
}

export function clearDispatchHistory() {
  dispatchHistory = [];
}
