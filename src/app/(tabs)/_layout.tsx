import { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { ThemedText } from '@/components/themed-text';
import { t } from '@/i18n';

function HeaderLanguageToggle() {
  const theme = useTheme();
  const [dialect, setDialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.primaryAction,
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 12,
        gap: 6,
      }}
      onPress={() => setDialect(isEn ? 'vi-north' : 'en')}
      accessibilityRole="button"
      accessibilityLabel={isEn ? 'Switch language. Current: English' : 'Đổi ngôn ngữ. Hiện tại: Tiếng Việt'}>
      <Ionicons name="globe-outline" size={16} color={theme.primaryAction} />
      <ThemedText style={{ fontSize: 13, fontWeight: '700', color: theme.primaryAction }}>
        {isEn ? 'EN' : 'VN'}
      </ThemedText>
    </Pressable>
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
      tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
      tabBarItemStyle: { paddingHorizontal: 0 },
      tabBarStyle: {
        height: 62,
        paddingBottom: 6,
        paddingTop: 6,
        backgroundColor: theme.surfaceCard,
        borderTopColor: theme.cardBorder,
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
      headerRight: () => <HeaderLanguageToggle />,
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
