import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTTS } from '@/hooks/use-tts';
import { useTheme } from '@/hooks/use-theme';
import { Accessibility } from '@/theme/tokens';
import { Spacing } from '@/constants/theme';

import { t } from '@/i18n';

import { useLanguageDialect } from '@/i18n/regional';

export interface AudioReadbackProps {
  text: string;
  label?: string;
  language?: string;
}

export function AudioReadback({ text, label, language }: AudioReadbackProps) {
  const [dialect] = useLanguageDialect();
  const targetLanguage = language || (dialect === 'en' ? 'en-US' : 'vi-VN');
  const { isSpeaking, speak, stop } = useTTS();
  const theme = useTheme();

  const displayLabel = label ?? t('audio.readForMe');

  const handlePress = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, targetLanguage);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isSpeaking ? theme.riskCautionBg : theme.surfaceElevated,
          borderColor: isSpeaking ? theme.riskCaution : theme.primaryAction,
        },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isSpeaking ? t('audio.stopReading') : `${t('audio.readAudio')}: ${displayLabel}`}
      accessibilityHint={t('audio.accessibilityHint')}>
      <Ionicons
        name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
        size={24}
        color={isSpeaking ? theme.riskCaution : theme.primaryAction}
      />
      <ThemedText
        style={[
          styles.label,
          { color: isSpeaking ? theme.riskCaution : theme.primaryAction, fontWeight: '700' },
        ]}>
        {isSpeaking ? t('audio.readingStatus') : displayLabel}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 2,
    minHeight: Accessibility.minTouchSize,
    marginVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: Accessibility.fontSize.normal,
  },
});
