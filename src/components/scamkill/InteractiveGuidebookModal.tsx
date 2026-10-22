import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CdnIcon, type CdnIconProps } from '@/components/scamkill/CdnIcon';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import {
  cycleSeniorFontScale,
  useSeniorFontScale,
  useTheme,
} from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { hapticSuccess, hapticTap } from '@/lib/haptics';

export interface InteractiveGuidebookModalProps {
  visible: boolean;
  onClose: () => void;
}

type PersonaId = 'seniors' | 'family' | 'judges';
type StepId = 1 | 2 | 3 | 4 | 5;
type ZoomLevel = 1 | 1.4 | 1.8;

interface Bilingual {
  en: string;
  vi: string;
}

interface GuideStep {
  id: StepId;
  circle: string;
  shortLabel: Bilingual;
  title: Bilingual;
  targetPreviewTitle: Bilingual;
  targetPreviewBadge: Bilingual;
  targetPreviewSub: Bilingual;
  targetButtonLabel: Bilingual;
  tone: 'high' | 'caution' | 'jade';
  pointerDirection: Bilingual;
  personaCopy: Record<
    PersonaId,
    {
      whatToLookAt: Bilingual;
      whatToTap: Bilingual;
      whyItWorks: Bilingual;
    }
  >;
  liveActionLabel: Bilingual;
  liveRoute: '/call_shield' | '/' | '/trusted_circle' | 'toggle_font';
}

const PERSONAS: {
  id: PersonaId;
  icon: string;
  fallback: NonNullable<CdnIconProps['fallback']>;
  label: Bilingual;
  tagline: Bilingual;
}[] = [
  {
    id: 'seniors',
    icon: 'lucide:user-round-check',
    fallback: 'person-outline',
    label: { en: 'For Older Adults', vi: 'Dành cho Bố Mẹ' },
    tagline: {
      en: 'Simple, big-letter steps. One action at a time.',
      vi: 'Chữ to, chỉ dẫn từng bước một, không dùng từ kỹ thuật.',
    },
  },
  {
    id: 'family',
    icon: 'lucide:users-round',
    fallback: 'people-outline',
    label: { en: 'For Adult Children', vi: 'Dành cho Con Cháu' },
    tagline: {
      en: 'How to set up the Family Code and receive instant alerts.',
      vi: 'Cách cài Mã gia đình và nhận tin báo qua SMS, Zalo, Telegram.',
    },
  },
  {
    id: 'judges',
    icon: 'lucide:scale',
    fallback: 'shield-checkmark-outline',
    label: { en: 'For Competition Judges', vi: 'Dành cho Giám khảo' },
    tagline: {
      en: 'Architecture, behavioral science, and PDPD 2025 privacy gates.',
      vi: 'Kiến trúc 3 lớp, khoa học hành vi và cổng quyền riêng tư PDPD 2025.',
    },
  },
];

const STEPS: GuideStep[] = [
  {
    id: 1,
    circle: '1',
    shortLabel: { en: '1. Call Shield', vi: '1. Cảnh báo Gọi' },
    title: {
      en: 'Step 1: Check the Caller Risk Before You Pick Up',
      vi: 'Bước 1: Xem nhãn rủi ro trước khi bắt máy',
    },
    targetPreviewTitle: {
      en: 'Incoming Call: 0918 765 432',
      vi: 'Cuộc gọi đến: 0918 765 432',
    },
    targetPreviewBadge: {
      en: 'USE CAUTION · NOT IN CONTACTS',
      vi: 'CẦN CẢNH GIÁC · SỐ LẠ NGOÀI DANH BẠ',
    },
    targetPreviewSub: {
      en: '"Unknown number. If this caller asks for urgent money, verify first." (Shows "Unverified" when data is insufficient.)',
      vi: '"Số lạ, không có trong danh bạ. Nếu người này xin tiền gấp, hãy xác minh." (Hiển thị "Chưa xác minh" khi chưa đủ dữ liệu.)',
    },
    targetButtonLabel: {
      en: 'CHECK & ALERT FAMILY NOW',
      vi: 'KIỂM TRA & BÁO NGƯỜI THÂN NGAY',
    },
    tone: 'caution',
    pointerDirection: {
      en: 'Look at the color badge first, then tap this button',
      vi: 'Nhìn nhãn màu phía trên, rồi bấm nút lớn này',
    },
    personaCopy: {
      seniors: {
        whatToLookAt: {
          en: 'Look at the colored banner at the top of the call screen. Red means High Risk, Amber means Use Caution, Slate means Unverified.',
          vi: 'Nhìn khung màu ngay đầu màn hình cuộc gọi: Đỏ là Nguy cơ cao, Cam là Cần cảnh giác, Xám là Chưa xác minh.',
        },
        whatToTap: {
          en: 'If the caller claims an accident or demands money, tap "CHECK & ALERT FAMILY NOW".',
          vi: 'Nếu người gọi báo tai nạn hoặc giục chuyển tiền, hãy chạm nút "KIỂM TRA & BÁO NGƯỜI THÂN NGAY".',
        },
        whyItWorks: {
          en: 'You do not have to guess if a voice is real or fake. One tap brings your family in to help.',
          vi: 'Bố/Mẹ không cần tự đoán giọng thật hay giả. Chỉ một chạm là con cháu biết để kiểm tra phụ.',
        },
      },
      family: {
        whatToLookAt: {
          en: 'ScamKill checks community reports, public advisories (nTrust/MPS), foreign prefixes (+855), and whether the number is in your parent’s contacts.',
          vi: 'ScamKill đối chiếu báo cáo cộng đồng, nguồn công khai (nTrust/Bộ CA), đầu số lạ (+855) và danh bạ của Bố/Mẹ.',
        },
        whatToTap: {
          en: 'Test the 5 pre-loaded scenarios in the "Demo scenarios" bar on the Call Shield tab.',
          vi: 'Chạm thử 5 kịch bản mẫu trong thanh "Kịch bản Demo" ở màn hình Gọi đến.',
        },
        whyItWorks: {
          en: 'Honest epistemic boundary: when a number has no reports yet, ScamKill shows "Unverified" rather than making a false claim.',
          vi: 'Giới hạn trung thực: khi chưa đủ dữ liệu, ứng dụng hiển thị "Chưa xác minh" chứ không đoán bừa.',
        },
      },
      judges: {
        whatToLookAt: {
          en: 'Feature 1 (Pre-Call Layer): deterministic reputation lookup + structural heuristics (international prefix, burst calling, contact presence).',
          vi: 'Tính năng 1 (Trước khi bắt máy): tra cứu danh tiếng tất định kết hợp quy tắc đặc điểm cuộc gọi.',
        },
        whatToTap: {
          en: 'Tap "Try Step 1 Live" below to open Call Shield and run the Mrs. Lan 30M emergency call scenario.',
          vi: 'Bấm nút "Thử Bước 1 trực tiếp" bên dưới để mở Lá chắn cuộc gọi và chạy kịch bản Bà Lan 30 triệu.',
        },
        whyItWorks: {
          en: 'Solves the Timing Gap: warns the senior before panic sets in, while transparently labeling unknown numbers as "Unverified".',
          vi: 'Lấp khoảng trống thời điểm: cảnh báo trước khi người già hoảng loạn và giữ chuẩn trung thực "Chưa xác minh".',
        },
      },
    },
    liveActionLabel: {
      en: 'Try Step 1 Live: Open Call Shield',
      vi: 'Thử Bước 1 ngay: Mở Cảnh báo Gọi đến',
    },
    liveRoute: '/call_shield',
  },
  {
    id: 2,
    circle: '2',
    shortLabel: { en: '2. 60s Pause', vi: '2. Dừng 60 giây' },
    title: {
      en: 'Step 2: Slow Down with the 60-Second Breathing Pause',
      vi: 'Bước 2: Khoảng dừng 60 giây để hạ nhịp tim',
    },
    targetPreviewTitle: {
      en: '00:59 · Breathe in 4s, out 4s',
      vi: '00:59 · Hít vào 4 giây, thở ra 4 giây',
    },
    targetPreviewBadge: {
      en: 'BRAIN SCIENCE · AMYGDALA RESET',
      vi: 'KHOA HỌC NÃO BỘ · CẮT CƠN HOẢNG LOẠN',
    },
    targetPreviewSub: {
      en: '"Hold off sending money. Breathe slowly with the green circle for 60 seconds while we verify."',
      vi: '"Khoan mở ứng dụng ngân hàng. Hãy hít thở chậm theo vòng tròn xanh trong 60 giây."',
    },
    targetButtonLabel: {
      en: 'Pause 60s & Check Family Code',
      vi: 'Dừng 60 giây & Kiểm tra Mã gia đình',
    },
    tone: 'jade',
    pointerDirection: {
      en: 'Follow the expanding breathing ring for 60 seconds',
      vi: 'Nhìn vòng tròn nhịp thở phồng-xẹp trong 60 giây',
    },
    personaCopy: {
      seniors: {
        whatToLookAt: {
          en: 'Watch the calm green circle expand for 4 seconds and contract for 4 seconds.',
          vi: 'Nhìn vòng tròn màu xanh ngọc mở rộng 4 giây rồi thu lại 4 giây.',
        },
        whatToTap: {
          en: 'Do not open your banking app while the 60-second timer is counting down.',
          vi: 'Trong lúc đồng hồ 60 giây đang đếm, Bố/Mẹ tuyệt đối chưa mở ứng dụng ngân hàng.',
        },
        whyItWorks: {
          en: 'Scammers always rush you so you panic. Taking 60 seconds to breathe brings your calm thinking back.',
          vi: 'Kẻ gian luôn giục gấp để mình hoảng. Dừng 1 phút hít thở sâu giúp trí não tỉnh táo trở lại.',
        },
      },
      family: {
        whatToLookAt: {
          en: 'Along with the 60-second pause, ScamKill sets a 48-hour high-risk transaction cooling-off reminder.',
          vi: 'Kèm theo khoảng dừng 60 giây là khóa nhắc nhở trì hoãn giao dịch rủi ro cao trong 48 giờ.',
        },
        whatToTap: {
          en: 'Practice this screen once with your parents so they recognize the breathing ring when a real scam call happens.',
          vi: 'Hãy bấm thử màn hình này cùng Bố/Mẹ một lần để ông bà quen với vòng thở an toàn.',
        },
        whyItWorks: {
          en: 'Friction Engineering (Thaler & Sunstein): inserting a 60-second pause breaks psychological manipulation.',
          vi: 'Thiết kế điểm dừng hành vi: 60 giây trì hoãn giúp phá vỡ sự thao túng tâm lý của kẻ lừa đảo.',
        },
      },
      judges: {
        whatToLookAt: {
          en: 'GSAP + React Native Animated 4s-inhale / 4s-exhale physiological box-breathing cadence + `expo-haptics` warning pulse.',
          vi: 'Vòng thở sinh học 4 giây hít - 4 giây thở điều khiển bằng GSAP + Animated kèm phản hồi rung xúc giác.',
        },
        whatToTap: {
          en: 'Trigger any high-risk call or message and tap "Slow down & Ask Family Code" to inspect the Cooling-Off Modal.',
          vi: 'Chạy kịch bản rủi ro cao và bấm "Làm chậm & Hỏi Mã gia đình" để kiểm tra màn hình Khoảng dừng.',
        },
        whyItWorks: {
          en: 'Neuroscience: acute threat triggers an amygdala hijack. Paced 4s/4s breathing activates the vagus nerve and restores prefrontal executive control.',
          vi: 'Khoa học thần kinh: hít thở nhịp 4s/4s kích hoạt dây thần kinh phế vị, khôi phục vùng vỏ não trước trán để suy xét.',
        },
      },
    },
    liveActionLabel: {
      en: 'Try Step 2 Live: Test Call & Breathing Pause',
      vi: 'Thử Bước 2 ngay: Mở Khoảng dừng 60 giây',
    },
    liveRoute: '/call_shield',
  },
  {
    id: 3,
    circle: '3',
    shortLabel: { en: '3. Message Scan', vi: '3. Quét Tin nhắn' },
    title: {
      en: 'Step 3: Analyze Suspicious Messages & Links in Plain Language',
      vi: 'Bước 3: Phân tích tin nhắn & đường dẫn lạ bằng ngôn ngữ đời thường',
    },
    targetPreviewTitle: {
      en: 'HIGH RISK · 3 Plain Reasons Found',
      vi: 'NGUY CƠ CAO · 3 lý do dễ hiểu',
    },
    targetPreviewBadge: {
      en: 'FEATURE 2 · WHEN READING A MESSAGE',
      vi: 'TÍNH NĂNG 2 · KHI ĐỌC TIN NHẮN',
    },
    targetPreviewSub: {
      en: '1. Pretends to be a bank or authority. 2. Pressures you within 24 hours. 3. Uses an unfamiliar web link. Next action: Do not tap the link. Ask your family first.',
      vi: '1. Giả danh ngân hàng/cơ quan. 2. Ép phải làm trong 24 giờ. 3. Có đường dẫn lạ. Việc cần làm: Đừng bấm liên kết. Hỏi người thân trước.',
    },
    targetButtonLabel: {
      en: 'Listen at 0.85x Slow Voice Readback',
      vi: 'Nghe đọc giọng nói chậm 0.85x',
    },
    tone: 'high',
    pointerDirection: {
      en: 'Read the 1-3 short reasons or tap Listen to hear them',
      vi: 'Đọc 1-3 lý do ngắn gọn hoặc bấm Nghe đọc thành tiếng',
    },
    personaCopy: {
      seniors: {
        whatToLookAt: {
          en: 'You only need to read 1 to 3 short bullet points and one clear instruction: "Do not tap the link. Ask your family first."',
          vi: 'Bố/Mẹ chỉ cần đọc từ 1 đến 3 gạch đầu dòng ngắn và câu hướng dẫn: "Đừng bấm liên kết. Hỏi người thân trước."',
        },
        whatToTap: {
          en: 'Paste a text message, upload a screenshot, or tap "Read aloud" to hear ScamKill read the warning slowly.',
          vi: 'Dán tin nhắn, tải ảnh chụp màn hình, hoặc bấm nút "Đọc cho tôi nghe" để nghe máy đọc chậm rãi.',
        },
        whyItWorks: {
          en: 'No confusing computer words. Everything is explained in everyday family language.',
          vi: 'Không có từ ngữ máy tính khó hiểu. Mọi lý do đều được giải thích như lời con cháu dặn ở nhà.',
        },
      },
      family: {
        whatToLookAt: {
          en: 'Supports 4 input modes (Text, Link/URL, Screenshot Image, Voice Recording) plus QR Code scanning.',
          vi: 'Hỗ trợ 4 cách kiểm tra (Văn bản, Đường link, Ảnh chụp màn hình, Giọng nói) và quét mã QR.',
        },
        whatToTap: {
          en: 'Tap "Try Step 3 Live" below to open the Messages tab and run the Fake Bank OTP SMS scenario.',
          vi: 'Bấm "Thử Bước 3 ngay" bên dưới để mở tab Tin nhắn và chạy thử tin nhắn giả mạo ngân hàng.',
        },
        whyItWorks: {
          en: 'Respects Google Play & iOS store policies: works immediately via user share/paste without requiring invasive background permissions.',
          vi: 'Tuân thủ chính sách kho ứng dụng Google Play và iOS: kiểm tra ngay khi người dùng dán hoặc chia sẻ.',
        },
      },
      judges: {
        whatToLookAt: {
          en: '5-stage Multi-Agent Pipeline: PII Redactor -> Rule Engine -> 61-Alert RAG Index -> LLM Explainer -> Miller’s Law 3-Reason Cap.',
          vi: 'Chuỗi 5 tác tử AI: Che thông tin nhạy cảm -> Tập luật -> Đối chiếu 61 cảnh báo chính thức -> Giải thích -> Giới hạn 3 lý do.',
        },
        whatToTap: {
          en: 'Test custom scam texts or use the deterministic "Fake bank message" scenario on the Messages tab.',
          vi: 'Thử nhập tin nhắn bất kỳ hoặc bấm kịch bản "Tin nhắn giả danh ngân hàng" ở tab Tin nhắn.',
        },
        whyItWorks: {
          en: 'Miller’s Law under stress: working memory shrinks to 2-3 chunks during fear, so ScamKill strictly caps output to 1-3 plain reasons.',
          vi: 'Định luật Miller khi căng thẳng: trí nhớ ngắn hạn co lại còn 2-3 ý, nên ScamKill chỉ hiển thị tối đa 3 lý do cốt lõi.',
        },
      },
    },
    liveActionLabel: {
      en: 'Try Step 3 Live: Open Message Scanner',
      vi: 'Thử Bước 3 ngay: Mở Phân tích Tin nhắn',
    },
    liveRoute: '/',
  },
  {
    id: 4,
    circle: '4',
    shortLabel: { en: '4. Family & Bots', vi: '4. Mã & Báo tin' },
    title: {
      en: 'Step 4: Ask the Family Safe-Word & Alert Relatives in 1 Tap',
      vi: 'Bước 4: Hỏi "Mã gia đình" & Báo tin qua SMS, Zalo, Telegram',
    },
    targetPreviewTitle: {
      en: 'Family Code: "Sweet starfruit (Cây khế ngọt)"',
      vi: 'Mã gia đình: "Cây khế ngọt"',
    },
    targetPreviewBadge: {
      en: 'FEATURE 3 · PRIVACY-FIRST MULTI-BOT SOS',
      vi: 'TÍNH NĂNG 3 · BÁO TIN ĐA KÊNH BẢO MẬT',
    },
    targetPreviewSub: {
      en: '(i) Ask the secret Family Code. (ii) Hang up and call back saved number. Default alert sends ONLY alert type, time, and phone number (PDPD 2025).',
      vi: '(i) Hỏi mật khẩu gia đình. (ii) Cúp máy gọi lại số lưu sẵn. Mặc định chỉ gửi loại cảnh báo, giờ và SĐT; nội dung chỉ gửi khi đồng ý.',
    },
    targetButtonLabel: {
      en: 'Send Alert to SMS + Zalo + Telegram',
      vi: 'Gửi cảnh báo qua SMS + Zalo + Telegram',
    },
    tone: 'jade',
    pointerDirection: {
      en: 'Check the Family Code, then tap to alert your children',
      vi: 'Xem Mã gia đình, rồi bấm nút này để gọi con cháu hỗ trợ',
    },
    personaCopy: {
      seniors: {
        whatToLookAt: {
          en: 'Your secret Family Code (for example "Sweet starfruit") is shown in large green letters at the top of the Family tab.',
          vi: 'Cụm từ bí mật của nhà mình (ví dụ "Cây khế ngọt") luôn hiện chữ thật to ở đầu mục Gia đình.',
        },
        whatToTap: {
          en: 'Tap "Send alert to family". Your message text stays private unless you tick the box agreeing to share it.',
          vi: 'Bấm "Gửi cảnh báo cho người thân". Nội dung tin nhắn luôn được giữ kín trừ khi Bố/Mẹ tích ô đồng ý chia sẻ.',
        },
        whyItWorks: {
          en: 'Even if AI copies your child’s voice, the scammer cannot know your family’s secret phrase.',
          vi: 'Dù AI có làm giả giọng giống hệt con cháu, kẻ gian cũng không thể biết mật khẩu riêng của nhà mình.',
        },
      },
      family: {
        whatToLookAt: {
          en: 'Inspect the Live Multi-Bot Family Inbox on the Family tab to see the exact SMS, Zalo, and Telegram cards you receive.',
          vi: 'Xem Hộp thư Bot Gia đình ngay bên dưới để thấy rõ tin nhắn SMS, Zalo, Telegram gửi tới máy con cháu.',
        },
        whatToTap: {
          en: 'Tap "Daughter: Call Mom back now (Block 30M)" inside the inbox to simulate the family intervention loop.',
          vi: 'Bấm nút "Chị Hương: Gọi lại cho Mẹ ngay (Chặn 30 triệu)" trong hộp thư để hoàn tất vòng bảo vệ.',
        },
        whyItWorks: {
          en: 'Polyvagal Co-Regulation: knowing a trusted child has been notified immediately ends isolation panic.',
          vi: 'Đồng điều hòa tâm lý: biết con cháu đã nhận tin báo giúp người cao tuổi hết cảm giác đơn độc.',
        },
      },
      judges: {
        whatToLookAt: {
          en: 'Two-part differentiator: (3A) Consent-gated SMS/Zalo/Telegram dispatch (`sharedContent: null` by default) + (3B) 2-step Safe-Word & Callback protocol.',
          vi: 'Hai cơ chế tạo khác biệt: (3A) Báo người thân có cổng đồng ý PDPD 2025 + (3B) Quy trình 2 bước chống giả giọng AI.',
        },
        whatToTap: {
          en: 'Toggle the PDPD 2025 consent checkbox off and on, dispatch an alert, and verify the payload in the Bot Inbox.',
          vi: 'Thử tắt và bật ô đồng ý chia sẻ nội dung, bấm gửi cảnh báo và đối chiếu kết quả trong Hộp thư Bot.',
        },
        whyItWorks: {
          en: 'Works 100% reliably in the MVP today without depending on restricted OS call-audio APIs or cloud eavesdropping.',
          vi: 'Triển khai được ngay trong MVP mà không phụ thuộc quyền thu âm cuộc gọi bị hạn chế trên iOS/Android.',
        },
      },
    },
    liveActionLabel: {
      en: 'Try Step 4 Live: Open Family & Bot Hub',
      vi: 'Thử Bước 4 ngay: Mở Gia đình & Hộp thư Bot',
    },
    liveRoute: '/trusted_circle',
  },
  {
    id: 5,
    circle: '5',
    shortLabel: { en: '5. Senior Zoom', vi: '5. Chữ To & Màu' },
    title: {
      en: 'Step 5: Adjust Text Size (A+), High-Contrast & Language Anytime',
      vi: 'Bước 5: Đổi Cỡ chữ (A+), Nền Vàng-Đen và Ngôn ngữ chỉ với 1 chạm',
    },
    targetPreviewTitle: {
      en: '[Guide]  [A+ Text: 130%]  [High-Contrast]  [EN/VN]',
      vi: '[Hướng dẫn]  [A+ Chữ: Rất to]  [Vàng-Đen]  [VN/EN]',
    },
    targetPreviewBadge: {
      en: 'TOP HEADER BAR · ALWAYS REACHABLE',
      vi: 'THANH ĐIỀU KHIỂN ĐẦU TRANG · LUÔN HIỂN THỊ',
    },
    targetPreviewSub: {
      en: 'Tap "A+" to enlarge all text (100% -> 115% -> 130%). Tap "Warm" to switch to High-Contrast Gold-on-Black for aging eyes.',
      vi: 'Bấm "A+" để phóng to toàn bộ chữ (100% -> 115% -> 130%). Bấm "Sáng ấm" để chuyển sang nền Vàng-Đen chống chói cho mắt lão thị.',
    },
    targetButtonLabel: {
      en: 'Tap A+ to Enlarge All App Letters Now',
      vi: 'Bấm A+ để phóng to chữ toàn ứng dụng ngay',
    },
    tone: 'jade',
    pointerDirection: {
      en: 'These 4 quick buttons stay at the top-right of every screen',
      vi: '4 nút tiện ích này luôn nằm ở góc trên bên phải mọi màn hình',
    },
    personaCopy: {
      seniors: {
        whatToLookAt: {
          en: 'Look at the top-right corner of the screen. The "A+" button and the Contrast button are always there for you.',
          vi: 'Nhìn lên góc trên bên phải màn hình. Nút "A+" phóng to chữ và nút đổi màu nền luôn nằm sẵn ở đó.',
        },
        whatToTap: {
          en: 'Tap "A+" once for Large letters, or twice for Extra-Large letters. Tap the Contrast button if bright screens hurt your eyes.',
          vi: 'Chạm "A+" để chữ to lên. Chạm nút độ tương phản nếu màn hình sáng làm Bố/Mẹ bị chói mắt.',
        },
        whyItWorks: {
          en: 'You never have to dig through complicated settings menus to make the words easy to read.',
          vi: 'Bố/Mẹ không bao giờ phải tìm kiếm sâu trong mục cài đặt mới chỉnh được cỡ chữ vừa mắt.',
        },
      },
      family: {
        whatToLookAt: {
          en: 'You can also visit the Settings tab to choose regional dialects and color-blindness palettes.',
          vi: 'Con cháu có thể vào thêm mục Cài đặt để chọn phương ngữ vùng miền và bảng màu hỗ trợ mù màu.',
        },
        whatToTap: {
          en: 'Set your parent’s preferred text size and theme right after adding ScamKill to their home screen.',
          vi: 'Hãy chỉnh sẵn cỡ chữ "To" hoặc "Rất to" ngay sau khi đặt ScamKill ra màn hình chính cho Bố/Mẹ.',
        },
        whyItWorks: {
          en: 'Uses Atkinson Hyperlegible (designed by the Braille Institute) so digits like 0/O and 1/I/l never look alike.',
          vi: 'Sử dụng phông chữ Atkinson Hyperlegible của Viện chữ nổi giúp số 0/O và 1/I không bao giờ bị nhầm.',
        },
      },
      judges: {
        whatToLookAt: {
          en: 'Reactive global font-scale multiplier (`1.0x / 1.15x / 1.30x`), 3 visual worlds (`Warm Rice Paper`, `Calm Night`, `Gold-on-Obsidian`), and instant `EN / VN` switching.',
          vi: 'Bộ nhân cỡ chữ toàn cục thời gian thực, 3 chế độ ánh sáng bảo vệ mắt lão thị và chuyển đổi Anh - Việt tức thì.',
        },
        whatToTap: {
          en: 'Tap the action button below to cycle the live font scale right now.',
          vi: 'Bấm nút hành động bên dưới để phóng to chữ trực tiếp ngay lúc này.',
        },
        whyItWorks: {
          en: 'Eliminates visual crowding and cataract glare while maintaining >= 7.5:1 WCAG AAA contrast ratios.',
          vi: 'Loại bỏ hiện tượng chữ dính nhau và chói sáng thủy tinh thể, đạt chuẩn tương phản WCAG AAA >= 7.5:1.',
        },
      },
    },
    liveActionLabel: {
      en: 'Try Step 5 Live: Enlarge App Text (A+) Now',
      vi: 'Thử Bước 5 ngay: Phóng to cỡ chữ (A+)',
    },
    liveRoute: 'toggle_font',
  },
];

const ZOOM_LEVELS: ZoomLevel[] = [1, 1.4, 1.8];

export function InteractiveGuidebookModal(
  props: InteractiveGuidebookModalProps,
): React.JSX.Element | null {
  const { visible, onClose } = props;
  const theme = useTheme();
  const router = useRouter();
  const [dialect] = useLanguageDialect();
  const [fontScale] = useSeniorFontScale();
  const isEn = dialect === 'en';
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [persona, setPersona] = React.useState<PersonaId>('seniors');
  const [activeStepId, setActiveStepId] = React.useState<StepId>(1);
  const [zoom, setZoom] = React.useState<ZoomLevel>(1);
  const [autoTour, setAutoTour] = React.useState(false);

  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const loupeScaleAnim = React.useRef(new Animated.Value(1)).current;

  const activeStep = React.useMemo(
    () => STEPS.find((s) => s.id === activeStepId) ?? STEPS[0],
    [activeStepId],
  );
  const activePersonaInfo = React.useMemo(
    () => PERSONAS.find((p) => p.id === persona) ?? PERSONAS[0],
    [persona],
  );
  const stepDetail = activeStep.personaCopy[persona];

  // Gentle pulse for the active target ring & arrow
  React.useEffect(() => {
    if (!visible) {
      setAutoTour(false);
      return;
    }
    let reduced = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((val) => {
        reduced = val;
      })
      .catch(() => {});

    if (reduced) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulseAnim]);

  // Smooth spring transition when switching steps or zoom level
  React.useEffect(() => {
    const targetVisualScale = zoom === 1 ? 1 : zoom === 1.4 ? 1.04 : 1.07;
    Animated.spring(loupeScaleAnim, {
      toValue: targetVisualScale,
      friction: 7,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [zoom, activeStepId, loupeScaleAnim]);

  // Auto-Play Guided Tour timer (steps 1 -> 2 -> 3 -> 4 -> 5 every 3.6s)
  React.useEffect(() => {
    if (!visible || !autoTour) return;
    const timer = setInterval(() => {
      setActiveStepId((prev) => (prev === 5 ? 1 : ((prev + 1) as StepId)));
    }, 3600);
    return () => clearInterval(timer);
  }, [visible, autoTour]);

  if (!visible) return null;

  const selectStep = (id: StepId) => {
    void hapticTap();
    setAutoTour(false);
    setActiveStepId(id);
  };

  const stepDelta = (delta: 1 | -1) => {
    void hapticTap();
    setAutoTour(false);
    setActiveStepId((prev) => {
      const next = prev + delta;
      if (next < 1) return 5;
      if (next > 5) return 1;
      return next as StepId;
    });
  };

  const handleLiveAction = () => {
    void hapticSuccess();
    setAutoTour(false);
    if (activeStep.liveRoute === 'toggle_font') {
      cycleSeniorFontScale();
      return;
    }
    onClose();
    router.push(activeStep.liveRoute);
  };

  const zoomTextScale = zoom === 1 ? 1 : zoom === 1.4 ? 1.18 : 1.34;
  const toneColors =
    activeStep.tone === 'high'
      ? { border: '#B91C1C', bg: '#FEF2F2', badgeBg: '#B91C1C', badgeText: '#FFFFFF' }
      : activeStep.tone === 'caution'
        ? { border: '#B45309', bg: '#FFFBEB', badgeBg: '#B45309', badgeText: '#FFFFFF' }
        : { border: '#0B5D56', bg: '#ECFDF5', badgeBg: '#0B5D56', badgeText: '#FAF6EE' };

  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            void hapticTap();
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Close guidebook backdrop' : 'Đóng nền hướng dẫn'}
        />

        <View
          style={[
            styles.dialog,
            { backgroundColor: theme.background, borderColor: theme.cardBorder },
          ]}>
          {/* Top Header */}
          <View
            style={[
              styles.header,
              { backgroundColor: theme.surfaceCard, borderBottomColor: theme.cardBorder },
            ]}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.headerBadge, { backgroundColor: theme.primaryAction }]}>
                  <CdnIcon
                    icon="lucide:book-open"
                    fallback="book-outline"
                    size={18}
                    color={theme.primaryActionText}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                    {isEn
                      ? 'Interactive Visual Guidebook'
                      : 'Cẩm nang Hướng dẫn Trực quan'}
                  </ThemedText>
                  <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    {isEn
                      ? `${activePersonaInfo.tagline.en}`
                      : `${activePersonaInfo.tagline.vi}`}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  void hapticTap();
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Close guidebook' : 'Đóng hướng dẫn'}
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
                ]}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            {/* 3 Persona Tabs */}
            <View style={styles.personaRow} accessibilityRole="tablist">
              {PERSONAS.map((item) => {
                const selected = item.id === persona;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void hapticTap();
                      setPersona(item.id);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    style={[
                      styles.personaPill,
                      {
                        backgroundColor: selected ? theme.primaryAction : theme.surfaceElevated,
                        borderColor: selected ? theme.primaryAction : theme.cardBorder,
                      },
                    ]}>
                    <CdnIcon
                      icon={item.icon}
                      fallback={item.fallback}
                      size={15}
                      color={selected ? theme.primaryActionText : theme.text}
                    />
                    <Text
                      style={[
                        styles.personaPillText,
                        { color: selected ? theme.primaryActionText : theme.text },
                      ]}>
                      {isEn ? item.label.en : item.label.vi}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Stepper Bar: Steps 1..5 + Auto-Tour + Magnifier Zoom */}
            <View
              style={[
                styles.controlBar,
                { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder },
              ]}>
              <View style={styles.stepPillsRow}>
                {STEPS.map((step) => {
                  const active = step.id === activeStepId;
                  return (
                    <Pressable
                      key={step.id}
                      onPress={() => selectStep(step.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${isEn ? 'Step' : 'Bước'} ${step.id}: ${
                        isEn ? step.shortLabel.en : step.shortLabel.vi
                      }`}
                      style={[
                        styles.stepPill,
                        {
                          backgroundColor: active ? theme.primaryAction : theme.surfaceElevated,
                          borderColor: active ? theme.primaryAction : theme.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.stepPillText,
                          { color: active ? theme.primaryActionText : theme.text },
                        ]}>
                        {isEn ? step.shortLabel.en : step.shortLabel.vi}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.toolbarRightRow}>
                {/* Auto-Play Tour Toggle */}
                <Pressable
                  onPress={() => {
                    void hapticTap();
                    setAutoTour((prev) => !prev);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: autoTour }}
                  style={[
                    styles.autoTourBtn,
                    {
                      backgroundColor: autoTour ? '#B45309' : theme.surfaceElevated,
                      borderColor: autoTour ? '#B45309' : theme.cardBorder,
                    },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CdnIcon
                      icon={autoTour ? 'lucide:pause' : 'lucide:play'}
                      fallback={autoTour ? 'pause' : 'play'}
                      size={13}
                      color={autoTour ? '#FFFFFF' : theme.primaryAction}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: autoTour ? '#FFFFFF' : theme.primaryAction,
                      }}>
                      {autoTour
                        ? isEn
                          ? 'Pause Tour'
                          : 'Dừng tự chạy'
                        : isEn
                          ? 'Auto-Play 5 Steps'
                          : 'Tự chạy 5 bước'}
                    </Text>
                  </View>
                </Pressable>

                {/* Unclipped Magnifier Loupe Zoom (1.0x / 1.4x / 1.8x) */}
                <View style={styles.zoomGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CdnIcon
                      icon="lucide:search"
                      fallback="search-outline"
                      size={13}
                      color={theme.textSecondary}
                    />
                    <Text style={[styles.zoomLabel, { color: theme.textSecondary }]}>
                      {isEn ? 'Magnifier:' : 'Kính lúp:'}
                    </Text>
                  </View>
                  {ZOOM_LEVELS.map((lvl) => {
                    const active = zoom === lvl;
                    return (
                      <Pressable
                        key={lvl}
                        onPress={() => {
                          void hapticTap();
                          setZoom(lvl);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={
                          isEn ? `Zoom ${lvl.toFixed(1)} times` : `Phóng to ${lvl.toFixed(1)} lần`
                        }
                        style={[
                          styles.zoomBtn,
                          {
                            backgroundColor: active ? theme.primaryAction : theme.surfaceElevated,
                            borderColor: active ? theme.primaryAction : theme.cardBorder,
                          },
                        ]}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '900',
                            fontFamily: Fonts.mono,
                            color: active ? theme.primaryActionText : theme.text,
                          }}>
                          {lvl.toFixed(1)}x
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Main 2-Column / Stacked Interactive Stage */}
            <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
              {/* LEFT: Unclipped Annotated Phone Screen + Pop-Out Spotlight Loupe */}
              <View
                style={[
                  styles.phoneStageCard,
                  { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder },
                ]}>
                <View style={styles.stageTopCaption}>
                  <Text style={[styles.stageCaptionText, { color: theme.textSecondary }]}>
                    {isEn
                      ? `VISUAL SPOTLIGHT MAP · STEP ${activeStep.id} OF 5`
                      : `BẢN ĐỒ ĐIỂM SÁNG TRỰC QUAN · BƯỚC ${activeStep.id} / 5`}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CdnIcon
                      icon="lucide:search"
                      fallback="search-outline"
                      size={12}
                      color={theme.primaryAction}
                    />
                    <Text style={[styles.stageZoomBadge, { color: theme.primaryAction }]}>
                      {zoom.toFixed(1)}x {isEn ? 'Loupe Active' : 'Đang phóng rõ'}
                    </Text>
                  </View>
                </View>

                {/* Miniature Phone Map where all 5 regions exist, non-active ones dim, active one pops out with circle + arrow */}
                <View style={styles.miniPhoneFrame}>
                  {STEPS.map((step) => {
                    const isFocused = step.id === activeStepId;
                    return (
                      <Pressable
                        key={step.id}
                        onPress={() => selectStep(step.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isFocused }}
                        style={[
                          styles.miniRegionRow,
                          isFocused ? styles.miniRegionFocused : styles.miniRegionDimmed,
                          isFocused && {
                            borderColor: toneColors.border,
                            backgroundColor: toneColors.bg,
                          },
                        ]}>
                        <Animated.View
                          style={[
                            styles.miniCircleBadge,
                            {
                              backgroundColor: isFocused ? toneColors.badgeBg : '#E2E8F0',
                              transform: [{ scale: isFocused ? ringScale : 1 }],
                            },
                          ]}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '900',
                              color: isFocused ? toneColors.badgeText : '#334155',
                            }}>
                            {step.circle}
                          </Text>
                        </Animated.View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.miniRegionTitle,
                              { color: isFocused ? '#0F172A' : '#475569' },
                            ]}>
                            {isEn ? step.shortLabel.en : step.shortLabel.vi}
                          </Text>
                          <Text
                            numberOfLines={isFocused ? 2 : 1}
                            style={[
                              styles.miniRegionSub,
                              { color: isFocused ? '#1E293B' : '#64748B' },
                            ]}>
                            {isEn ? step.targetPreviewTitle.en : step.targetPreviewTitle.vi}
                          </Text>
                        </View>

                        {isFocused ? (
                          <View
                            style={[
                              styles.activeArrowPill,
                              { backgroundColor: toneColors.badgeBg, flexDirection: 'row', alignItems: 'center', gap: 3 },
                            ]}>
                            <CdnIcon
                              icon="lucide:arrow-left"
                              fallback="arrow-back"
                              size={12}
                              color={toneColors.badgeText}
                            />
                            <Text style={{ fontSize: 12, fontWeight: '900', color: toneColors.badgeText }}>
                              {isEn ? 'ACTIVE' : 'ĐANG XEM'}
                            </Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                            {isEn ? 'Tap' : 'Chạm'}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* POP-OUT MAGNIFIED LOUPE LAYER (scales text cleanly without ever clipping edges!) */}
                <Animated.View
                  style={[
                    styles.loupePopoutCard,
                    {
                      borderColor: toneColors.border,
                      backgroundColor: toneColors.bg,
                      transform: [{ scale: loupeScaleAnim }],
                    },
                  ]}>
                  <View style={styles.loupeTopBar}>
                    <View style={[styles.loupeCircleBadge, { backgroundColor: toneColors.badgeBg }]}>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: toneColors.badgeText }}>
                        {activeStep.circle}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.loupeTagPill,
                        { backgroundColor: toneColors.badgeBg },
                      ]}>
                      <Text
                        style={{
                          fontSize: 11 * Math.min(zoomTextScale, 1.15),
                          fontWeight: '900',
                          color: toneColors.badgeText,
                        }}>
                        {isEn
                          ? activeStep.targetPreviewBadge.en
                          : activeStep.targetPreviewBadge.vi}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.loupeTitle,
                      { fontSize: Math.round(18 * zoomTextScale), lineHeight: Math.round(25 * zoomTextScale) },
                    ]}>
                    {isEn ? activeStep.targetPreviewTitle.en : activeStep.targetPreviewTitle.vi}
                  </Text>

                  <Text
                    style={[
                      styles.loupeBody,
                      { fontSize: Math.round(14 * zoomTextScale), lineHeight: Math.round(21 * zoomTextScale) },
                    ]}>
                    {isEn ? activeStep.targetPreviewSub.en : activeStep.targetPreviewSub.vi}
                  </Text>

                  {/* Annotated Directional Arrow Callout pointing straight to the target button */}
                  <View style={styles.arrowCalloutRow}>
                    <Text
                      style={[
                        styles.arrowCalloutText,
                        { color: toneColors.border, fontSize: Math.round(13 * zoomTextScale) },
                      ]}>
                      {isEn ? activeStep.pointerDirection.en : activeStep.pointerDirection.vi}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleLiveAction}
                    accessibilityRole="button"
                    style={[
                      styles.loupeMockButton,
                      { backgroundColor: toneColors.badgeBg },
                    ]}>
                    <Text
                      style={{
                        fontSize: Math.round(15 * zoomTextScale),
                        fontWeight: '900',
                        color: toneColors.badgeText,
                        textAlign: 'center',
                      }}>
                      {isEn ? activeStep.targetButtonLabel.en : activeStep.targetButtonLabel.vi}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>

              {/* RIGHT: Focused Step Explanation + Prev/Next + "Try Live Now" Action */}
              <View
                style={[
                  styles.explanationCard,
                  { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder },
                ]}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepBigBadge, { backgroundColor: theme.primaryAction }]}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: theme.primaryActionText }}>
                      {activeStep.circle}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.stepCounterLabel, { color: theme.primaryAction }]}>
                      {isEn
                        ? `STEP ${activeStep.id} OF 5 · ${activePersonaInfo.label.en.toUpperCase()}`
                        : `BƯỚC ${activeStep.id} / 5 · ${activePersonaInfo.label.vi.toUpperCase()}`}
                    </ThemedText>
                    <ThemedText style={[styles.stepMainTitle, { color: theme.text }]}>
                      {isEn ? activeStep.title.en : activeStep.title.vi}
                    </ThemedText>
                  </View>
                </View>

                {/* 3 Clear, Digestible Instruction Blocks */}
                <View style={styles.instructionStack}>
                  <View
                    style={[
                      styles.instructionBox,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CdnIcon
                        icon="lucide:eye"
                        fallback="eye-outline"
                        size={14}
                        color={theme.primaryAction}
                      />
                      <ThemedText style={[styles.instructionLabel, { color: theme.primaryAction }]}>
                        {isEn ? '1. What to look at on screen' : '1. Nhìn vào đâu trên màn hình'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.instructionText, { color: theme.text }]}>
                      {isEn ? stepDetail.whatToLookAt.en : stepDetail.whatToLookAt.vi}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.instructionBox,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CdnIcon
                        icon="lucide:hand-pointer"
                        fallback="hand-left-outline"
                        size={14}
                        color="#B45309"
                      />
                      <ThemedText style={[styles.instructionLabel, { color: '#B45309' }]}>
                        {isEn ? '2. What button to tap' : '2. Chạm vào nút nào'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.instructionText, { color: theme.text }]}>
                      {isEn ? stepDetail.whatToTap.en : stepDetail.whatToTap.vi}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.instructionBox,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <CdnIcon
                        icon="lucide:brain"
                        fallback="bulb-outline"
                        size={14}
                        color="#15803D"
                      />
                      <ThemedText style={[styles.instructionLabel, { color: '#15803D' }]}>
                        {isEn ? '3. Why this protects you' : '3. Vì sao bước này bảo vệ được bạn'}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.instructionText, { color: theme.text }]}>
                      {isEn ? stepDetail.whyItWorks.en : stepDetail.whatToLookAt && stepDetail.whyItWorks.vi}
                    </ThemedText>
                  </View>
                </View>

                {/* Direct "Try Step X Live" CTA */}
                <Pressable
                  onPress={handleLiveAction}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.liveActionBtn,
                    {
                      backgroundColor: theme.primaryAction,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}>
                  <Text style={[styles.liveActionBtnText, { color: theme.primaryActionText }]}>
                    {isEn ? activeStep.liveActionLabel.en : activeStep.liveActionLabel.vi}
                  </Text>
                </Pressable>

                {/* Big Unmistakable Previous / Next Step Buttons */}
                <View style={styles.prevNextRow}>
                  <Pressable
                    onPress={() => stepDelta(-1)}
                    accessibilityRole="button"
                    accessibilityLabel={isEn ? 'Previous step' : 'Bước trước'}
                    style={[
                      styles.navStepBtn,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
                    ]}>
                    <Ionicons name="arrow-back" size={18} color={theme.text} />
                    <ThemedText style={[styles.navStepBtnText, { color: theme.text }]}>
                      {isEn ? 'Previous' : 'Bước trước'}
                    </ThemedText>
                  </Pressable>

                  <ThemedText style={[styles.stepProgressIndicator, { color: theme.textSecondary }]}>
                    {activeStep.id} / 5
                  </ThemedText>

                  <Pressable
                    onPress={() => stepDelta(1)}
                    accessibilityRole="button"
                    accessibilityLabel={isEn ? 'Next step' : 'Bước tiếp theo'}
                    style={[
                      styles.navStepBtn,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.primaryAction },
                    ]}>
                    <ThemedText style={[styles.navStepBtnText, { color: theme.primaryAction }]}>
                      {isEn ? 'Next Step' : 'Bước tiếp'}
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={18} color={theme.primaryAction} />
                  </Pressable>
                </View>

                {fontScale !== 'standard' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}>
                    <CdnIcon icon="lucide:check" fallback="checkmark" size={13} color={theme.riskSafe} />
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: theme.riskSafe,
                        textAlign: 'center',
                        fontWeight: '700',
                      }}>
                      {isEn
                        ? `Senior text magnification (${fontScale === 'large' ? '115%' : '130%'}) is active!`
                        : `Đang bật chế độ chữ ${fontScale === 'large' ? 'To (115%)' : 'Rất to (130%)'}!`}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9, 14, 13, 0.68)',
  },
  dialog: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '94%',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    fontFamily: Fonts.heading,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  personaPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  controlBar: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  stepPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  toolbarRightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  autoTourBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  zoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  zoomBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  mainGrid: {
    gap: 16,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  phoneStageCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  stageTopCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageCaptionText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Fonts.mono,
  },
  stageZoomBadge: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Fonts.mono,
  },
  miniPhoneFrame: {
    borderRadius: 16,
    backgroundColor: '#F1EBDD',
    padding: 10,
    gap: 6,
  },
  miniRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  miniRegionFocused: {
    borderWidth: 2.5,
  },
  miniRegionDimmed: {
    backgroundColor: '#FFFDF9',
    borderColor: '#DFD6C3',
    opacity: 0.58,
  },
  miniCircleBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRegionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  miniRegionSub: {
    fontSize: 12,
  },
  activeArrowPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loupePopoutCard: {
    borderRadius: 18,
    borderWidth: 3,
    padding: 16,
    gap: 10,
  },
  loupeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  loupeCircleBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loupeTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loupeTitle: {
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: Fonts.heading,
  },
  loupeBody: {
    color: '#1E293B',
    fontWeight: '500',
  },
  arrowCalloutRow: {
    paddingVertical: 4,
  },
  arrowCalloutText: {
    fontWeight: '900',
  },
  loupeMockButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBigBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounterLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Fonts.mono,
  },
  stepMainTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    fontFamily: Fonts.heading,
  },
  instructionStack: {
    gap: 10,
  },
  instructionBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  instructionLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  liveActionBtn: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveActionBtnText: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  prevNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  navStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  navStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepProgressIndicator: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Fonts.mono,
  },
});

export default InteractiveGuidebookModal;
