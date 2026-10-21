import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getDefaultFamilySafeWord } from '@/api/scamkill/client';

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

function formatUntil(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function breathingCue(elapsed: number): string {
  const phase = elapsed % 20;
  if (phase < 7) return 'Hít vào chậm qua mũi… (4 giây)';
  if (phase < 12) return 'Giữ hơi thở… (2 giây)';
  return 'Thở ra chậm bằng miệng… (6 giây)';
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

  const safeWord = familySafeWord || getDefaultFamilySafeWord();
  const [secondsLeft, setSecondsLeft] = React.useState(COOLING_OFF_SECONDS);
  const [lockUntil, setLockUntil] = React.useState(0);
  const [askedSafeWord, setAskedSafeWord] = React.useState(false);
  const [calledBack, setCalledBack] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.stepTag}>Bước 2: Làm chậm (Khoảng dừng an toàn)</Text>
            <Text style={styles.title}>
              {title || 'Khoan chuyển tiền! Hãy dừng lại 60 giây…'}
            </Text>
            {amountOrRiskText ? (
              <Text style={styles.amountText}>{amountOrRiskText}</Text>
            ) : null}
            {callerNumber ? (
              <Text style={styles.callerText}>Số đang gọi: {callerNumber}</Text>
            ) : null}
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerCircle} accessibilityRole="timer">
              <Text style={styles.timerText}>
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                {String(secondsLeft % 60).padStart(2, '0')}
              </Text>
              <Text style={styles.timerCaption}>giây dừng an toàn</Text>
            </View>
            <Text style={styles.breathText}>
              {finished ? 'Đã hết 60 giây. Vẫn phải làm đủ 2 bước xác minh bên dưới.' : breathingCue(elapsed)}
            </Text>
            {finished ? (
              <Pressable
                onPress={() => setSecondsLeft(COOLING_OFF_SECONDS)}
                accessibilityRole="button"
                accessibilityLabel="Bắt đầu lại 60 giây khoảng dừng an toàn"
                style={({ pressed }) => [styles.restartButton, pressed && styles.pressed]}>
                <Text style={styles.restartText}>↻ Bắt đầu lại 60 giây</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.lockCard}>
            <Text style={styles.lockTitle}>🔒 Khoá bảo vệ giao dịch nguy cơ cao · 48 giờ</Text>
            <Text style={styles.lockUntil}>
              Hiệu lực đến: {lockUntil ? formatUntil(lockUntil) : '—'}
            </Text>
            <Text style={styles.lockNote}>
              Trong bản MVP, đây là trạng thái nhắc nhở và theo dõi trong ứng dụng — không khoá
              tài khoản ngân hàng thật của bạn.
            </Text>
          </View>

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Xác minh giả giọng người thân — 2 bước</Text>

            <Pressable
              onPress={() => setAskedSafeWord((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: askedSafeWord }}
              accessibilityLabel='Bước 1: Hỏi "Mã gia đình"'
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, askedSafeWord && styles.checkboxChecked]}>
                {askedSafeWord ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <View style={styles.checkBody}>
                <Text style={styles.checkTitle}>(i) Hỏi “Mã gia đình”</Text>
                <Text style={styles.checkDesc}>
                  Người thân thật sẽ trả lời đúng cụm từ bí mật. Giọng AI có thể bắt chước, nhưng
                  không biết cụm từ này.
                </Text>
              </View>
            </Pressable>

            <View style={styles.safeWordBox}>
              <Text style={styles.safeWordLabel}>Mã gia đình của bạn</Text>
              <Text style={styles.safeWordValue}>“{safeWord}”</Text>
              <Text style={styles.safeWordAsk}>Hỏi ngay: “Mã gia đình của mình là gì?”</Text>
            </View>

            <Pressable
              onPress={() => setCalledBack((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: calledBack }}
              accessibilityLabel="Bước 2: Cúp máy và gọi lại theo số đã lưu trong danh bạ"
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, calledBack && styles.checkboxChecked]}>
                {calledBack ? <Text style={styles.checkTick}>✓</Text> : null}
              </View>
              <View style={styles.checkBody}>
                <Text style={styles.checkTitle}>
                  (ii) Cúp máy và gọi lại theo số đã lưu trong danh bạ
                </Text>
                <Text style={styles.checkDesc}>
                  Mở danh bạ và gọi đúng số của con/cháu, hoặc gọi video qua Zalo/FaceTime. Không
                  gọi lại theo số vừa gọi đến.
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              Mặc định cảnh báo chỉ gửi loại cảnh báo, thời điểm và số điện thoại liên quan. Nội
              dung cuộc gọi chỉ được gửi khi bạn đã đồng ý chia sẻ.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onNotifyFamily}
            accessibilityRole="button"
            accessibilityLabel="Gửi cảnh báo SMS, Zalo, Telegram cho con cháu"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>
              📨 Gửi cảnh báo SMS / Zalo / Telegram cho con cháu
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng khoảng dừng an toàn"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Đóng</Text>
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
  timerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 10,
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#065F46',
    fontVariant: ['tabular-nums'],
  },
  timerCaption: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
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
  checkTick: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
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
