import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getDefaultFamilySafeWord } from '@/api/scamkill/client';
import { Fonts } from '@/constants/theme';
import { useLanguageDialect } from '@/i18n/regional';

export interface SafeWordCardProps {
  safeWord: string;
  onChangeSafeWord: (next: string) => void;
  onOpenCoolingOff?: () => void;
}

export function SafeWordCard(props: SafeWordCardProps): React.JSX.Element {
  const { safeWord, onChangeSafeWord, onOpenCoolingOff } = props;
  const [dialect] = useLanguageDialect();
  const isEn = dialect === 'en';

  const [draft, setDraft] = React.useState(safeWord);
  const [savedFlash, setSavedFlash] = React.useState(false);

  React.useEffect(() => {
    setDraft(safeWord);
  }, [safeWord]);

  React.useEffect(() => {
    if (!savedFlash) return;
    const timer = setTimeout(() => setSavedFlash(false), 2500);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed !== safeWord;
  const rawWord = safeWord || getDefaultFamilySafeWord();
  const displayWord =
    isEn && rawWord === 'Cây khế ngọt' ? 'Sweet starfruit (Cây khế ngọt)' : rawWord;

  const handleSave = () => {
    if (!canSave) return;
    onChangeSafeWord(trimmed);
    setSavedFlash(true);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.whyTitle}>
        {isEn ? 'Family secret phrase' : 'Mã gia đình (Từ khóa bí mật)'}
      </Text>
      <Text style={styles.currentWord}>“{displayWord}”</Text>

      <Text style={styles.whyTitle}>
        {isEn ? 'Why does this stop AI voice cloning?' : 'Vì sao cách này chặn được giả giọng AI?'}
      </Text>
      <Text style={styles.whyText}>
        {isEn
          ? 'A scammer can copy a voice from a video or voice clip, but cannot know your family secret phrase. Just ask "What is our family code?" and listen to the answer. No anti-deepfake hardware, no complex audio analysis needed.'
          : 'Kẻ lừa đảo có thể sao chép giọng nói từ video/voice clip, nhưng không biết cụm từ bí mật của gia đình. Chỉ cần hỏi “Mã gia đình là gì?” và nghe câu trả lời, không cần phần cứng chống deepfake, không cần phân tích âm thanh phức tạp.'}
      </Text>

      <Text style={styles.inputLabel}>
        {isEn ? 'Change family code' : 'Đổi mã gia đình'}
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={isEn ? 'For example: Sweet starfruit' : 'Ví dụ: Cây khế ngọt'}
        placeholderTextColor="#64748B"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        style={styles.input}
        accessibilityLabel={isEn ? 'Enter a new family code' : 'Nhập mã gia đình mới'}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <Text style={styles.inputHint}>
        {isEn
          ? 'Pick a phrase your family remembers easily and outsiders cannot guess. For example: "Sweet starfruit", "Bitter melon", "Calico cat".'
          : 'Chọn cụm từ dễ nhớ với người thân, khó đoán với người ngoài. Ví dụ: “Cây khế ngọt”, “Mướp đắng”, “Con mèo tam thể”.'}
      </Text>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel={isEn ? 'Save family code' : 'Lưu mã gia đình'}
        accessibilityState={{ disabled: !canSave }}
        style={({ pressed }) => [
          styles.saveButton,
          !canSave && styles.disabledButton,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.saveButtonText}>
          {isEn ? 'Save family code' : 'Lưu mã gia đình'}
        </Text>
      </Pressable>
      {savedFlash ? (
        <Text style={styles.savedText} accessibilityRole="alert">
          {isEn ? '✓ New family code saved.' : '✓ Đã lưu mã gia đình mới.'}
        </Text>
      ) : null}

      {onOpenCoolingOff ? (
        <Pressable
          onPress={onOpenCoolingOff}
          accessibilityRole="button"
          accessibilityLabel={
            isEn
              ? 'Try the verification flow with a 60 second pause'
              : 'Thử quy trình xác minh với khoảng dừng 60 giây'
          }
          style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}>
          <Text style={styles.testButtonText}>
            {isEn
              ? '▶ Try the verification flow (60 second pause)'
              : '▶ Thử quy trình xác minh (Khoảng dừng 60 giây)'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0F766E',
    padding: 18,
    gap: 10,
  },
  eyebrow: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  currentWord: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    color: '#065F46',
  },
  whyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Fonts.heading,
  },
  whyText: {
    fontSize: 18,
    lineHeight: 27,
    color: '#334155',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  input: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputHint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  savedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15803D',
  },
  testButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  testButtonText: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
