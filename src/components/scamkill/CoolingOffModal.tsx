import * as React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getDefaultFamilySafeWord } from '@/api/scamkill/client';
import { CdnIcon } from '@/components/scamkill/CdnIcon';
import { Fonts } from '@/constants/theme';
import { useLanguageDialect } from '@/i18n/regional';
import { hapticWarning } from '@/lib/haptics';

export interface CoolingOffModalProps {
  visible: boolean;
  title?: string;
  amountOrRiskText?: string;
  familySafeWord?: string;
  callerNumber?: string;
  onClose: () => void;
  onNotifyFamily?: () => void;
}

const COOLING_OFF_SECONDS = 60;
const COOLING_OFF_HOURS = 48;
const BREATH_PHASE_MS = 4000;

const INHALE_CUE_VI = 'Hít vào thật sâu (4 giây)... Khoan mở ứng dụng ngân hàng';
const EXHALE_CUE_VI = 'Thở ra chậm rãi (4 giây)... Kẻ gian luôn giục gấp, mình cứ bình tĩnh';
const INHALE_CUE_EN = 'Inhale slowly (4s)... Do not open your banking app yet';
const EXHALE_CUE_EN = 'Exhale gently (4s)... Scammers rush you, we take our time';

function formatUntil(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function CoolingOffModal(props: CoolingOffModalProps): React.JSX.Element | null {
  const {
    visible,
    title,
    amountOrRiskText,
    familySafeWord,
    callerNumber,
    onClose,
    onNotifyFamily,
  } = props;

  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const safeWord = familySafeWord || getDefaultFamilySafeWord();
  const [secondsLeft, setSecondsLeft] = React.useState(COOLING_OFF_SECONDS);
  const [lockUntil, setLockUntil] = React.useState(0);
  const [askedSafeWord, setAskedSafeWord] = React.useState(false);
  const [calledBack, setCalledBack] = React.useState(false);

  const rootRef = React.useRef<View>(null);
  const headerRef = React.useRef<View>(null);
  const timerCardRef = React.useRef<View>(null);
  const brainCardRef = React.useRef<View>(null);

  const breath = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATH_PHASE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: BREATH_PHASE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, breath]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled) return;
      const scope = rootRef.current as unknown as Element | null;
      const targets = [headerRef.current, timerCardRef.current, brainCardRef.current]
        .filter((node): node is View => Boolean(node))
        .map((node) => node as unknown as Element);
      if (!scope || targets.length === 0) return;

      ctx = gsap.context(() => {
        gsap.from(targets, {
          y: 20,
          opacity: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });
        if (timerCardRef.current) {
          gsap.to(timerCardRef.current as unknown as Element, {
            scale: 1.012,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      }, scope);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;
    void hapticWarning();
    setSecondsLeft(COOLING_OFF_SECONDS);
    setLockUntil(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);
    setAskedSafeWord(false);
    setCalledBack(false);
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const elapsed = COOLING_OFF_SECONDS - secondsLeft;
  const finished = secondsLeft === 0;
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} ref={rootRef}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header} ref={headerRef}>
            <Text style={styles.stepTag}>
              {isEn ? 'Step 2 · Let us pause for a moment' : 'Bước 2 · Mình dừng lại một chút nhé'}
            </Text>
            <Text style={styles.title}>
              {title ||
                (isEn
                  ? 'Mom, Dad, let us hold off sending money. Pause for 60 seconds first...'
                  : 'Mẹ/Bố ơi, mình khoan chuyển tiền, dừng lại 60 giây đã…')}
            </Text>
            {amountOrRiskText ? (
              <Text style={styles.amountText}>{amountOrRiskText}</Text>
            ) : null}
            {callerNumber ? (
              <Text style={styles.callerText}>
                {isEn ? 'Calling number: ' : 'Số đang gọi tới: '}
                {callerNumber}
              </Text>
            ) : null}
          </View>

          <View style={styles.timerCard} ref={timerCardRef}>
            <View style={styles.breathStage}>
              <Animated.View
                pointerEvents="none"
                style={[styles.breathHalo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
              />
              <View style={styles.timerCircle} accessibilityRole="timer">
                <Text style={styles.timerText}>
                  {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                  {String(secondsLeft % 60).padStart(2, '0')}
                </Text>
                <Text style={styles.timerCaption}>
                  {isEn ? 'seconds breathing together' : 'giây mình thở cùng nhau'}
                </Text>
              </View>
            </View>
            <Text style={styles.breathText}>
              {finished
                ? isEn
                  ? 'You have breathed for a full 60 seconds. Now do the 2 checks below so your family feels at ease.'
                  : 'Mình đã thở đủ 60 giây rồi. Giờ mình làm thêm 2 bước kiểm tra nhé, con cháu sẽ yên tâm hơn.'
                : Math.floor(elapsed / (BREATH_PHASE_MS / 1000)) % 2 === 0
                  ? isEn
                    ? INHALE_CUE_EN
                    : INHALE_CUE_VI
                  : isEn
                    ? EXHALE_CUE_EN
                    : EXHALE_CUE_VI}
            </Text>
            {finished ? (
              <Pressable
                onPress={() => {
                  setSecondsLeft(COOLING_OFF_SECONDS);
                  breath.setValue(0);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  isEn
                    ? 'Restart the 60 second safety pause'
                    : 'Bắt đầu lại 60 giây khoảng dừng an toàn'
                }
                style={({ pressed }) => [styles.restartButton, pressed && styles.pressed]}>
                <Text style={styles.restartText}>
                  {isEn ? 'Breathe with me for another 60 seconds' : 'Mình thở lại 60 giây nhé'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.brainCard} ref={brainCardRef}>
            <Text style={styles.brainTitle}>
              {isEn
                ? 'Why this 60s pause works (Brain Science)'
                : 'Vì sao 60 giây này hiệu quả (Khoa học não bộ)'}
            </Text>
            <Text style={styles.brainText}>
              {isEn
                ? 'A sudden money demand can trigger an amygdala hijack: your body reacts before your thinking brain checks the facts. Four seconds in, four seconds out slows your heart rate. After a full minute the rational brain is back in charge, so you can verify with family instead of rushing.'
                : 'Một yêu cầu chuyển tiền đột ngột có thể gây "amygdala hijack": cơ thể phản ứng trước khi não kịp kiểm tra sự thật. Hít 4 giây, thở 4 giây giúp nhịp tim chậm lại. Sau trọn một phút, vùng não lý trí hoạt động trở lại, để mình xác minh với người thân thay vì vội vàng.'}
            </Text>
          </View>

          <View style={styles.lockCard}>
            <Text style={styles.lockTitle}>
              {isEn
                ? 'High-risk transactions paused for 48 hours'
                : 'Mình tạm khoá giao dịch nguy cơ cao · 48 giờ'}
            </Text>
            <Text style={styles.lockUntil}>
              {isEn ? 'Reminder set until: ' : 'Mình ghi nhớ đến: '}
              {lockUntil ? formatUntil(lockUntil) : '...'}
            </Text>
            <Text style={styles.lockNote}>
              {isEn
                ? 'In this trial the pause is a reminder and tracker inside the app. It does not lock your real bank account.'
                : 'Trong bản thử nghiệm, đây là lời nhắc và theo dõi ngay trong ứng dụng, không khoá tài khoản ngân hàng thật của mình đâu.'}
            </Text>
          </View>

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>
              {isEn
                ? 'Check the voice with 2 simple steps'
                : 'Mình kiểm tra giọng người thân, 2 bước thôi'}
            </Text>

            <Pressable
              onPress={() => setAskedSafeWord((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: askedSafeWord }}
              accessibilityLabel={isEn ? 'Step 1: Ask for the family code' : 'Bước 1: Hỏi "Mã gia đình"'}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, askedSafeWord && styles.checkboxChecked]}>
                {askedSafeWord ? (
                  <CdnIcon icon="lucide:check" fallback="checkmark" size={15} color="#FFFFFF" />
                ) : null}
              </View>
              <View style={styles.checkBody}>
                <Text style={styles.checkTitle}>
                  {isEn ? '(i) Ask for our family code' : '(i) Hỏi “Mã gia đình” của mình'}
                </Text>
                <Text style={styles.checkDesc}>
                  {isEn
                    ? 'A real relative will answer the secret phrase correctly. An AI voice can copy the sound but does not know the answer.'
                    : 'Người thân thật sẽ trả lời đúng câu bí mật này. Giọng AI bắt chước được, nhưng không biết câu trả lời.'}
                </Text>
              </View>
            </Pressable>

            <View style={styles.safeWordBox}>
              <Text style={styles.safeWordLabel}>
                {isEn ? 'Our family code' : 'Mã gia đình của mình'}
              </Text>
              <Text style={styles.safeWordValue}>“{safeWord}”</Text>
              <Text style={styles.safeWordAsk}>
                {isEn
                  ? 'Ask now: "What is our family code?"'
                  : 'Mình hỏi ngay: “Mã gia đình của mình là gì?”'}
              </Text>
            </View>

            <Pressable
              onPress={() => setCalledBack((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: calledBack }}
              accessibilityLabel={
                isEn
                  ? 'Step 2: Hang up and call back the saved number'
                  : 'Bước 2: Cúp máy và gọi lại theo số đã lưu trong danh bạ'
              }
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, calledBack && styles.checkboxChecked]}>
                {calledBack ? (
                  <CdnIcon icon="lucide:check" fallback="checkmark" size={15} color="#FFFFFF" />
                ) : null}
              </View>
              <View style={styles.checkBody}>
                <Text style={styles.checkTitle}>
                  {isEn
                    ? '(ii) Hang up and call the saved number back'
                    : '(ii) Mình cúp máy và gọi lại số đã lưu trong danh bạ'}
                </Text>
                <Text style={styles.checkDesc}>
                  {isEn
                    ? 'Open your contacts and call your child or grandchild at the saved number, or start a Zalo or FaceTime video call. Do not call back the number that just called you.'
                    : 'Mình mở danh bạ, gọi đúng số của con/cháu hoặc gọi video Zalo/FaceTime. Mình không gọi lại theo số vừa gọi đến nhé.'}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              {isEn
                ? 'By default the app sends only the alert type, time and related phone number. Call content is sent only after you agree to share it.'
                : 'Mặc định ứng dụng chỉ gửi loại cảnh báo, thời gian và số điện thoại liên quan. Nội dung cuộc gọi chỉ được gửi khi mình đã đồng ý chia sẻ.'}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onNotifyFamily}
            accessibilityRole="button"
            accessibilityLabel={
              isEn
                ? 'Send an SMS, Zalo or Telegram alert to family'
                : 'Gửi cảnh báo SMS, Zalo, Telegram cho con cháu'
            }
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>
              {isEn
                ? 'Alert family via SMS / Zalo / Telegram'
                : 'Báo cho con cháu qua SMS / Zalo / Telegram'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Close the safety pause' : 'Đóng khoảng dừng an toàn'}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>
              {isEn ? 'Close for now' : 'Mình đóng lại'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  stepTag: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#B45309',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: Fonts.heading,
  },
  amountText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#B91C1C',
  },
  callerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0F766E',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  breathStage: {
    width: 216,
    height: 216,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathHalo: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 8,
    borderColor: '#5EEAD4',
    backgroundColor: '#99F6E4',
  },
  timerCircle: {
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 9,
    borderColor: '#0B5D56',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 4,
  },
  timerText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#065F46',
    fontVariant: ['tabular-nums'],
    fontFamily: Fonts.mono,
    textAlign: 'center',
  },
  timerCaption: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
  },
  breathText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  restartButton: {
    minHeight: 56,
    minWidth: 220,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  restartText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  brainCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4338CA',
    padding: 18,
    gap: 6,
  },
  brainTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    color: '#312E81',
    fontFamily: Fonts.heading,
  },
  brainText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#3730A3',
  },
  lockCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#B91C1C',
    padding: 18,
    gap: 6,
  },
  lockTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    color: '#991B1B',
  },
  lockUntil: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  lockNote: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7F1D1D',
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 18,
    gap: 14,
  },
  checklistTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: Fonts.heading,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 56,
    paddingVertical: 6,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  checkBody: {
    flex: 1,
    gap: 4,
  },
  checkTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkDesc: {
    fontSize: 18,
    lineHeight: 26,
    color: '#475569',
  },
  safeWordBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0F766E',
    padding: 16,
    gap: 4,
  },
  safeWordLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#065F46',
  },
  safeWordValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#065F46',
  },
  safeWordAsk: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#065F46',
  },
  privacyNote: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
  },
  privacyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 19,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
