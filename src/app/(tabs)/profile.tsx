import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, ColorBlindnessMode } from '@/constants/theme';
import { Accessibility } from '@/theme/tokens';
import { PageContainer } from '@/components/page-container';
import { useTheme, useColorBlindnessMode, useSeniorFontScale, useSeniorAppearance } from '@/hooks/use-theme';
import type { SeniorFontScale, SeniorAppearanceOverride } from '@/hooks/use-theme';
import { useLanguageDialect, DIALECTS, DialectCode } from '@/i18n/regional';
import { t } from '@/i18n';

export default function ProfileScreen() {
  const theme = useTheme();
  const [cbMode, setCbMode] = useColorBlindnessMode();
  const [dialect, setDialect] = useLanguageDialect();
  const [fontScale, setFontScale] = useSeniorFontScale();
  const [appearance, setAppearance] = useSeniorAppearance();
  const isEn = dialect === 'en';

  const scaleOptions: { key: SeniorFontScale; label: string }[] = [
    { key: 'standard', label: isEn ? 'Standard text (100%)' : 'Chữ chuẩn (100%)' },
    { key: 'large', label: isEn ? 'Large text (115%)' : 'Chữ to (115%)' },
    { key: 'extraLarge', label: isEn ? 'Extra large (130%)' : 'Chữ rất to (130%)' },
  ];

  const appearanceOptions: { key: SeniorAppearanceOverride; label: string }[] = [
    {
      key: 'light',
      label: isEn ? 'Warm light (Rice paper)' : 'Sáng ấm áp (Giấy gạo)',
    },
    { key: 'dark', label: isEn ? 'Gentle night' : 'Tối dịu mắt' },
    {
      key: 'highContrastSenior',
      label: isEn ? 'High contrast Yellow-Black' : 'Tương phản cao Vàng-Đen (Mắt lão thị)',
    },
  ];

  const cbOptions: { key: ColorBlindnessMode; label: string; desc: string }[] = [
    {
      key: 'standard',
      label: isEn ? 'Standard' : 'Tiêu chuẩn (Mặc định)',
      desc: isEn ? 'High contrast tuned for elderly vision' : 'Độ tương phản cao tối ưu cho mắt người cao tuổi',
    },
    {
      key: 'protanopia',
      label: isEn ? 'Protanopia' : 'Mù màu đỏ (Protanopia)',
      desc: isEn ? 'Optimized for red color blindness' : 'Tối ưu cho người khó phân biệt sắc đỏ',
    },
    {
      key: 'deuteranopia',
      label: isEn ? 'Deuteranopia' : 'Mù màu xanh lá (Deuteranopia)',
      desc: isEn ? 'Optimized for green color blindness' : 'Tối ưu cho người khó phân biệt sắc xanh lá',
    },
    {
      key: 'tritanopia',
      label: isEn ? 'Tritanopia' : 'Mù màu xanh dương (Tritanopia)',
      desc: isEn ? 'Optimized for blue color blindness' : 'Tối ưu cho người khó phân biệt sắc xanh dương',
    },
    {
      key: 'highContrast',
      label: isEn ? 'High Contrast' : 'Tương phản tối đa',
      desc: isEn ? 'Maximum contrast black & white mode' : 'Chế độ đen trắng nổi bật chữ cho mắt lòa',
    },
  ];

  return (
    <PageContainer>
      {/* Senior Display & Font Size */}
      <View style={[styles.seniorCard, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
        <View style={styles.seniorTitleRow}>
          <Ionicons name="text-outline" size={26} color={theme.primaryAction} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.seniorTitle}>
              {isEn ? 'Senior Display & Font Size' : 'Cỡ chữ & Giao diện cho Người cao tuổi'}
            </ThemedText>
            <ThemedText style={[styles.seniorSubtitle, { color: theme.textSecondary }]}>
              {isEn
                ? 'Cỡ chữ & Giao diện cho Người cao tuổi · one tap is enough'
                : 'Senior Display & Font Size · chạm 1 lần là xong'}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.seniorGroupLabel}>{isEn ? 'Font size' : 'Cỡ chữ'}</ThemedText>
        <View style={styles.seniorChips}>
          {scaleOptions.map((opt) => {
            const active = fontScale === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setFontScale(opt.key)}
                style={[
                  styles.seniorChip,
                  {
                    backgroundColor: active ? theme.surfaceElevated : theme.background,
                    borderColor: active ? theme.primaryAction : theme.cardBorder,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}>
                <ThemedText style={[styles.seniorChipLabel, active && { color: theme.primaryAction }]}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.seniorGroupLabel}>{isEn ? 'Appearance' : 'Giao diện'}</ThemedText>
        <View style={styles.seniorChips}>
          {appearanceOptions.map((opt) => {
            const active = appearance === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setAppearance(opt.key)}
                style={[
                  styles.seniorChip,
                  {
                    backgroundColor: active ? theme.surfaceElevated : theme.background,
                    borderColor: active ? theme.primaryAction : theme.cardBorder,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}>
                <ThemedText style={[styles.seniorChipLabel, active && { color: theme.primaryAction }]}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* User Info Header */}
      <ThemedView type="backgroundElement" style={styles.profileCard}>
        <Ionicons name="person-circle-outline" size={64} color={theme.primaryAction} />
        <ThemedText style={styles.userName}>{t('profile.userName')}</ThemedText>
        <ThemedText style={[styles.userRole, { color: theme.textSecondary }]}>
          {t('profile.userRole')}
        </ThemedText>
      </ThemedView>

      {/* Accessibility: Color Blindness Modes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="eye-outline" size={24} color={theme.primaryAction} />
          <ThemedText style={styles.sectionTitle}>{t('profile.accessibilityTitle')}</ThemedText>
        </View>

        <View style={styles.optionList}>
          {cbOptions.map((opt) => {
            const isActive = cbMode === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isActive ? theme.surfaceElevated : theme.surfaceCard,
                    borderColor: isActive ? theme.primaryAction : theme.cardBorder,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => setCbMode(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                aria-checked={isActive}
                accessibilityLabel={isEn ? `Display mode: ${opt.label}` : `Chế độ hiển thị: ${opt.label}`}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.optionLabel, isActive && { color: theme.primaryAction }]}>
                    {opt.label}
                  </ThemedText>
                  <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>
                    {opt.desc}
                  </ThemedText>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={24} color={theme.primaryAction} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Language & Regional Dialects (Visible in VI mode only) */}
      {!isEn && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language-outline" size={24} color={theme.primaryAction} />
            <ThemedText style={styles.sectionTitle}>{t('profile.languageTitle')}</ThemedText>
          </View>

          <View style={styles.optionList}>
            {Object.values(DIALECTS)
              .filter((d) => d.code !== 'en')
              .map((d) => {
                const isActive = dialect === d.code;
                return (
                  <Pressable
                    key={d.code}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isActive ? theme.surfaceElevated : theme.surfaceCard,
                        borderColor: isActive ? theme.primaryAction : theme.cardBorder,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => setDialect(d.code)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    aria-checked={isActive}
                    accessibilityLabel={`Ngôn ngữ: ${d.name}`}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.optionLabel, isActive && { color: theme.primaryAction }]}>
                        {d.name}
                      </ThemedText>
                      <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>
                        Cách xưng hô thân mật: "{d.addressUser}"
                      </ThemedText>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={24} color={theme.primaryAction} />}
                  </Pressable>
                );
              })}
          </View>
        </View>
      )}

      {/* App Info */}
      <ThemedView type="backgroundElement" style={styles.infoCard}>
        <ThemedText style={styles.infoTitle}>
          {isEn ? 'ScamKill — QuadDrake Team (HITC InnoStar 2026)' : 'ScamKill — Đội ngũ QuadDrake (HITC InnoStar 2026)'}
        </ThemedText>
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          {isEn
            ? 'Version 1.0.0 • A calm companion that helps older family members stay safe from online scams.'
            : 'Phiên bản 1.0.0 • Người bạn đồng hành giúp người cao tuổi trong nhà bình an trước lừa đảo trực tuyến.'}
        </ThemedText>
      </ThemedView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: Accessibility.fontSize.title, marginBottom: Spacing.two },
  seniorCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  seniorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  seniorTitle: { fontSize: Accessibility.fontSize.normal, fontWeight: '800' },
  seniorSubtitle: { fontSize: Accessibility.fontSize.small, marginTop: 2 },
  seniorGroupLabel: {
    fontSize: Accessibility.fontSize.normal,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  seniorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  seniorChip: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: Accessibility.minTouchSize,
    borderRadius: Spacing.two,
    borderWidth: 2,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    justifyContent: 'center',
  },
  seniorChipLabel: {
    fontSize: Accessibility.fontSize.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  userName: { fontSize: Accessibility.fontSize.large, fontWeight: '700' },
  userRole: { fontSize: Accessibility.fontSize.small },
  section: { gap: Spacing.two, marginBottom: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionTitle: { fontSize: Accessibility.fontSize.large, fontWeight: '700', flex: 1 },
  optionList: { gap: Spacing.two },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    minHeight: Accessibility.minTouchSize,
  },
  optionLabel: { fontSize: Accessibility.fontSize.normal, fontWeight: '700' },
  optionDesc: { fontSize: Accessibility.fontSize.small, marginTop: 2 },
  infoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  infoTitle: { fontSize: Accessibility.fontSize.normal, fontWeight: '700' },
  infoText: { fontSize: Accessibility.fontSize.small, lineHeight: 20 },
});
