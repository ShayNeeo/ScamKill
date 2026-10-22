/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#18181B', // Warm deep charcoal ink (contrast > 14:1 on warm paper)
    background: '#FAF6EE', // Warm rice-paper ground to eliminate cataract glare
    backgroundElement: '#F1EBDD', // Soft warm sand container
    backgroundSelected: '#E4DBC6',
    textSecondary: '#3F3F46', // Tinted warm slate (contrast > 7.5:1)

    primaryAction: '#0B5D56', // Deep Vietnamese Jade Shield
    primaryActionText: '#FAF6EE',
    surfaceCard: '#FFFDF9',
    surfaceElevated: '#F5EFE2',
    cardBorder: '#DFD6C3',

    riskSafe: '#15803D',
    riskCaution: '#B45309',
    riskHigh: '#B91C1C',
    riskInsufficient: '#334155',

    riskSafeBg: '#ECFDF5',
    riskCautionBg: '#FFFBEB',
    riskHighBg: '#FEF2F2',
    riskInsufficientBg: '#F1F5F9',
  },
  dark: {
    text: '#F5F2EB', // Warm ivory ink on calm night slate
    background: '#111615', // Deep calm jade-slate night ground
    backgroundElement: '#1A2220',
    backgroundSelected: '#263330',
    textSecondary: '#CBD5E1',

    primaryAction: '#2DD4BF', // Luminous jade-teal (> 8:1 on dark ground)
    primaryActionText: '#091210',
    surfaceCard: '#1A2220',
    surfaceElevated: '#24302D',
    cardBorder: '#2C3A37',

    riskSafe: '#4ADE80',
    riskCaution: '#FBBF24',
    riskHigh: '#F87171',
    riskInsufficient: '#94A3B8',

    riskSafeBg: '#143821',
    riskCautionBg: '#382A0C',
    riskHighBg: '#3B1E1E',
    riskInsufficientBg: '#334155',
  },
} as const;

export type ColorBlindnessMode =
  | 'standard'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'highContrast'
  | 'seniorYellowBlack';

export function getColorPalette(theme: 'light' | 'dark', mode: ColorBlindnessMode = 'standard') {
  const base = Colors[theme];
  if (mode === 'standard') return base;

  if (mode === 'protanopia') {
    // Red-blind: replace red with magenta/purple and high-contrast gold
    return {
      ...base,
      riskHigh: theme === 'dark' ? '#E879F9' : '#C026D3', // Magenta
      riskHighBg: theme === 'dark' ? '#3B0764' : '#FDF4FF',
      riskCaution: theme === 'dark' ? '#FACC15' : '#D97706',
      primaryAction: theme === 'dark' ? '#38BDF8' : '#0284C7',
    };
  }

  if (mode === 'deuteranopia') {
    // Green-blind: replace green with bright cyan/blue and orange for high risk
    return {
      ...base,
      riskSafe: theme === 'dark' ? '#38BDF8' : '#0284C7', // Cyan Blue
      riskSafeBg: theme === 'dark' ? '#0C4A6E' : '#F0F9FF',
      riskHigh: theme === 'dark' ? '#FB923C' : '#EA580C', // Warm Orange
      riskHighBg: theme === 'dark' ? '#431407' : '#FFF7ED',
    };
  }

  if (mode === 'tritanopia') {
    // Blue-blind: replace blue with deep teal/cyan, high risk teal-red
    return {
      ...base,
      primaryAction: theme === 'dark' ? '#2DD4BF' : '#0D9488', // Teal
      riskSafe: theme === 'dark' ? '#2DD4BF' : '#0D9488',
      riskSafeBg: theme === 'dark' ? '#042F2E' : '#F0FDFA',
      riskHigh: theme === 'dark' ? '#F43F5E' : '#E11D48', // Rose Red
    };
  }

  if (mode === 'highContrast') {
    // Maximum contrast for low vision
    return {
      ...base,
      background: theme === 'dark' ? '#000000' : '#FFFFFF',
      text: theme === 'dark' ? '#FFFFFF' : '#000000',
      textSecondary: theme === 'dark' ? '#E2E8F0' : '#1E293B',
      surfaceCard: theme === 'dark' ? '#121212' : '#F8FAFC',
      cardBorder: theme === 'dark' ? '#FFFFFF' : '#000000',
      primaryAction: '#0055FF',
      primaryActionText: '#FFFFFF',
      riskHigh: '#FF0000',
      riskCaution: '#D97706',
      riskSafe: '#008000',
    };
  }
  if (mode === 'seniorYellowBlack') {
    // Gold-on-Obsidian mode tailored for severe presbyopia / cataracts
    return {
      ...base,
      background: '#090A0B',
      backgroundElement: '#14171A',
      backgroundSelected: '#26292E',
      text: '#FFFFFF',
      textSecondary: '#FEF08A',
      surfaceCard: '#121417',
      surfaceElevated: '#1C1F24',
      cardBorder: '#FACC15',
      primaryAction: '#FACC15',
      primaryActionText: '#090A0B',
      riskHigh: '#FF4D4D',
      riskHighBg: '#3B0A0A',
      riskCaution: '#FACC15',
      riskCautionBg: '#332800',
      riskSafe: '#4ADE80',
      riskSafeBg: '#082E16',
      riskInsufficient: '#E2E8F0',
      riskInsufficientBg: '#1E293B',
    };
  }

  return base;
}

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** Bricolage Grotesque equivalent for headings on native */
    heading: 'ui-rounded',
    /** Atkinson Hyperlegible equivalent for display/body on native */
    display: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    heading: 'normal',
    display: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    heading: 'var(--font-heading)',
    display: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
