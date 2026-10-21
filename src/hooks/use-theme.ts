import { useState, useEffect } from 'react';
import { getColorPalette, ColorBlindnessMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type SeniorFontScale = 'standard' | 'large' | 'extraLarge';
export type SeniorAppearanceOverride = 'system' | 'light' | 'dark' | 'highContrastSenior';

const FONT_SCALE_MULTIPLIER: Record<SeniorFontScale, number> = {
  standard: 1.0,
  large: 1.15,
  extraLarge: 1.3,
};

let currentMode: ColorBlindnessMode = 'standard';
let currentFontScale: SeniorFontScale = 'standard';
let currentAppearance: SeniorAppearanceOverride = 'light';

const modeListeners = new Set<(mode: ColorBlindnessMode) => void>();
const fontScaleListeners = new Set<(scale: SeniorFontScale) => void>();
const appearanceListeners = new Set<(appearance: SeniorAppearanceOverride) => void>();

export function getColorBlindnessMode(): ColorBlindnessMode {
  return currentMode;
}

export function setColorBlindnessMode(mode: ColorBlindnessMode) {
  currentMode = mode;
  modeListeners.forEach((l) => l(mode));
}

export function useColorBlindnessMode(): [ColorBlindnessMode, (mode: ColorBlindnessMode) => void] {
  const [mode, setMode] = useState<ColorBlindnessMode>(currentMode);

  useEffect(() => {
    const handler = (newMode: ColorBlindnessMode) => setMode(newMode);
    modeListeners.add(handler);
    return () => {
      modeListeners.delete(handler);
    };
  }, []);

  return [mode, setColorBlindnessMode];
}

export function getSeniorFontScale(): SeniorFontScale {
  return currentFontScale;
}

export function getSeniorFontScaleMultiplier(): number {
  return FONT_SCALE_MULTIPLIER[currentFontScale];
}

export function setSeniorFontScale(scale: SeniorFontScale) {
  currentFontScale = scale;
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--p-scale', String(FONT_SCALE_MULTIPLIER[scale]));
  }
  fontScaleListeners.forEach((l) => l(scale));
}

export function cycleSeniorFontScale(): SeniorFontScale {
  const next: SeniorFontScale =
    currentFontScale === 'standard'
      ? 'large'
      : currentFontScale === 'large'
        ? 'extraLarge'
        : 'standard';
  setSeniorFontScale(next);
  return next;
}

export function useSeniorFontScale(): [SeniorFontScale, (scale: SeniorFontScale) => void, number] {
  const [scale, setScale] = useState<SeniorFontScale>(currentFontScale);

  useEffect(() => {
    const handler = (next: SeniorFontScale) => setScale(next);
    fontScaleListeners.add(handler);
    return () => {
      fontScaleListeners.delete(handler);
    };
  }, []);

  return [scale, setSeniorFontScale, FONT_SCALE_MULTIPLIER[scale]];
}

export function getSeniorAppearance(): SeniorAppearanceOverride {
  return currentAppearance;
}

export function setSeniorAppearance(appearance: SeniorAppearanceOverride) {
  currentAppearance = appearance;
  if (appearance === 'highContrastSenior') {
    setColorBlindnessMode('seniorYellowBlack');
  } else if (currentMode === 'seniorYellowBlack') {
    setColorBlindnessMode('standard');
  }
  appearanceListeners.forEach((l) => l(appearance));
}

export function cycleSeniorAppearance(): SeniorAppearanceOverride {
  const next: SeniorAppearanceOverride =
    currentAppearance === 'light'
      ? 'dark'
      : currentAppearance === 'dark'
        ? 'highContrastSenior'
        : 'light';
  setSeniorAppearance(next);
  return next;
}

export function useSeniorAppearance(): [
  SeniorAppearanceOverride,
  (appearance: SeniorAppearanceOverride) => void,
] {
  const [appearance, setAppearance] = useState<SeniorAppearanceOverride>(currentAppearance);

  useEffect(() => {
    const handler = (next: SeniorAppearanceOverride) => setAppearance(next);
    appearanceListeners.add(handler);
    return () => {
      appearanceListeners.delete(handler);
    };
  }, []);

  return [appearance, setSeniorAppearance];
}

export function useTheme() {
  const scheme = useColorScheme();
  const [appearance] = useSeniorAppearance();
  const [cbMode] = useColorBlindnessMode();

  const resolvedScheme: 'light' | 'dark' =
    appearance === 'dark' || appearance === 'highContrastSenior'
      ? 'dark'
      : appearance === 'light'
        ? 'light'
        : scheme === 'unspecified'
          ? 'light'
          : scheme;

  const resolvedCbMode: ColorBlindnessMode =
    appearance === 'highContrastSenior' ? 'seniorYellowBlack' : cbMode;

  return getColorPalette(resolvedScheme, resolvedCbMode);
}
