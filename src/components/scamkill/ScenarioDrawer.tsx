import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCAMKILL_SCENARIOS } from '@/api/scamkill/client';
import type { ScamKillScenario } from '@/api/scamkill/types';

export interface ScenarioDrawerProps {
  onSelectScenario: (scenario: ScamKillScenario) => void;
}

const SCENARIO_LABELS: Record<ScamKillScenario['id'], string> = {
  'ba-lan-30m': '👵 Kịch bản Bà Lan (Con gái xin 30tr)',
  'fake-police-call': '🚨 Giả danh Công an (+855)',
  'unverified-number': '❓ Số lạ Chưa xác minh',
  'fake-bank-otp-sms': '💬 Tin nhắn giả Ngân hàng / OTP',
  'zalo-voice-clone': '🎙 Giả giọng AI qua Zalo',
};

export function ScenarioDrawer(props: ScenarioDrawerProps): React.JSX.Element {
  const { onSelectScenario } = props;
  const [expanded, setExpanded] = React.useState(true);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Kịch bản Demo, chạm để mở hoặc thu gọn"
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>🎬 Kịch bản Demo (Chạm để chạy thử)</Text>
          <Text style={styles.headerSub}>
            Minh hoạ trực tiếp 3 tính năng — dùng cho buổi pitch, không phải dữ liệu thật.
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.list}>
          {SCAMKILL_SCENARIOS.map((scenario) => (
            <Pressable
              key={scenario.id}
              onPress={() => onSelectScenario(scenario)}
              accessibilityRole="button"
              accessibilityLabel={`Chạy thử: ${SCENARIO_LABELS[scenario.id] || scenario.title}`}
              style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
              <View style={styles.pillTopRow}>
                <Text style={styles.pillLabel}>
                  {SCENARIO_LABELS[scenario.id] || `${scenario.badge} ${scenario.title}`}
                </Text>
                <View style={styles.layerBadge}>
                  <Text style={styles.layerBadgeText}>Lớp {scenario.layer}</Text>
                </View>
              </View>
              <Text style={styles.pillSub}>{scenario.subtitle}</Text>
            </Pressable>
          ))}
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
