import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  cycleSeniorAppearance,
  cycleSeniorFontScale,
  useSeniorAppearance,
  useSeniorFontScale,
  useTheme,
} from '@/hooks/use-theme';
import type { SeniorAppearanceOverride, SeniorFontScale } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { ThemedText } from '@/components/themed-text';
import { t } from '@/i18n';

type IconName = ComponentProps<typeof Ionicons>['name'];

const FONT_SCALE_META: Record<SeniorFontScale, { vi: string; en: string }> = {
  standard: { vi: 'Chữ: Chuẩn', en: 'Text: 100%' },
  large: { vi: 'Chữ: To', en: 'Text: 115%' },
  extraLarge: { vi: 'Chữ: Rất to', en: 'Text: 130%' },
};

const APPEARANCE_META: Record<
  Exclude<SeniorAppearanceOverride, 'system'>,
  { icon: IconName; vi: string; en: string }
> = {
  light: { icon: 'sunny-outline', vi: 'Sáng ấm', en: 'Warm' },
  dark: { icon: 'moon-outline', vi: 'Tối dịu', en: 'Night' },
  highContrastSenior: { icon: 'contrast-outline', vi: 'Vàng-Đen', en: 'Hi-Contrast' },
};

function SeniorQuickControls() {
  const theme = useTheme();
  const [dialect, setDialect] = useLanguageDialect();
  const [fontScale] = useSeniorFontScale();
  const [appearance] = useSeniorAppearance();
  const isEn = dialect === 'en';
  const fontMeta = FONT_SCALE_META[fontScale];
  const appMeta = APPEARANCE_META[appearance === 'system' ? 'light' : appearance];

  const chipStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.cardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
  };
  const chipText = { fontSize: 11, fontWeight: '800' as const, color: theme.primaryAction };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 10 }}>
      <Pressable
        style={chipStyle}
        onPress={cycleSeniorFontScale}
        accessibilityRole="button"
        accessibilityLabel={
          isEn
            ? `Font size. Current: ${fontMeta.en}. Tap to enlarge text.`
            : `Cỡ chữ. Hiện tại: ${fontMeta.vi}. Bấm để phóng to chữ.`
        }>
        <ThemedText style={chipText}>A+</ThemedText>
        <ThemedText style={chipText}>{isEn ? fontMeta.en : fontMeta.vi}</ThemedText>
      </Pressable>

      <Pressable
        style={chipStyle}
        onPress={cycleSeniorAppearance}
        accessibilityRole="button"
        accessibilityLabel={
          isEn
            ? `Display contrast. Current: ${appMeta.en}. Tap to change.`
            : `Độ tương phản. Hiện tại: ${appMeta.vi}. Bấm để đổi.`
        }>
        <Ionicons name={appMeta.icon} size={14} color={theme.primaryAction} />
        <ThemedText style={chipText}>{isEn ? appMeta.en : appMeta.vi}</ThemedText>
      </Pressable>

      <Pressable
        style={chipStyle}
        onPress={() => setDialect(isEn ? 'vi-north' : 'en')}
        accessibilityRole="button"
        accessibilityLabel={isEn ? 'Switch language. Current: English' : 'Đổi ngôn ngữ. Hiện tại: Tiếng Việt'}>
        <Ionicons name="globe-outline" size={14} color={theme.primaryAction} />
        <ThemedText style={chipText}>{isEn ? 'EN' : 'VN'}</ThemedText>
      </Pressable>
    </View>
  );
}

function ScamKillHeader() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  return (
    <View accessibilityRole="header">
      <ThemedText style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>ScamKill</ThemedText>
      <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
        {isEn ? 'AI shield for families' : 'Lá chắn AI cho Gia đình'}
      </ThemedText>
    </View>
  );
}

export default function TabLayout() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.primaryAction,
      tabBarInactiveTintColor: theme.textSecondary,
      tabBarLabelStyle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
      tabBarItemStyle: { paddingHorizontal: 0 },
      tabBarStyle: {
        height: 68,
        paddingBottom: 8,
        paddingTop: 6,
        backgroundColor: theme.surfaceCard,
        borderTopColor: theme.cardBorder,
        borderTopWidth: 1.5,
      },
      headerStyle: {
        backgroundColor: theme.surfaceCard,
        borderBottomColor: theme.cardBorder,
        borderBottomWidth: 1,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        color: theme.text,
        fontSize: 17,
        fontWeight: '700',
      },
      headerTitle: () => <ScamKillHeader />,
      headerTintColor: theme.text,
      headerRight: () => <SeniorQuickControls />,
    }}>
      <Tabs.Screen
        name="call_shield"
        options={{
          title: isEn ? 'Call Shield' : 'Lá chắn cuộc gọi',
          tabBarLabel: t('tab.callShield'),
          tabBarIcon: ({ color }) => <Ionicons name="call" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: isEn ? 'Message Check' : 'Phân tích tin nhắn',
          tabBarLabel: t('tab.companion'),
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trusted_circle"
        options={{
          title: isEn ? 'Family & Bot' : 'Gia đình & Bot',
          tabBarLabel: t('tab.circle'),
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: isEn ? 'Scam Alerts' : 'Cảnh báo Bộ CA',
          tabBarLabel: t('tab.alerts'),
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: isEn ? 'Safety Skills' : 'Kỹ năng An toàn',
          tabBarLabel: t('tab.learning'),
          tabBarIcon: ({ color }) => <Ionicons name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isEn ? 'Settings' : 'Cài đặt',
          tabBarLabel: t('tab.profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tab.community'),
          href: null,
        }}
      />
    </Tabs>
  );
}
