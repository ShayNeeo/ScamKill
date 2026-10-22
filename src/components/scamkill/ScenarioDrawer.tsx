import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCAMKILL_SCENARIOS } from '@/api/scamkill/client';
import type { ScamKillScenario } from '@/api/scamkill/types';
import { Fonts } from '@/constants/theme';
import { useLanguageDialect } from '@/i18n/regional';

export interface ScenarioDrawerProps {
  onSelectScenario: (scenario: ScamKillScenario) => void;
}

export interface ScenarioCopy {
  title: string;
  subtitle: string;
  callerClaim?: string;
  transcript?: string;
  emoji: string;
}

const SCENARIO_COPY: Record<ScamKillScenario['id'], { en: ScenarioCopy; vi: ScenarioCopy }> = {
  'ba-lan-30m': {
    en: {
      title: 'Grandma Lan: 30 million urgently',
      subtitle: 'Unknown number mimics her daughter: "Mom, I had an accident, send 30 million now."',
      callerClaim: 'Daughter (voice clone)',
      transcript: 'Mom, I had an accident, please send 30 million right away, do not tell anyone.',
      emoji: '👵',
    },
    vi: {
      title: 'Kịch bản Bà Lan: 30 triệu gấp',
      subtitle: 'Số lạ giả giọng con gái: "Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp".',
      callerClaim: 'Con gái (giả giọng)',
      transcript: 'Mẹ ơi con bị tai nạn, chuyển giúp con 30 triệu gấp, đừng nói với ai nhé',
      emoji: '👵',
    },
  },
  'fake-police-call': {
    en: {
      title: 'Fake police / prosecutor',
      subtitle: 'A +855 number calls 4 times, threatens to freeze the account and issue an arrest order.',
      callerClaim: 'Police / Prosecutor',
      transcript: 'We are the police. Your account is linked to a case. Transfer money now to avoid arrest.',
      emoji: '🚨',
    },
    vi: {
      title: 'Giả danh Công an / Viện kiểm sát',
      subtitle: 'Đầu số +855 gọi 4 lần, đe dọa khóa tài khoản và lệnh bắt tạm giam.',
      callerClaim: 'Công an / Viện kiểm sát',
      transcript: 'Chúng tôi là Công an, tài khoản của bà liên quan vụ án. Yêu cầu chuyển tiền ngay để tránh lệnh bắt tạm giam.',
      emoji: '🚨',
    },
  },
  'unverified-number': {
    en: {
      title: 'Unknown number, no data',
      subtitle: 'Honest limit: the app shows "Unverified" instead of guessing.',
      emoji: '❓',
    },
    vi: {
      title: 'Số lạ chưa có dữ liệu',
      subtitle: 'Minh hoạ giới hạn trung thực: hệ thống hiển thị "Chưa xác minh" thay vì đoán bừa.',
      emoji: '❓',
    },
  },
  'fake-bank-otp-sms': {
    en: {
      title: 'Fake bank message',
      subtitle: 'Threatens to freeze the account in 24 hours and lures you into typing an OTP on a fake domain.',
      callerClaim: 'Bank (fake)',
      transcript: 'Your account will be locked in 24 hours. Visit http://vcb-xacminh-otp.xyz to enter your OTP.',
      emoji: '💬',
    },
    vi: {
      title: 'Tin nhắn giả danh ngân hàng',
      subtitle: 'Đe dọa khóa tài khoản trong 24 giờ và dụ nhập OTP vào tên miền lạ.',
      callerClaim: 'Ngân hàng (giả danh)',
      transcript: 'Tài khoản của quý khách sẽ bị khóa trong 24 giờ. Truy cập http://vcb-xacminh-otp.xyz để nhập mã OTP.',
      emoji: '💬',
    },
  },
  'zalo-voice-clone': {
    en: {
      title: 'Zalo voice clone of grandchild',
      subtitle: 'A Zalo video or voice note asks for 15 million for a hospital deposit and demands secrecy.',
      callerClaim: 'Grandchild (voice clone)',
      transcript: 'Grandma, I had an accident, I need 15 million for a hospital deposit, please do not tell anyone.',
      emoji: '🎙',
    },
    vi: {
      title: 'Zalo giả giọng cháu ngoại',
      subtitle: 'Video / ghi âm Zalo mượn 15 triệu đặt cọc viện phí, yêu cầu giữ bí mật.',
      callerClaim: 'Cháu ngoại (giả giọng)',
      transcript: 'Bà ơi cháu bị tai nạn, cần 15 triệu đặt cọc viện phí gấp, bà đừng nói với ai.',
      emoji: '🎙',
    },
  },
};

/** Language-aware scenario copy shared by the drawer and the incoming-call modal. */
export function getScenarioCopy(scenario: ScamKillScenario, isEn: boolean): ScenarioCopy {
  return SCENARIO_COPY[scenario.id][isEn ? 'en' : 'vi'];
}

export function ScenarioDrawer(props: ScenarioDrawerProps): React.JSX.Element {
  const { onSelectScenario } = props;
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';
  const [expanded, setExpanded] = React.useState(true);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={isEn ? 'Demo scenarios, tap to open or collapse' : 'Kịch bản Demo, chạm để mở hoặc thu gọn'}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {isEn ? '🎬 Demo scenarios (tap to run)' : '🎬 Kịch bản Demo (Chạm để chạy thử)'}
          </Text>
          <Text style={styles.headerSub}>
            {isEn
              ? 'Live demo of 3 features for the pitch, not real user data.'
              : 'Minh hoạ trực tiếp 3 tính năng cho buổi pitch, không phải dữ liệu thật.'}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {SCAMKILL_SCENARIOS.map((scenario) => {
            const copy = getScenarioCopy(scenario, isEn);
            return (
              <Pressable
                key={scenario.id}
                onPress={() => onSelectScenario(scenario)}
                accessibilityRole="button"
                accessibilityLabel={isEn ? `Run demo: ${copy.title}` : `Chạy thử: ${copy.title}`}
                style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
                <View style={styles.pillTopRow}>
                  <Text style={styles.pillLabel}>
                    {copy.emoji} {copy.title}
                  </Text>
                  <View style={styles.layerBadge}>
                    <Text style={styles.layerBadgeText}>
                      {isEn ? `Layer ${scenario.layer}` : `Lớp ${scenario.layer}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pillSub}>{copy.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Fonts.heading,
  },
  headerSub: {
    fontSize: 16,
    lineHeight: 22,
    color: '#CBD5E1',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  pill: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    justifyContent: 'center',
  },
  pillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillLabel: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    color: '#0F172A',
  },
  layerBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  layerBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075985',
  },
  pillSub: {
    fontSize: 16,
    lineHeight: 22,
    color: '#475569',
  },
  pressed: {
    opacity: 0.75,
  },
});
