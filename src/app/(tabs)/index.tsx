import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  useWindowDimensions,
  DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LessonCard } from '@/components/lesson-card';
import { RiskBadge } from '@/components/risk-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImagePickerButton } from '@/components/ImagePicker';
import { AudioReadback } from '@/components/audio-readback';
import { SimplifiedGlossary } from '@/components/simplified-glossary';
import { DualPane } from '@/components/dual-pane';
import { PageContainer } from '@/components/page-container';
import { PwaInstallBanner } from '@/components/scamkill/PwaInstallBanner';
import { ScenarioDrawer } from '@/components/scamkill/ScenarioDrawer';
import { IncomingCallModal } from '@/components/scamkill/IncomingCallModal';
import { CoolingOffModal } from '@/components/scamkill/CoolingOffModal';
import { useResponsive } from '@/hooks/use-responsive';
import { createAnalyzeClient } from '@/api/client';
import type { AnalyzeOutput, AnalysisInput } from '@/api/contract';
import {
  dispatchFamilyAlert,
  getDefaultFamilySafeWord,
} from '@/api/scamkill/client';
import type {
  CallCheckOutput,
  FamilyAlertReceipt,
  ScamKillScenario,
} from '@/api/scamkill/types';
import { redact } from '@/lib/redact';
import { alertReceiptSummary, localizeCallOutput, t } from '@/i18n';
import { getDialect, useLanguageDialect } from '@/i18n/regional';
import { Accessibility } from '@/theme/tokens';
import { Spacing, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const client = createAnalyzeClient();
type Mode = 'text' | 'url' | 'image' | 'voice';

export default function CompanionScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { isWide } = useResponsive();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';
  const heroRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled) return;
      const scope = heroRef.current as unknown as Element | null;
      const children = scope ? Array.from(scope.children) : [];
      if (!scope || children.length === 0) return;

      ctx = gsap.context(() => {
        gsap.from(children, {
          y: 18,
          opacity: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });
      }, scope);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const [mode, setMode] = useState<Mode>('text');
  const [value, setValue] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [scenario, setScenario] = useState<ScamKillScenario | null>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callReceipt, setCallReceipt] = useState<FamilyAlertReceipt | null>(null);
  const [callAlertError, setCallAlertError] = useState<string | null>(null);
  const [callAlertBusy, setCallAlertBusy] = useState(false);
  const [familySafeWord, setFamilySafeWord] = useState(() => getDefaultFamilySafeWord());

  const numColumns = width > 600 ? 4 : 2;
  const btnWidth = `${100 / numColumns - 2}%` as DimensionValue;

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('scamkill.family-safe-word')
        .then((saved) => {
          if (saved) setFamilySafeWord(saved);
        })
        .catch(() => undefined);
    }, [])
  );

  async function runAnalysis(input: AnalysisInput) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await client.analyze(input));
    } catch {
      setError('common.error');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit() {
    if (loading) return;

    const activeLang = getDialect() === 'en' ? 'en' : 'vi';
    let input: AnalysisInput;
    if (mode === 'url') {
      input = { kind: 'url', url: value.trim(), language: activeLang };
    } else if (mode === 'text') {
      input = { kind: 'text', text: redact(value).text, language: activeLang };
    } else if (mode === 'image' && mediaUri) {
      input = { kind: 'image', ref: mediaUri, language: activeLang };
    } else if (mode === 'voice' && mediaUri) {
      input = { kind: 'voice', data: value, mimeType: 'audio/m4a', language: activeLang };
    } else {
      return;
    }

    await runAnalysis(input);
  }

  async function handleScenarioSelect(next: ScamKillScenario) {
    setScenario(next);
    setCallReceipt(null);
    setCallAlertError(null);

    if (next.callInput && (next.layer === 1 || next.layer === 3)) {
      setResult(null);
      setError(null);
      setCallModalVisible(true);
      return;
    }

    if (next.messageText) {
      setMode('text');
      setValue(next.messageText);
      setMediaUri(null);
      await runAnalysis({
        kind: 'text',
        text: redact(next.messageText).text,
        language: getDialect() === 'en' ? 'en' : 'vi',
      });
    }
  }

  async function handleCallAlert(callOutput: CallCheckOutput, shareTranscriptConsent: boolean) {
    if (!scenario || callAlertBusy) return;
    setCallAlertBusy(true);
    setCallAlertError(null);
    try {
      const localized = localizeCallOutput(callOutput, isEn);
      const receipt = await dispatchFamilyAlert({
        alertType:
          scenario.id === 'ba-lan-30m' || scenario.id === 'zalo-voice-clone'
            ? 'relative_impersonation'
            : 'high_risk_call',
        relatedPhoneNumber: callOutput.phoneNumber,
        channels: ['sms', 'zalo', 'telegram'],
        consentToShareContent: shareTranscriptConsent,
        messageOrCallContent: shareTranscriptConsent
          ? `${localized.shortReason}. ${localized.reasons.join(' ')}`
          : undefined,
      });
      setCallReceipt(receipt);
      setCallModalVisible(false);
    } catch {
      setCallAlertError('common.error');
    } finally {
      setCallAlertBusy(false);
    }
  }

  const handleVoicePress = () => {
    if (isRecording) {
      setIsRecording(false);
      setMode('voice');
      setMediaUri('mock-voice-uri');
      setValue(t('companion.voiceSample'));
    } else {
      setIsRecording(true);
      setResult(null);
      setMediaUri(null);
    }
  };

  const inputPane = (
    <View style={styles.paneContent}>
      <View style={styles.modeGrid}>
        <ModeButton
          active={mode === 'text'}
          label={t('companion.sourceText')}
          icon="text-outline"
          width={btnWidth}
          onPress={() => { setMode('text'); setMediaUri(null); }}
        />
        <ModeButton
          active={mode === 'url'}
          label={t('companion.sourceUrl')}
          icon="link-outline"
          width={btnWidth}
          onPress={() => { setMode('url'); setMediaUri(null); }}
        />
        <ImagePickerButton
          disabled={loading}
          active={mode === 'image'}
          style={{ width: btnWidth }}
          onImageSelected={(uri) => { setMode('image'); setMediaUri(uri); }}
        />
        <Pressable
          style={[styles.modeBtn, { borderColor: theme.primaryAction, backgroundColor: theme.surfaceCard, width: btnWidth }, isRecording && { backgroundColor: theme.riskHigh, borderColor: theme.riskHigh }]}
          onPress={handleVoicePress}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? t('companion.stopRecording') : t('companion.startRecording')}>
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-outline'}
            size={32}
            color={isRecording ? '#FFF' : theme.primaryAction}
          />
          <ThemedText style={[styles.modeLabel, isRecording && { color: '#FFF' }]}>
            {isRecording ? t('companion.recording') : t('companion.sourceVoice')}
          </ThemedText>
        </Pressable>
      </View>

      {(mode === 'text' || mode === 'url' || (mode === 'voice' && mediaUri)) && (
        <TextInput
          style={[styles.input, { borderColor: theme.textSecondary, color: theme.text, backgroundColor: theme.surfaceCard }]}
          value={value}
          onChangeText={setValue}
          placeholder={t('companion.inputPlaceholder')}
          placeholderTextColor="#9A9A9A"
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          keyboardType={mode === 'url' ? 'url' : 'default'}
          accessibilityLabel={t('companion.inputPlaceholder')}
        />
      )}

      {mediaUri && mode !== 'voice' && (
        <View style={[styles.mediaPreview, { backgroundColor: theme.surfaceCard, borderColor: theme.textSecondary }]}>
          {mode === 'image' && (
            <Image source={{ uri: mediaUri }} style={styles.previewImage} />
          )}
          <Pressable onPress={() => setMediaUri(null)}>
            <Ionicons name="close-circle" size={32} color={theme.riskHigh} />
          </Pressable>
        </View>
      )}

      {mode === 'voice' && mediaUri && (
        <View style={[styles.voiceInfo, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="musical-notes" size={24} color={theme.primaryAction} />
          <ThemedText style={{ flex: 1 }}>{t('companion.voiceTranscribed')}</ThemedText>
          <Pressable onPress={() => { setMediaUri(null); setValue(''); }}>
            <Ionicons name="close-circle" size={24} color={theme.riskHigh} />
          </Pressable>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.submit, { backgroundColor: theme.primaryAction }, pressed && styles.submitPressed]}
        onPress={onSubmit}
        disabled={loading || (mode === 'text' || mode === 'url' ? !value.trim() : !mediaUri)}
        accessibilityRole="button"
        accessibilityLabel={t('companion.submit')}>
        <ThemedText style={[styles.submitText, { color: theme.primaryActionText }]}>
          {loading ? t('common.loading') : t('companion.submit')}
        </ThemedText>
      </Pressable>

      {loading && <ActivityIndicator style={styles.loader} size="large" color={theme.primaryAction} />}
      {error && (
        <ThemedText style={[styles.body, { color: theme.riskHigh }]}>{t(error)}</ThemedText>
      )}

      <SimplifiedGlossary />
    </View>
  );

  const resultPane = result ? <ResultCard result={result} scenario={scenario} familySafeWord={familySafeWord} /> : null;

  return (
    <PageContainer>
      <PwaInstallBanner />

      <View ref={heroRef}>
        <ThemedText style={[styles.brandTitle, { color: theme.text }]}>{t('home.brandTitle')}</ThemedText>
        <ThemedText style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
          {t('home.brandSubtitle')}
        </ThemedText>

        <ProtectionLoopBar />

        <ScenarioDrawer onSelectScenario={handleScenarioSelect} />
      </View>

      {callReceipt && <ReceiptSummary receipt={callReceipt} />}
      {callAlertError && (
        <ThemedText style={[styles.body, { color: theme.riskHigh }]}>{t(callAlertError)}</ThemedText>
      )}

      {isWide ? (
        <DualPane master={inputPane} detail={resultPane} />
      ) : (
        <View style={styles.mobileWrap}>
          {inputPane}
          {resultPane}
        </View>
      )}

      <IncomingCallModal
        visible={callModalVisible}
        scenario={scenario}
        callInput={scenario?.callInput ?? null}
        familySafeWord={familySafeWord}
        onClose={() => setCallModalVisible(false)}
        onTriggerVerifyAndAlert={handleCallAlert}
      />
    </PageContainer>
  );
}

function ProtectionLoopBar() {
  const theme = useTheme();
  const steps = ['home.loopStep1', 'home.loopStep2', 'home.loopStep3', 'home.loopStep4'];

  return (
    <View style={[styles.loopCard, { backgroundColor: theme.surfaceCard, borderColor: theme.cardBorder }]}>
      <ThemedText style={[styles.loopTitle, { color: theme.primaryAction }]}>{t('home.loopTitle')}</ThemedText>
      <View style={styles.loopRow}>
        {steps.map((key, index) => (
          <View key={key} style={styles.loopItemWrap}>
            <View style={[styles.loopStep, { backgroundColor: theme.backgroundElement, borderColor: theme.primaryAction }]}>
              <ThemedText style={[styles.loopStepText, { color: theme.text }]}>{t(key)}</ThemedText>
            </View>
            {index < steps.length - 1 && (
              <Ionicons name="arrow-forward" size={16} color={theme.primaryAction} style={styles.loopArrow} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function ModeButton({ active, label, icon, width, onPress }: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; width: DimensionValue; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.modeBtn,
        { borderColor: theme.primaryAction, backgroundColor: theme.surfaceCard, width },
        active && { backgroundColor: theme.primaryAction },
        pressed && styles.modeBtnPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={32} color={active ? theme.primaryActionText : theme.primaryAction} />
      <ThemedText style={[styles.modeLabel, active && { color: theme.primaryActionText }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ResultCard({ result, scenario, familySafeWord }: { result: AnalyzeOutput; scenario: ScamKillScenario | null; familySafeWord: string }) {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';
  const [coolingOffVisible, setCoolingOffVisible] = useState(false);
  const [consent, setConsent] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [receipt, setReceipt] = useState<FamilyAlertReceipt | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    setConsent(false);
    setReceipt(null);
    setDispatchError(null);
  }, [result, scenario]);

  const reasons = result.redFlags.slice(0, 3).map((flag) => flag.explanation);
  const concreteAction = isEn
    ? "Don't tap the link. Ask a family member first"
    : 'Đừng bấm liên kết. Hỏi người thân trước';
  const relatedPhone = scenario?.callInput?.phoneNumber ?? (isEn ? 'Unknown' : 'Không rõ');

  async function onReport() {
    if (dispatching) return;
    setDispatching(true);
    setDispatchError(null);
    try {
      const nextReceipt = await dispatchFamilyAlert({
        alertType: 'suspicious_message',
        relatedPhoneNumber: relatedPhone,
        channels: ['sms', 'zalo', 'telegram'],
        consentToShareContent: consent,
        messageOrCallContent: consent
          ? `${reasons.join(' ')} ${concreteAction}`.trim()
          : undefined,
        recipientNames: [isEn ? 'Hương (Daughter)' : 'Chị Hương (Con gái)'],
      });
      setReceipt(nextReceipt);
    } catch {
      setDispatchError('common.error');
    } finally {
      setDispatching(false);
    }
  }

  const audioReadText = `${t('companion.result.title') || 'Risk Analysis'}: ${t(`risk.${result.riskLevel}`)}. ` +
    `${concreteAction}. ` +
    `${t('companion.result.verificationSteps')}: ${result.verificationSteps.join('. ')}.`;

  return (
    <View style={styles.result}>
      <RiskBadge level={result.riskLevel} />

      <AudioReadback text={audioReadText} label={t('audio.readAudio')} />

      <View style={[styles.actionCard, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHigh }]}>
        <ThemedText style={[styles.cardHeading, { color: theme.riskHigh }]}>
          {isEn ? 'Do this now' : 'Việc cần làm ngay'}
        </ThemedText>
        <ThemedText style={[styles.concreteAction, { color: theme.text }]}>{concreteAction}</ThemedText>
      </View>

      <View style={styles.block}>
        <ThemedText type="subtitle" style={styles.blockTitle}>
          {t('home.reasonsTitle')}
        </ThemedText>
        {(reasons.length ? reasons : [isEn ? 'No clear red flags found yet. Verify with family before acting.' : 'Chưa thấy dấu hiệu rõ ràng. Hãy hỏi người thân trước khi làm gì.']).map((reason, index) => (
          <View key={index} style={styles.item}>
            <ThemedText style={[styles.bullet, { color: theme.primaryAction }]}>•</ThemedText>
            <ThemedText style={styles.body}>{reason}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.featureThree}>
        <Pressable
          style={[styles.slowButton, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}
          onPress={() => setCoolingOffVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('home.slowDownButton')}>
          <ThemedText style={[styles.slowButtonText, { color: theme.primaryAction }]}>
            {isEn ? 'Slow down & ask Family Code' : 'Làm chậm & Hỏi Mã Gia Đình'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.consentRow}
          onPress={() => setConsent((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          accessibilityLabel={isEn ? 'Agree to share message content with family' : 'Đồng ý chia sẻ nội dung tin nhắn cho người thân'}>
          <Ionicons
            name={consent ? 'checkbox' : 'square-outline'}
            size={26}
            color={consent ? theme.primaryAction : theme.textSecondary}
          />
          <ThemedText style={[styles.consentText, { color: theme.textSecondary }]}>
            {isEn ? 'Agree to share message content with family' : 'Đồng ý chia sẻ nội dung tin nhắn cho người thân'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.reportButton, { backgroundColor: theme.riskHigh }, dispatching && styles.submitPressed]}
          onPress={onReport}
          disabled={dispatching}
          accessibilityRole="button"
          accessibilityLabel={t('home.reportButton')}>
          <ThemedText style={[styles.reportButtonText, { color: '#FFF' }]}>
            {dispatching
              ? t('common.loading')
              : isEn
                ? "I'm suspicious: Alert family (SMS / Zalo / Telegram)"
                : 'Tôi nghi ngờ: Báo người thân (SMS / Zalo / Telegram)'}
          </ThemedText>
        </Pressable>

        {dispatchError && <ThemedText style={{ color: theme.riskHigh }}>{t(dispatchError)}</ThemedText>}
        {receipt && <ReceiptSummary receipt={receipt} />}
      </View>

      {result.verificationSteps.length > 0 && (
        <Section titleKey="companion.result.verificationSteps" items={result.verificationSteps} />
      )}

      {result.lessonCard && <LessonCard card={result.lessonCard} />}

      {result.disclaimer && (
        <ThemedText themeColor="textSecondary" style={styles.disclaimer}>{result.disclaimer}</ThemedText>
      )}

      <CoolingOffModal
        visible={coolingOffVisible}
        title={isEn ? 'Slow down before acting' : 'Làm chậm trước khi quyết định'}
        amountOrRiskText={`${t(`risk.${result.riskLevel}`)}: ${concreteAction}`}
        familySafeWord={familySafeWord}
        callerNumber={relatedPhone}
        onClose={() => setCoolingOffVisible(false)}
        onNotifyFamily={() => {
          setCoolingOffVisible(false);
          void onReport();
        }}
      />
    </View>
  );
}

function ReceiptSummary({ receipt }: { receipt: FamilyAlertReceipt }) {
  const theme = useTheme();
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  return (
    <ThemedView type="backgroundElement" style={[styles.receipt, { borderColor: theme.riskSafe }]}>
      <View style={styles.receiptHeader}>
        <Ionicons name="checkmark-circle" size={24} color={theme.riskSafe} />
        <ThemedText style={[styles.receiptTitle, { color: theme.riskSafe }]}>
          {isEn ? 'Alert received by family bot' : 'Người thân đã nhận cảnh báo'}
        </ThemedText>
      </View>
      <ThemedText style={[styles.receiptSummary, { color: theme.text }]}>
        {alertReceiptSummary(receipt, isEn)}
      </ThemedText>
      <ThemedText style={[styles.receiptMeta, { color: theme.textSecondary }]}>
        {receipt.sharedContentIncluded
          ? isEn ? 'Content shared with consent' : 'Nội dung được chia sẻ theo đồng ý'
          : isEn ? 'Metadata only, content hidden' : 'Chỉ gửi thông tin, nội dung đã ẩn'}
      </ThemedText>
      <View style={styles.badgeRow}>
        {receipt.deliveries.map((delivery) => (
          <View key={delivery.id} style={[styles.channelBadge, { backgroundColor: theme.surfaceCard, borderColor: theme.primaryAction }]}>
            <ThemedText style={[styles.channelBadgeText, { color: theme.primaryAction }]}>
              [{delivery.channel.toUpperCase()}]
            </ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

function Section({ titleKey, items }: { titleKey: string; items: string[] }) {
  return (
    <View style={styles.block}>
      <ThemedText type="subtitle" style={styles.blockTitle}>
        {t(titleKey)}
      </ThemedText>
      {items.map((s, i) => (
        <View key={i} style={styles.item}>
          <ThemedText style={styles.bullet}>•</ThemedText>
          <ThemedText style={styles.body}>{s}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  paneContent: { flex: 1, gap: Spacing.three },
  mobileWrap: { flex: 1, gap: Spacing.four },
  brandTitle: { fontSize: Accessibility.fontSize.large, fontWeight: '800', lineHeight: 32, fontFamily: Fonts.heading },
  brandSubtitle: { fontSize: Accessibility.fontSize.normal, lineHeight: 26, marginTop: Spacing.one },
  loopCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  loopTitle: { fontSize: Accessibility.fontSize.normal, fontWeight: '800' },
  loopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingVertical: Spacing.one },
  loopItemWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  loopStep: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  loopStepText: { fontSize: Accessibility.fontSize.small, fontWeight: '700' },
  loopArrow: { marginHorizontal: 2 },
  title: { fontSize: Accessibility.fontSize.title, marginBottom: Spacing.two },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center' },
  modeBtn: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  modeBtnPressed: { opacity: 0.8 },
  modeLabel: { fontSize: Accessibility.fontSize.normal, fontWeight: '600', textAlign: 'center' },
  input: {
    minHeight: 120,
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.three,
    fontSize: Accessibility.fontSize.normal,
    textAlignVertical: 'top',
    marginTop: Spacing.two,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  previewImage: { width: 100, height: 100, borderRadius: Spacing.two },
  voiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  submit: {
    minHeight: Accessibility.minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.four,
    marginTop: Spacing.two,
  },
  submitPressed: { opacity: 0.85 },
  submitText: { fontSize: Accessibility.fontSize.large, fontWeight: '700' },
  loader: { alignSelf: 'center', marginVertical: Spacing.three },
  result: { gap: Spacing.four, alignSelf: 'stretch', marginTop: Spacing.two },
  block: { gap: Spacing.two, alignSelf: 'stretch' },
  blockTitle: { fontSize: Accessibility.fontSize.large, lineHeight: 30, fontWeight: '700' },
  cardHeading: { fontSize: Accessibility.fontSize.normal, fontWeight: '800' },
  actionCard: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  concreteAction: { fontSize: Accessibility.fontSize.large, fontWeight: '800', lineHeight: 30 },
  item: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  bullet: { fontSize: Accessibility.fontSize.normal, lineHeight: 28 },
  body: { flex: 1, fontSize: Accessibility.fontSize.normal, lineHeight: 28 },
  featureThree: { gap: Spacing.two, alignSelf: 'stretch' },
  slowButton: {
    minHeight: Accessibility.minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.three,
  },
  slowButtonText: { fontSize: Accessibility.fontSize.normal, fontWeight: '800', textAlign: 'center' },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: Accessibility.minTouchSize,
  },
  consentText: { flex: 1, fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  reportButton: {
    minHeight: Accessibility.minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  reportButtonText: { fontSize: Accessibility.fontSize.normal, fontWeight: '800', textAlign: 'center' },
  receipt: { borderWidth: 2, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  receiptTitle: { fontSize: Accessibility.fontSize.normal, fontWeight: '800', flex: 1 },
  receiptSummary: { fontSize: Accessibility.fontSize.small, lineHeight: 22 },
  receiptMeta: { fontSize: Accessibility.fontSize.small, fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  channelBadge: { borderWidth: 1, borderRadius: Spacing.one, paddingHorizontal: Spacing.one },
  channelBadgeText: { fontSize: 12, fontWeight: '800' },
  disclaimer: {
    fontSize: Accessibility.fontSize.small,
    fontStyle: 'italic',
    lineHeight: 24,
    marginTop: Spacing.two,
  },
});
