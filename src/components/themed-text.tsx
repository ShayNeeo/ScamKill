import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useSeniorFontScale, useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const [, , multiplier] = useSeniorFontScale();

  const flattened = StyleSheet.flatten([
    type === 'default' && styles.default,
    type === 'title' && styles.title,
    type === 'small' && styles.small,
    type === 'smallBold' && styles.smallBold,
    type === 'subtitle' && styles.subtitle,
    type === 'link' && styles.link,
    type === 'linkPrimary' && styles.linkPrimary,
    type === 'code' && styles.code,
    style,
  ]) as TextStyle | undefined;

  const scaledStyle: TextStyle | undefined =
    multiplier !== 1 && flattened
      ? {
          fontSize: Math.round((flattened.fontSize ?? 16) * multiplier),
          lineHeight: flattened.lineHeight
            ? Math.round(flattened.lineHeight * multiplier)
            : undefined,
        }
      : undefined;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'], fontFamily: Fonts.sans },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primaryAction }],
        type === 'code' && styles.code,
        style,
        scaledStyle,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 700,
  },
  default: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: 500,
  },
  title: {
    fontSize: 38,
    fontWeight: 800,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: 700,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0B5D56',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 600,
    fontSize: 15,
  },
});
