/// <reference lib="dom" />
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
  useWindowDimensions,
  View,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { hapticTap } from '@/lib/haptics';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Palette = Record<ThemeColor, string>;

export interface InteractiveGuidebookModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Bilingual {
  en: string;
  vi: string;
}

type PersonaId = 'seniors' | 'family' | 'judges';

interface PersonaStep {
  icon: IconName;
  title: Bilingual;
  body: Bilingual;
}

interface PersonaContent {
  id: PersonaId;
  emoji: string;
  label: Bilingual;
  headline: Bilingual;
  subline: Bilingual;
  steps: PersonaStep[];
  footnote: Bilingual;
}

const PERSONAS: PersonaContent[] = [
  {
    id: 'seniors',
    emoji: '👵',
    label: { en: 'For Older Adults', vi: 'Dành cho Bố Mẹ' },
    headline: { en: 'Three rules. That is all.', vi: 'Chỉ cần nhớ ba điều.' },
    subline: {
      en: 'Big letters, slow pace, no jargon. Read one rule at a time.',
      vi: 'Chữ to, nhịp chậm, không thuật ngữ. Đọc từng điều một.',
    },
    steps: [
      {
        icon: 'hand-left-outline',
        title: { en: 'Rule 1: Stop and hold', vi: 'Điều 1: Dừng lại, giữ nguyên' },
        body: {
          en: 'Do not transfer money. Do not read an OTP. Do not photograph a card. A real bank never asks for those.',
          vi: 'Không chuyển tiền. Không đọc mã OTP. Không chụp ảnh thẻ. Ngân hàng thật không bao giờ hỏi những thứ đó.',
        },
      },
      {
        icon: 'leaf-outline',
        title: { en: 'Rule 2: Breathe 4 and 4', vi: 'Điều 2: Thở 4 và 4' },
        body: {
          en: 'Breathe in for 4 seconds, then out for 4 seconds. Press Slow down and let the call wait.',
          vi: 'Hít vào 4 giây, rồi thở ra 4 giây. Bấm Chậm lại và để cuộc gọi chờ.',
        },
      },
      {
        icon: 'key-outline',
        title: { en: 'Rule 3: Ask the family code', vi: 'Điều 3: Hỏi mã gia đình' },
        body: {
          en: 'Only trust a caller who says the family code. If they cannot say it, hang up and call your child.',
          vi: 'Chỉ tin người gọi khi họ nói đúng mã gia đình. Nếu họ không nói được, tắt máy và gọi con.',
        },
      },
    ],
    footnote: {
      en: 'Large buttons, one action per screen, plain words only.',
      vi: 'Nút to, mỗi màn hình một việc, chỉ dùng từ đơn giản.',
    },
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    label: { en: 'For Adult Children', vi: 'Dành cho Con Cháu' },
    headline: { en: 'Set up the shield in 15 minutes.', vi: 'Cài lá chắn trong 15 phút.' },
    subline: {
      en: 'Family code first, alert channels second, home screen icon third. Rehearse once a month.',
      vi: 'Mã gia đình trước, kênh cảnh báo sau, biểu tượng màn hình chính cuối. Diễn tập mỗi tháng một lần.',
    },
    steps: [
      {
        icon: 'key-outline',
        title: { en: 'Family code card', vi: 'Thẻ mã gia đình' },
        body: {
          en: 'Open Family & Bot, then the Family code card. Pick two short words, for example "ca phe sua". Never post the word online.',
          vi: 'Mở Gia đình & Bot, rồi mở thẻ Mã gia đình. Chọn hai từ ngắn, ví dụ "cà phê sữa". Tuyệt đối không đăng từ này lên mạng.',
        },
      },
      {
        icon: 'paper-plane-outline',
        title: { en: 'Link Telegram, Zalo, SMS', vi: 'Nối Telegram, Zalo, SMS' },
        body: {
          en: 'Turn on each channel your family uses. Telegram needs the bot chat ID. Tick the PDPD 2025 consent before any message content is shared.',
          vi: 'Bật từng kênh gia đình đang dùng. Telegram cần chat ID của bot. Tích đồng ý PDPD 2025 trước khi chia sẻ nội dung tin nhắn.',
        },
      },
      {
        icon: 'phone-portrait-outline',
        title: { en: 'Install on the home screen', vi: 'Cài ra màn hình chính' },
        body: {
          en: 'Android Chrome: open the menu, then Add to Home screen. iPhone Safari: tap Share, then Add to Home Screen. The icon opens full screen like a normal app.',
          vi: 'Android Chrome: mở menu, rồi Thêm vào màn hình chính. iPhone Safari: bấm Chia sẻ, rồi Thêm vào Màn hình chính. Biểu tượng mở toàn màn hình như ứng dụng thật.',
        },
      },
      {
        icon: 'mic-outline',
        title: { en: 'Rehearse monthly', vi: 'Diễn tập mỗi tháng' },
        body: {
          en: 'Run the Mrs. Lan scenario together. Confirm the alert reaches every channel in under 10 seconds.',
          vi: 'Chạy kịch bản Bà Lan cùng nhau. Kiểm tra cảnh báo tới mọi kênh trong dưới 10 giây.',
        },
      },
    ],
    footnote: {
      en: 'Consent stays visible and reversible. One switch turns every channel off.',
      vi: 'Sự đồng ý luôn hiển thị và có thể thu hồi. Một công tắc tắt được mọi kênh.',
    },
  },
  {
    id: 'judges',
    emoji: '⚖️',
    label: { en: 'For Competition Judges', vi: 'Dành cho Giám khảo' },
    headline: { en: 'Five fixtures, four loop steps, six privacy gates.', vi: 'Năm kịch bản, bốn bước vòng lặp, sáu cổng riêng tư.' },
    subline: {
      en: 'Every scenario is deterministic. Same input, same verdict, no network required.',
      vi: 'Mọi kịch bản đều cố định. Cùng đầu vào, cùng kết luận, không cần mạng.',
    },
    steps: [
      {
        icon: 'play-circle-outline',
        title: { en: 'Run the five fixtures', vi: 'Chạy năm kịch bản mẫu' },
        body: {
          en: 'Open the Scenario Drawer (Kịch bản Demo) or this guide. Each fixture comes from a fixed data file, so a replay always produces the same output.',
          vi: 'Mở Kịch bản Demo hoặc hướng dẫn này. Mỗi kịch bản lấy từ tệp dữ liệu cố định, nên chạy lại luôn cho cùng kết quả.',
        },
      },
      {
        icon: 'list-outline',
        title: { en: 'Check the verdict shape', vi: 'Kiểm tra cấu trúc kết luận' },
        body: {
          en: 'Every result shows one risk badge, at most 3 plain-language reasons, and an epistemic note. Unverified is a valid answer, not a failure.',
          vi: 'Mỗi kết quả có một nhãn rủi ro, tối đa 3 lý do dễ hiểu và một ghi chú về giới hạn dữ liệu. Chưa xác minh là câu trả lời hợp lệ, không phải lỗi.',
        },
      },
      {
        icon: 'shield-checkmark-outline',
        title: { en: 'Check the privacy gates', vi: 'Kiểm tra cổng riêng tư' },
        body: {
          en: 'With consent off, only the alert type, time, and phone number leave the device. Content fan-out requires an explicit tick.',
          vi: 'Khi chưa đồng ý, chỉ loại cảnh báo, thời điểm và số điện thoại rời thiết bị. Muốn gửi nội dung phải tích đồng ý rõ ràng.',
        },
      },
      {
        icon: 'git-compare-outline',
        title: { en: 'Check the loop mapping', vi: 'Kiểm tra ánh xạ vòng lặp' },
        body: {
          en: 'Each verdict names its next loop step. Detect leads to Slow down. Slow down leads to Verify. Verify leads to Co-decide.',
          vi: 'Mỗi kết luận chỉ ra bước tiếp theo. Phát hiện dẫn tới Chậm lại. Chậm lại dẫn tới Xác minh. Xác minh dẫn tới Cùng quyết định.',
        },
      },
    ],
    footnote: {
      en: 'PDPD 2025: consent, least data, redaction, withdrawal, no overclaim, audit trail.',
      vi: 'PDPD 2025: đồng ý, tối thiểu dữ liệu, che dữ liệu, thu hồi, không nói quá, lưu vết.',
    },
  },
];

type HotspotId = 1 | 2 | 3 | 4 | 5;

interface Hotspot {
  id: HotspotId;
  glyph: string;
  x: number;
  y: number;
  arrow: string;
  arrowX: number;
  arrowY: number;
  title: Bilingual;
  body: Bilingual;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 1,
    glyph: '①',
    x: 80,
    y: 26,
    arrow: '↙',
    arrowX: 73,
    arrowY: 31,
    title: { en: 'Verdict shield', vi: 'Khiên kết luận' },
    body: {
      en: 'One badge plus one plain sentence. It states a risk level, never a promise of 100% safety.',
      vi: 'Một nhãn và một câu dễ hiểu. Chỉ nêu mức rủi ro, không hứa an toàn 100%.',
    },
  },
  {
    id: 2,
    glyph: '②',
    x: 16,
    y: 62,
    arrow: '↘',
    arrowX: 23,
    arrowY: 66,
    title: { en: '4 second reset', vi: 'Nhịp thở 4 giây' },
    body: {
      en: 'Breathe in 4 seconds, out 4 seconds. This interrupts the amygdala hijack before any money moves.',
      vi: 'Hít vào 4 giây, thở ra 4 giây. Việc này cắt cơn hoảng trước khi tiền rời tài khoản.',
    },
  },
  {
    id: 3,
    glyph: '③',
    x: 22,
    y: 78,
    arrow: '↗',
    arrowX: 29,
    arrowY: 71,
    title: { en: 'Verify callback', vi: 'Gọi lại để xác minh' },
    body: {
      en: 'Hang up, then call the number saved in contacts. Never call back the number that just called you.',
      vi: 'Tắt máy, rồi gọi số đã lưu trong danh bạ. Không gọi lại số vừa gọi tới.',
    },
  },
  {
    id: 4,
    glyph: '④',
    x: 78,
    y: 78,
    arrow: '↖',
    arrowX: 71,
    arrowY: 71,
    title: { en: 'Co-decide with family', vi: 'Cùng gia đình quyết định' },
    body: {
      en: 'Send one alert to family. Consent decides whether the message text travels with it.',
      vi: 'Gửi một cảnh báo cho gia đình. Sự đồng ý quyết định nội dung tin nhắn có đi kèm hay không.',
    },
  },
  {
    id: 5,
    glyph: '⑤',
    x: 70,
    y: 7,
    arrow: '↗',
    arrowX: 77,
    arrowY: 11,
    title: { en: 'Guide pill', vi: 'Nút Hướng dẫn' },
    body: {
      en: 'Reopen this map from any screen with one tap.',
      vi: 'Mở lại bản đồ này từ mọi màn hình chỉ với một chạm.',
    },
  },
];

type ScenarioTone = 'high' | 'caution' | 'unverified';

interface JudgeScenario {
  id: string;
  emoji: string;
  name: Bilingual;
  badge: Bilingual;
  check: Bilingual;
  tone: ScenarioTone;
}

const JUDGE_SCENARIOS: JudgeScenario[] = [
  {
    id: 'ba-lan-30m',
    emoji: '👵',
    name: { en: 'Mrs. Lan 30M Call', vi: 'Bà Lan 30 triệu' },
    badge: { en: 'Caution', vi: 'Cần cảnh giác' },
    check: {
      en: 'Unknown number claims to be her daughter after an accident. Verify with a callback and the family code.',
      vi: 'Số lạ tự nhận là con gái gặp tai nạn. Xác minh bằng cuộc gọi lại và mã gia đình.',
    },
    tone: 'caution',
  },
  {
    id: 'fake-police-call',
    emoji: '🚨',
    name: { en: 'Fake Police +855', vi: 'Giả công an +855' },
    badge: { en: 'High risk', vi: 'Nguy cơ cao' },
    check: {
      en: 'Foreign prefix, 4 burst calls, arrest threat. Expect the high risk badge and a family alert.',
      vi: 'Đầu số nước ngoài, 4 cuộc gọi dồn dập, đe dọa bắt giữ. Kỳ vọng nhãn nguy cơ cao và cảnh báo gia đình.',
    },
    tone: 'high',
  },
  {
    id: 'unverified-number',
    emoji: '❓',
    name: { en: 'Unverified Number', vi: 'Số chưa xác minh' },
    badge: { en: 'Unverified', vi: 'Chưa xác minh' },
    check: {
      en: 'No data means unverified. The app must say so and must not guess.',
      vi: 'Không có dữ liệu thì hiện chưa xác minh. Ứng dụng phải nói rõ và không được đoán bừa.',
    },
    tone: 'unverified',
  },
  {
    id: 'fake-bank-otp-sms',
    emoji: '💬',
    name: { en: 'Bank OTP SMS', vi: 'SMS OTP ngân hàng' },
    badge: { en: 'High risk', vi: 'Nguy cơ cao' },
    check: {
      en: 'A fake domain asks for the OTP. The link must be flagged and the OTP must be redacted.',
      vi: 'Tên miền giả đòi mã OTP. Phải gắn cờ link lạ và che mã OTP.',
    },
    tone: 'high',
  },
  {
    id: 'zalo-voice-clone',
    emoji: '🎙',
    name: { en: 'Zalo Voice Clone', vi: 'Giả giọng Zalo' },
    badge: { en: 'Caution', vi: 'Cần cảnh giác' },
    check: {
      en: 'A cloned grandchild voice asks for 15M and secrecy. Secrecy plus urgency means caution.',
      vi: 'Giọng cháu ngoại bị ghép đòi 15 triệu và giữ bí mật. Bí mật cộng gấp gáp là dấu hiệu cảnh giác.',
    },
    tone: 'caution',
  },
];

const PRIVACY_GATES: Bilingual[] = [
  {
    en: 'Consent first: message content is shared with family channels only after an explicit PDPD 2025 tick.',
    vi: 'Đồng ý trước: nội dung tin nhắn chỉ được chia sẻ với kênh gia đình sau khi tích đồng ý PDPD 2025 rõ ràng.',
  },
  {
    en: 'Least data: with consent off, an alert carries only the alert type, time, and phone number.',
    vi: 'Tối thiểu dữ liệu: khi chưa đồng ý, cảnh báo chỉ mang loại cảnh báo, thời điểm và số điện thoại.',
  },
  {
    en: 'Redaction: OTP codes, ID numbers, card numbers, and bank accounts are masked before analysis.',
    vi: 'Che dữ liệu: mã OTP, số căn cước, số thẻ và số tài khoản được che trước khi phân tích.',
  },
  {
    en: 'Withdrawal: switching a channel off stops future routing immediately.',
    vi: 'Thu hồi: tắt một kênh là dừng mọi lần gửi sau đó ngay lập tức.',
  },
  {
    en: 'No overclaim: verdicts state risk, never certainty. Unverified is a first class answer.',
    vi: 'Không nói quá: kết luận nêu rủi ro, không khẳng định chắc chắn. Chưa xác minh là câu trả lời chính thức.',
  },
  {
    en: 'Audit trail: alerts keep channel, timestamp, and delivery status. Content appears only when consent is on.',
    vi: 'Lưu vết: cảnh báo giữ kênh, thời điểm và trạng thái gửi. Nội dung chỉ xuất hiện khi đã đồng ý.',
  },
];

const ZOOM_LEVELS = [1, 1.4, 1.8] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

interface GsapTweenTarget {
  s: number;
  x: number;
  y: number;
}

interface GsapVars {
  s?: number;
  x?: number;
  y?: number;
  duration?: number;
  ease?: string;
  overwrite?: boolean;
  onUpdate?: () => void;
}

interface GsapLike {
  to: (target: GsapTweenTarget, vars: GsapVars) => void;
  killTweensOf: (target: GsapTweenTarget) => void;
}

let gsapPromise: Promise<GsapLike | null> | null = null;

function loadGsap(): Promise<GsapLike | null> {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  if (!gsapPromise) {
    gsapPromise = import('gsap')
      .then((mod) => mod.gsap as unknown as GsapLike)
      .catch(() => null);
  }
  return gsapPromise;
}

function scenarioTone(tone: ScenarioTone, theme: Palette): { color: string; background: string } {
  if (tone === 'high') return { color: theme.riskHigh, background: theme.riskHighBg };
  if (tone === 'caution') return { color: theme.riskCaution, background: theme.riskCautionBg };
  return { color: theme.riskInsufficient, background: theme.riskInsufficientBg };
}

function pct(value: number): DimensionValue {
  return `${value}%` as DimensionValue;
}

interface MockScreenProps {
  theme: Palette;
  isEn: boolean;
}

function MockScreen(props: MockScreenProps): React.JSX.Element {
  const { theme, isEn } = props;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mock,
        { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder },
      ]}>
      <View style={styles.mockTopBar}>
        <View style={{ gap: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: theme.text }}>ScamKill</Text>
          <Text style={{ fontSize: 7, fontWeight: '600', color: theme.textSecondary }}>
            {isEn ? 'AI shield for families' : 'Lá chắn AI cho Gia đình'}
          </Text>
        </View>
        <View style={[styles.mockGuidePill, { backgroundColor: theme.primaryAction }]}>
          <Text style={{ fontSize: 8, fontWeight: '900', color: theme.primaryActionText }}>
            {isEn ? '📖 Guide' : '📖 Hướng dẫn'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.mockVerdict,
          { backgroundColor: theme.riskHighBg, borderColor: theme.riskHigh },
        ]}>
        <View style={styles.mockVerdictTop}>
          <Ionicons name="warning" size={12} color={theme.riskHigh} />
          <Text style={{ fontSize: 8, fontWeight: '900', color: theme.riskHigh }}>
            {isEn ? 'HIGH RISK' : 'NGUY CƠ CAO'}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '900',
            color: theme.text,
            fontFamily: Fonts.mono,
          }}>
          +855 92 111 2233
        </Text>
        <Text style={{ fontSize: 8, lineHeight: 11, color: theme.textSecondary }} numberOfLines={2}>
          {isEn
            ? 'Fake police. 4 calls in 3 minutes. Do not transfer.'
            : 'Giả danh công an. 4 cuộc gọi trong 3 phút. Không chuyển tiền.'}
        </Text>
      </View>

      <View style={{ gap: 4 }}>
        {[
          isEn ? 'Threatens an arrest warrant' : 'Đe dọa lệnh bắt tạm giam',
          isEn ? 'Foreign prefix +855' : 'Đầu số nước ngoài +855',
          isEn ? 'Asks for an urgent transfer' : 'Yêu cầu chuyển tiền gấp',
        ].map((reason) => (
          <View key={reason} style={styles.mockReason}>
            <View style={[styles.mockDot, { backgroundColor: theme.riskHigh }]} />
            <Text style={{ flex: 1, fontSize: 8, lineHeight: 11, color: theme.text }}>{reason}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.mockBreath,
          { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
        ]}>
        <Ionicons name="leaf-outline" size={13} color={theme.primaryAction} />
        <Text style={{ flex: 1, fontSize: 8, fontWeight: '800', color: theme.text }}>
          {isEn ? 'Breathe in 4s, out 4s' : 'Hít vào 4 giây, thở ra 4 giây'}
        </Text>
        <Text style={{ fontSize: 8, fontWeight: '900', color: theme.primaryAction }}>
          {isEn ? 'Slow down' : 'Chậm lại'}
        </Text>
      </View>

      <View style={styles.mockActions}>
        <View
          style={[
            styles.mockAction,
            { backgroundColor: theme.primaryAction, borderColor: theme.primaryAction },
          ]}>
          <Ionicons name="call" size={11} color={theme.primaryActionText} />
          <Text style={{ fontSize: 8, fontWeight: '900', color: theme.primaryActionText }}>
            {isEn ? 'Call saved' : 'Gọi số đã lưu'}
          </Text>
        </View>
        <View
          style={[
            styles.mockAction,
            { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction },
          ]}>
          <Ionicons name="people" size={11} color={theme.primaryAction} />
          <Text style={{ fontSize: 8, fontWeight: '900', color: theme.primaryAction }}>
            {isEn ? 'Tell family' : 'Báo gia đình'}
          </Text>
        </View>
      </View>

      <View style={[styles.mockTabBar, { borderTopColor: theme.cardBorder }]}>
        {(['call', 'chatbubbles', 'people', 'warning', 'person-circle'] as IconName[]).map(
          (icon, index) => (
            <View key={icon} style={styles.mockTab}>
              <Ionicons
                name={icon}
                size={11}
                color={index === 0 ? theme.primaryAction : theme.textSecondary}
              />
              <View
                style={[
                  styles.mockTabDot,
                  { backgroundColor: index === 0 ? theme.primaryAction : 'transparent' },
                ]}
              />
            </View>
          ),
        )}
      </View>
    </View>
  );
}

interface BlueprintProps {
  theme: Palette;
  isEn: boolean;
  persona: PersonaId;
  zoom: ZoomLevel;
  focusId: HotspotId | null;
  onSelectZoom: (level: ZoomLevel) => void;
  onSelectHotspot: (id: HotspotId) => void;
  onStep: (direction: 1 | -1) => void;
  onReset: () => void;
}

function Blueprint(props: BlueprintProps): React.JSX.Element {
  const {
    theme,
    isEn,
    persona,
    zoom,
    focusId,
    onSelectZoom,
    onSelectHotspot,
    onStep,
    onReset,
  } = props;

  const [canvas, setCanvas] = React.useState({ w: 0, h: 0 });
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;
  const panX = React.useRef(new Animated.Value(0)).current;
  const panY = React.useRef(new Animated.Value(0)).current;
  const viewState = React.useRef({ s: 1, x: 0, y: 0 });
  const tweenTarget = React.useRef<GsapTweenTarget | null>(null);

  const focusIndex = focusId === null ? -1 : HOTSPOTS.findIndex((item) => item.id === focusId);
  const canvasW = canvas.w;
  const canvasH = canvas.h;
  const stepText =
    focusId === null
      ? isEn
        ? 'Step: off'
        : 'Bước: tắt'
      : `${isEn ? 'Step' : 'Bước'} ${focusIndex + 1} / 5`;
  const bodyScale = persona === 'seniors' ? 1.08 : 1;

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => {
        // Keep motion on when the platform cannot answer.
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const scaleId = scale.addListener(({ value }) => {
      viewState.current.s = value;
    });
    const panXId = panX.addListener(({ value }) => {
      viewState.current.x = value;
    });
    const panYId = panY.addListener(({ value }) => {
      viewState.current.y = value;
    });
    return () => {
      scale.removeListener(scaleId);
      panX.removeListener(panXId);
      panY.removeListener(panYId);
    };
  }, [scale, panX, panY]);

  React.useEffect(() => {
    const targetScale = zoom;
    const hotspot = HOTSPOTS.find((item) => item.id === focusId);
    let tx = 0;
    let ty = 0;

    if (hotspot && canvasW > 0 && canvasH > 0) {
      tx = -((hotspot.x / 100) - 0.5) * canvasW * targetScale;
      ty = -((hotspot.y / 100) - 0.5) * canvasH * targetScale;
      const maxX = (canvasW * (targetScale - 1)) / 2;
      const maxY = (canvasH * (targetScale - 1)) / 2;
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    }

    const settle = () => {
      scale.setValue(targetScale);
      panX.setValue(tx);
      panY.setValue(ty);
      viewState.current = { s: targetScale, x: tx, y: ty };
    };

    if (reduceMotion) {
      settle();
      return;
    }

    if (Platform.OS === 'web') {
      let cancelled = false;
      void loadGsap().then((gsap) => {
        if (cancelled) return;
        if (!gsap) {
          settle();
          return;
        }
        const proxy = { ...viewState.current };
        if (tweenTarget.current) {
          gsap.killTweensOf(tweenTarget.current);
        }
        tweenTarget.current = proxy;
        gsap.to(proxy, {
          s: targetScale,
          x: tx,
          y: ty,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: true,
          onUpdate: () => {
            scale.setValue(proxy.s);
            panX.setValue(proxy.x);
            panY.setValue(proxy.y);
          },
        });
      });
      return () => {
        cancelled = true;
      };
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: true,
        friction: 7,
        tension: 55,
      }),
      Animated.spring(panX, {
        toValue: tx,
        useNativeDriver: true,
        friction: 7,
        tension: 55,
      }),
      Animated.spring(panY, {
        toValue: ty,
        useNativeDriver: true,
        friction: 7,
        tension: 55,
      }),
    ]).start();

    return undefined;
  }, [zoom, focusId, canvasW, canvasH, reduceMotion, scale, panX, panY]);

  return (
    <View
      style={[
        styles.blueprint,
        { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard },
      ]}>
      <View style={[styles.blueprintHead, { borderBottomColor: theme.cardBorder }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText
            style={{
              fontSize: 15,
              fontWeight: '900',
              color: theme.text,
              fontFamily: Fonts.rounded,
            }}>
            {isEn ? 'Annotated blueprint' : 'Bản đồ chú thích'}
          </ThemedText>
          <ThemedText style={{ fontSize: 11, lineHeight: 15, color: theme.textSecondary }}>
            {isEn
              ? 'Tap a numbered circle to zoom into that region.'
              : 'Chạm vào vòng tròn số để phóng to đúng vùng đó.'}
          </ThemedText>
        </View>
        <View style={[styles.zoomHudBadge, { backgroundColor: theme.backgroundSelected }]}>
          <Text
            style={{
              fontFamily: Fonts.mono,
              fontSize: 11,
              fontWeight: '900',
              color: theme.primaryAction,
            }}>
            {zoom.toFixed(1)}x
          </Text>
        </View>
      </View>

      <View style={[styles.zoomBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.zoomRow}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: theme.textSecondary }}>
            🔍 {isEn ? 'Zoom:' : 'Phóng to:'}
          </Text>
          {ZOOM_LEVELS.map((level) => {
            const active = zoom === level;
            return (
              <Pressable
                key={level}
                onPress={() => {
                  void hapticTap();
                  onSelectZoom(level);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={
                  isEn ? `Zoom ${level.toFixed(1)} times` : `Phóng to ${level.toFixed(1)} lần`
                }
                style={[
                  styles.zoomChip,
                  {
                    backgroundColor: active ? theme.primaryAction : theme.surfaceCard,
                    borderColor: active ? theme.primaryAction : theme.cardBorder,
                  },
                ]}>
                <Text
                  style={{
                    fontFamily: Fonts.mono,
                    fontSize: 12,
                    fontWeight: '900',
                    color: active ? theme.primaryActionText : theme.text,
                  }}>
                  {level.toFixed(1)}x
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stepRow}>
          <Pressable
            onPress={() => {
              void hapticTap();
              onStep(-1);
            }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Previous step' : 'Bước trước'}
            style={[styles.stepButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard }]}>
            <Ionicons name="chevron-back" size={16} color={theme.primaryAction} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: Fonts.mono,
              fontSize: 11,
              fontWeight: '800',
              color: theme.textSecondary,
            }}>
            {stepText}
          </Text>
          <Pressable
            onPress={() => {
              void hapticTap();
              onStep(1);
            }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Next step' : 'Bước tiếp theo'}
            style={[styles.stepButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard }]}>
            <Ionicons name="chevron-forward" size={16} color={theme.primaryAction} />
          </Pressable>
          <Pressable
            onPress={() => {
              void hapticTap();
              onReset();
            }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Reset zoom and focus' : 'Đặt lại phóng to và tiêu điểm'}
            style={[styles.stepButton, { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard }]}>
            <Ionicons name="scan-outline" size={16} color={theme.primaryAction} />
          </Pressable>
        </View>
      </View>

      <View
        style={[styles.canvas, { backgroundColor: theme.surfaceElevated }]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCanvas((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
        }}>
        <Animated.View
          style={[
            styles.canvasLayer,
            { transform: [{ translateX: panX }, { translateY: panY }] },
          ]}>
          <Animated.View style={[styles.canvasLayer, { transform: [{ scale }] }]}>
            <MockScreen theme={theme} isEn={isEn} />

            {HOTSPOTS.map((hotspot) => {
              const active = focusId === hotspot.id;
              return (
                <React.Fragment key={hotspot.id}>
                  <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[
                      styles.hotspotArrowWrap,
                      { left: pct(hotspot.arrowX), top: pct(hotspot.arrowY) },
                    ]}>
                    <Text style={[styles.hotspotArrow, { color: theme.primaryAction }]}>
                      {hotspot.arrow}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      void hapticTap();
                      onSelectHotspot(hotspot.id);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${isEn ? 'Callout' : 'Chú thích'} ${hotspot.id}: ${
                      isEn ? hotspot.title.en : hotspot.title.vi
                    }`}
                    style={[
                      styles.hotspot,
                      {
                        left: pct(hotspot.x),
                        top: pct(hotspot.y),
                        backgroundColor: active ? theme.primaryAction : theme.surfaceCard,
                        borderColor: theme.primaryAction,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 16,
                        lineHeight: 18,
                        fontWeight: '900',
                        color: active ? theme.primaryActionText : theme.primaryAction,
                      }}>
                      {hotspot.glyph}
                    </Text>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.calloutList}>
        {HOTSPOTS.map((hotspot) => {
          const active = focusId === hotspot.id;
          return (
            <Pressable
              key={hotspot.id}
              onPress={() => {
                void hapticTap();
                onSelectHotspot(hotspot.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.calloutRow,
                {
                  borderColor: active ? theme.primaryAction : theme.cardBorder,
                  backgroundColor: active ? theme.surfaceElevated : theme.surfaceCard,
                },
              ]}>
              <View
                style={[
                  styles.calloutBadge,
                  {
                    backgroundColor: active ? theme.primaryAction : theme.backgroundElement,
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '900',
                    color: active ? theme.primaryActionText : theme.primaryAction,
                  }}>
                  {hotspot.glyph}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText
                  style={{
                    fontSize: 13 * bodyScale,
                    fontWeight: '900',
                    color: theme.text,
                  }}>
                  {isEn ? hotspot.title.en : hotspot.title.vi}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 12 * bodyScale,
                    lineHeight: 17 * bodyScale,
                    color: theme.textSecondary,
                  }}>
                  {isEn ? hotspot.body.en : hotspot.body.vi}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function InteractiveGuidebookModal(
  props: InteractiveGuidebookModalProps,
): React.JSX.Element | null {
  const { visible, onClose } = props;
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';
  const { width } = useWindowDimensions();

  const [persona, setPersona] = React.useState<PersonaId>('seniors');
  const [zoom, setZoom] = React.useState<ZoomLevel>(1);
  const [focusId, setFocusId] = React.useState<HotspotId | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const entry = React.useRef(new Animated.Value(0)).current;

  const content = PERSONAS.find((item) => item.id === persona) ?? PERSONAS[0];
  const compact = width < 390;

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => {
        // Keep motion on when the platform cannot answer.
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!visible) {
      entry.setValue(0);
      setFocusId(null);
      setZoom(1);
      return;
    }
    if (reduceMotion) {
      entry.setValue(1);
      return;
    }
    Animated.timing(entry, {
      toValue: 1,
      duration: 240,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, reduceMotion, entry]);

  const handleClose = React.useCallback(() => {
    void hapticTap();
    onClose();
  }, [onClose]);

  const handleStep = React.useCallback(
    (direction: 1 | -1) => {
      const index = focusId === null ? -1 : HOTSPOTS.findIndex((item) => item.id === focusId);
      const base = index === -1 && direction === -1 ? 0 : index;
      const next = HOTSPOTS[(base + direction + HOTSPOTS.length) % HOTSPOTS.length];
      setFocusId(next.id);
      setZoom((currentZoom) => (currentZoom === 1 ? 1.4 : currentZoom));
    },
    [focusId],
  );

  const dialogStyle = {
    opacity: entry,
    transform: [
      {
        translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }),
      },
      {
        scale: entry.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Close guidebook' : 'Đóng hướng dẫn'}
        />

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: theme.background, borderColor: theme.cardBorder },
            dialogStyle,
          ]}>
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.cardBorder, backgroundColor: theme.surfaceCard },
            ]}>
            <View style={styles.headerRow}>
              <View style={[styles.headerIcon, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={{ fontSize: 20 }}>📖</ThemedText>
              </View>
              <View style={styles.headerText}>
                <ThemedText
                  style={{
                    fontSize: 19,
                    fontWeight: '900',
                    color: theme.text,
                    fontFamily: Fonts.rounded,
                  }}>
                  {isEn ? 'Interactive Guidebook' : 'Hướng dẫn tương tác'}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, lineHeight: 15, color: theme.textSecondary }}>
                  {isEn
                    ? 'Visual map, 3 personas, 5 annotated callouts'
                    : 'Bản đồ trực quan, 3 góc nhìn, 5 chú thích'}
                </ThemedText>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Close guidebook' : 'Đóng hướng dẫn'}
                style={[styles.closeButton, { borderColor: theme.cardBorder }]}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.personaRow}>
              {PERSONAS.map((item) => {
                const active = persona === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      void hapticTap();
                      setPersona(item.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={isEn ? item.label.en : item.label.vi}
                    style={[
                      styles.personaPill,
                      {
                        backgroundColor: active ? theme.primaryAction : theme.surfaceCard,
                        borderColor: active ? theme.primaryAction : theme.cardBorder,
                      },
                    ]}>
                    <Text style={{ fontSize: 15 }}>{item.emoji}</Text>
                    <Text
                      style={{
                        fontSize: compact ? 11 : 12,
                        fontWeight: '800',
                        color: active ? theme.primaryActionText : theme.text,
                      }}>
                      {isEn ? item.label.en : item.label.vi}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.headline}>
              <ThemedText
                style={{
                  fontSize: persona === 'seniors' ? 22 : 20,
                  lineHeight: persona === 'seniors' ? 28 : 26,
                  fontWeight: '900',
                  color: theme.text,
                  fontFamily: Fonts.rounded,
                }}>
                {isEn ? content.headline.en : content.headline.vi}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: theme.textSecondary,
                }}>
                {isEn ? content.subline.en : content.subline.vi}
              </ThemedText>
            </View>

            <Blueprint
              theme={theme}
              isEn={isEn}
              persona={persona}
              zoom={zoom}
              focusId={focusId}
              onSelectZoom={(level) => {
                setZoom(level);
                if (level > 1 && focusId === null) setFocusId(1);
                if (level === 1) setFocusId(null);
              }}
              onSelectHotspot={(id) => {
                setFocusId(id);
                setZoom(1.8);
              }}
              onStep={handleStep}
              onReset={() => {
                setFocusId(null);
                setZoom(1);
              }}
            />

            <View style={{ gap: 10 }}>
              <ThemedText
                style={{
                  fontSize: 15,
                  fontWeight: '900',
                  color: theme.text,
                  fontFamily: Fonts.rounded,
                }}>
                {persona === 'seniors'
                  ? isEn
                    ? 'The 3 rules, one at a time'
                    : 'Ba điều, đọc từng điều'
                  : persona === 'family'
                    ? isEn
                      ? 'Setup checklist'
                      : 'Danh sách cài đặt'
                    : isEn
                      ? 'Verification protocol'
                      : 'Quy trình kiểm chứng'}
              </ThemedText>

              {content.steps.map((step, index) => (
                <View
                  key={`${step.icon}-${index}`}
                  style={[
                    styles.stepCard,
                    { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard },
                  ]}>
                  <View
                    style={[
                      styles.stepIcon,
                      {
                        backgroundColor: theme.backgroundElement,
                        width: persona === 'seniors' ? 46 : 40,
                        height: persona === 'seniors' ? 46 : 40,
                      },
                    ]}>
                    <Ionicons
                      name={step.icon}
                      size={persona === 'seniors' ? 28 : 22}
                      color={theme.primaryAction}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <ThemedText
                      style={{
                        fontSize: 14 * (persona === 'seniors' ? 1.08 : 1),
                        fontWeight: '900',
                        color: theme.text,
                      }}>
                      {isEn ? step.title.en : step.title.vi}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 13 * (persona === 'seniors' ? 1.08 : 1),
                        lineHeight: 19 * (persona === 'seniors' ? 1.08 : 1),
                        color: theme.textSecondary,
                      }}>
                      {isEn ? step.body.en : step.body.vi}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {persona === 'judges' ? (
              <View style={{ gap: 10 }}>
                <ThemedText
                  style={{
                    fontSize: 15,
                    fontWeight: '900',
                    color: theme.text,
                    fontFamily: Fonts.rounded,
                  }}>
                  {isEn ? '5 deterministic scenarios' : '5 kịch bản cố định'}
                </ThemedText>
                {JUDGE_SCENARIOS.map((scenario) => {
                  const tone = scenarioTone(scenario.tone, theme);
                  return (
                    <View
                      key={scenario.id}
                      style={[
                        styles.scenarioRow,
                        { borderColor: theme.cardBorder, backgroundColor: theme.surfaceCard },
                      ]}>
                      <Text style={{ fontSize: 18 }}>{scenario.emoji}</Text>
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={styles.scenarioTop}>
                          <ThemedText
                            style={{ flex: 1, fontSize: 13, fontWeight: '900', color: theme.text }}>
                            {isEn ? scenario.name.en : scenario.name.vi}
                          </ThemedText>
                          <View
                            style={[
                              styles.scenarioBadge,
                              { backgroundColor: tone.background, borderColor: tone.color },
                            ]}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: tone.color }}>
                              {isEn ? scenario.badge.en : scenario.badge.vi}
                            </Text>
                          </View>
                        </View>
                        <ThemedText
                          style={{ fontSize: 12, lineHeight: 17, color: theme.textSecondary }}>
                          {isEn ? scenario.check.en : scenario.check.vi}
                        </ThemedText>
                        <Text
                          style={{
                            fontFamily: Fonts.mono,
                            fontSize: 10,
                            color: theme.textSecondary,
                          }}>
                          {scenario.id}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <ThemedText
                  style={{
                    fontSize: 15,
                    fontWeight: '900',
                    color: theme.text,
                    marginTop: 2,
                    fontFamily: Fonts.rounded,
                  }}>
                  {isEn ? 'PDPD 2025 privacy gates' : 'Cổng riêng tư PDPD 2025'}
                </ThemedText>
                {PRIVACY_GATES.map((gate, index) => (
                  <View key={gate.en} style={styles.gateRow}>
                    <View
                      style={[styles.gateNumber, { backgroundColor: theme.backgroundSelected }]}>
                      <Text
                        style={{
                          fontFamily: Fonts.mono,
                          fontSize: 11,
                          fontWeight: '900',
                          color: theme.primaryAction,
                        }}>
                        {index + 1}
                      </Text>
                    </View>
                    <ThemedText
                      style={{ flex: 1, fontSize: 13, lineHeight: 19, color: theme.textSecondary }}>
                      {isEn ? gate.en : gate.vi}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            <View
              style={[
                styles.footnote,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.cardBorder },
              ]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.primaryAction} />
              <ThemedText
                style={{ flex: 1, fontSize: 12, lineHeight: 17, color: theme.textSecondary }}>
                {isEn ? content.footnote.en : content.footnote.vi}
              </ThemedText>
            </View>

            <ThemedText style={{ fontSize: 11, lineHeight: 16, color: theme.textSecondary }}>
              {isEn
                ? 'Guide for the ScamKill demo. Risk verdicts are signals, not legal proof.'
                : 'Hướng dẫn cho bản demo ScamKill. Kết luận rủi ro chỉ là tín hiệu, không phải bằng chứng pháp lý.'}
            </ThemedText>

            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Close guidebook' : 'Đóng hướng dẫn'}
              style={({ pressed }) => [
                styles.doneButton,
                { backgroundColor: theme.primaryAction },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.primaryActionText} />
              <ThemedText style={{ fontSize: 15, fontWeight: '900', color: theme.primaryActionText }}>
                {isEn ? 'Got it, back to ScamKill' : 'Đã hiểu, quay lại ScamKill'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9, 14, 13, 0.66)',
  },
  dialog: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '94%',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  personaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scroll: {
    flexShrink: 1,
    minHeight: 0,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 14,
  },
  headline: {
    gap: 4,
  },
  blueprint: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  blueprintHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  zoomHudBadge: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoomBar: {
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomChip: {
    minWidth: 48,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    height: 380,
    overflow: 'hidden',
  },
  canvasLayer: {
    width: '100%',
    height: '100%',
  },
  mock: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingTop: 8,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  mockTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  mockGuidePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mockVerdict: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 3,
  },
  mockVerdictTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  mockBreath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mockActions: {
    flexDirection: 'row',
    gap: 6,
  },
  mockAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  mockTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 4,
  },
  mockTab: {
    alignItems: 'center',
    gap: 2,
  },
  mockTabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  hotspot: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotArrowWrap: {
    position: 'absolute',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotArrow: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  calloutList: {
    padding: 10,
    gap: 8,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 9,
  },
  calloutBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 11,
  },
  scenarioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scenarioBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  gateNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
