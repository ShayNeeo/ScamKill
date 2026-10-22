import { useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, useWindowDimensions, View } from 'react-native';
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
import { CdnIcon } from '@/components/scamkill/CdnIcon';
import { InteractiveGuidebookModal } from '@/components/scamkill/InteractiveGuidebookModal';
import { t } from '@/i18n';
import { hapticTap } from '@/lib/haptics';

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
  const [guideOpen, setGuideOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isEn = dialect === 'en';
  const compact = width < 520;
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
    paddingHorizontal: compact ? 6 : 8,
    paddingVertical: 5,
  };
  const chipText = { fontSize: 11, fontWeight: '800' as const, color: theme.primaryAction };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 8 }}>
        <Pressable
          style={[
            chipStyle,
            {
              gap: 3,
              backgroundColor: theme.primaryAction,
              borderColor: theme.primaryAction,
            },
          ]}
          onPress={() => {
            void hapticTap();
            setGuideOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isEn ? 'Open the interactive visual guidebook' : 'Mở hướng dẫn trực quan tương tác'
          }>
          <CdnIcon
            icon="lucide:book-open"
            fallback="book-outline"
            size={14}
            color={theme.primaryActionText}
          />
          <ThemedText style={[chipText, { color: theme.primaryActionText }]}>
            {isEn ? 'Guide' : 'Hướng dẫn'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={chipStyle}
          onPress={() => {
            void hapticTap();
            cycleSeniorFontScale();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isEn
              ? `Font size. Current: ${fontMeta.en}. Tap to enlarge text.`
              : `Cỡ chữ. Hiện tại: ${fontMeta.vi}. Bấm để phóng to chữ.`
          }>
          <ThemedText style={chipText}>A+</ThemedText>
          {compact ? null : (
            <ThemedText style={chipText}>{isEn ? fontMeta.en : fontMeta.vi}</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={chipStyle}
          onPress={() => {
            void hapticTap();
            cycleSeniorAppearance();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isEn
              ? `Display contrast. Current: ${appMeta.en}. Tap to change.`
              : `Độ tương phản. Hiện tại: ${appMeta.vi}. Bấm để đổi.`
          }>
          <Ionicons name={appMeta.icon} size={14} color={theme.primaryAction} />
          {compact ? null : (
            <ThemedText style={chipText}>{isEn ? appMeta.en : appMeta.vi}</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={chipStyle}
          onPress={() => {
            void hapticTap();
            setDialect(isEn ? 'vi-north' : 'en');
          }}
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Switch language. Current: English' : 'Đổi ngôn ngữ. Hiện tại: Tiếng Việt'}>
          <Ionicons name="globe-outline" size={14} color={theme.primaryAction} />
          <ThemedText style={chipText}>{isEn ? 'EN' : 'VN'}</ThemedText>
        </Pressable>
      </View>

      <InteractiveGuidebookModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
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
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
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
          title: isEn ? 'Call Shield' : 'Gọi đến',
          tabBarLabel: isEn ? 'Call Shield' : 'Gọi đến',
          tabBarIcon: ({ color }) => <Ionicons name="call" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: isEn ? 'Messages' : 'Tin nhắn',
          tabBarLabel: isEn ? 'Messages' : 'Tin nhắn',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trusted_circle"
        options={{
          title: isEn ? 'Family & Bot' : 'Gia đình',
          tabBarLabel: isEn ? 'Family' : 'Gia đình',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: isEn ? 'Alerts' : 'Cảnh báo',
          tabBarLabel: isEn ? 'Alerts' : 'Cảnh báo',
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: isEn ? 'Skills' : 'Kỹ năng',
          tabBarLabel: isEn ? 'Skills' : 'Kỹ năng',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isEn ? 'Settings' : 'Cài đặt',
          tabBarLabel: isEn ? 'Settings' : 'Cài đặt',
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
