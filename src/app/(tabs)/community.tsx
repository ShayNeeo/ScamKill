import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { t } from '@/i18n';
import { Accessibility } from '@/theme/tokens';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageDialect } from '@/i18n/regional';
import { PageContainer } from '@/components/page-container';

const MOCK_EVENTS_VI = [
  {
    id: 1,
    title: 'Lớp học Smartphone & An toàn số cho Người cao tuổi',
    date: '15/07/2026',
    location: 'Nhà văn hóa Quận 1, TP.HCM',
    type: 'Workshop',
  },
  {
    id: 2,
    title: 'Hội thảo Nhận diện Lừa đảo cho Chú/Bác',
    date: '20/07/2026',
    location: 'Hội người cao tuổi Phường Bến Nghé',
    type: 'Seminar',
  },
];

const MOCK_EVENTS_EN = [
  {
    id: 1,
    title: 'Senior Smartphone & Digital Safety Workshop',
    date: '15/07/2026',
    location: 'District 1 Cultural Center, HCMC',
    type: 'Workshop',
  },
  {
    id: 2,
    title: 'Anti-Scam & Digital Security Seminar for Elders',
    date: '20/07/2026',
    location: 'Ben Nghe Ward Senior Association',
    type: 'Seminar',
  },
];

const PARTNERS_VI = [
  { id: 1, name: 'Hội Người cao tuổi Việt Nam', icon: 'people-circle-outline' },
  { id: 2, name: 'Cục An toàn thông tin (Bộ TT&TT)', icon: 'shield-checkmark-outline' },
  { id: 3, name: 'Đoàn Thanh niên (Tình nguyện viên MIL)', icon: 'ribbon-outline' },
];

const PARTNERS_EN = [
  { id: 1, name: 'Vietnam Association of the Elderly', icon: 'people-circle-outline' },
  { id: 2, name: 'Authority of Information Security', icon: 'shield-checkmark-outline' },
  { id: 3, name: 'Youth Union MIL Volunteer Corps', icon: 'ribbon-outline' },
];

export default function CommunityScreen() {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const mockEvents = isEn ? MOCK_EVENTS_EN : MOCK_EVENTS_VI;
  const partners = isEn ? PARTNERS_EN : PARTNERS_VI;

  const placeholderText = isEn
    ? 'Join MIL workshops, events, and connect with senior digital safety community groups near you.'
    : 'Tham gia các lớp học, hội thảo nâng cao năng lực số (MIL) và trao đổi cùng cộng đồng người cao tuổi.';
  const eventsTitle = isEn ? 'Upcoming Events & Workshops' : 'Sự kiện sắp tới';
  const partnersTitle = isEn ? 'Trusted Community Partners' : 'Đối tác tin cậy';
  const joinBtnText = isEn ? 'Register for Event' : 'Đăng ký tham gia';
  const mapHintText = isEn ? 'View local senior MIL support centers near you' : 'Xem bản đồ các điểm hỗ trợ MIL gần cô/chú';
  const mapBtnText = isEn ? 'Open Support Map' : 'Mở bản đồ đối tác';

  return (
    <PageContainer>
      <ThemedText style={styles.body}>
        {placeholderText}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{eventsTitle}</ThemedText>
        {mockEvents.map(event => (
          <ThemedView key={event.id} type="backgroundElement" style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={[styles.typeBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.primaryAction }]}>
                <ThemedText style={[styles.typeText, { color: theme.primaryAction }]}>
                  {event.type === 'Workshop' ? (isEn ? 'Workshop' : 'Lớp học') : (isEn ? 'Seminar' : 'Hội thảo')}
                </ThemedText>
              </View>
              <ThemedText style={[styles.eventDate, { color: theme.textSecondary }]}>{event.date}</ThemedText>
            </View>
            <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>{event.location}</ThemedText>
            </View>
            <Pressable style={[styles.joinBtn, { backgroundColor: theme.primaryAction }]}>
              <ThemedText style={[styles.joinBtnText, { color: theme.primaryActionText }]}>{joinBtnText}</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{partnersTitle}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.partnerMap}>
          {partners.map(partner => (
            <View key={partner.id} style={styles.partnerItem}>
              <Ionicons name={partner.icon as any} size={40} color={theme.primaryAction} />
              <ThemedText style={styles.partnerName}>{partner.name}</ThemedText>
            </View>
          ))}
          <View style={styles.mapHint}>
            <Ionicons name="map-outline" size={24} color={theme.textSecondary} />
            <ThemedText style={[styles.mapHintText, { color: theme.textSecondary }]}>{mapHintText}</ThemedText>
          </View>
          <Pressable style={[styles.mapBtn, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
             <ThemedText style={[styles.mapBtnText, { color: theme.primaryAction }]}>{mapBtnText}</ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: Accessibility.fontSize.title, marginBottom: Spacing.two },
  body: {
    fontSize: Accessibility.fontSize.normal,
    lineHeight: 28,
  },
  section: { gap: Spacing.three, marginTop: Spacing.two },
  sectionTitle: { fontSize: Accessibility.fontSize.large, lineHeight: 30, fontWeight: '700' },
  eventCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  typeText: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  eventDate: { fontSize: Accessibility.fontSize.normal },
  eventTitle: { fontSize: Accessibility.fontSize.large, lineHeight: 30, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  locationText: { fontSize: Accessibility.fontSize.normal },
  joinBtn: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  joinBtnText: { fontSize: Accessibility.fontSize.normal, fontWeight: '700' },
  partnerMap: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  partnerItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  partnerName: { fontSize: Accessibility.fontSize.normal, fontWeight: '600', flex: 1 },
  mapHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  mapHintText: { fontSize: Accessibility.fontSize.small, flex: 1 },
  mapBtn: {
    borderWidth: 2,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  mapBtnText: { fontSize: Accessibility.fontSize.normal, fontWeight: '700' },
});
