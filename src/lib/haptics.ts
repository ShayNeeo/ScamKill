import type * as ExpoHaptics from 'expo-haptics';

/**
 * Cross-Platform Senior Tactile Haptics (Expo SDK 57 `expo-haptics` + Web Vibration API fallback)
 * Lazy-loads `expo-haptics` so Node/Vitest SSR environments without `globalThis.expo` never crash.
 * Reference: https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
 */

function safeVibrateWeb(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on browsers/contexts that block Vibration API
  }
}
// Platform-specific native module: static import crashes Node/Vitest because expo-modules-core reads globalThis.expo at evaluation time.
async function getExpoHaptics(): Promise<typeof ExpoHaptics | null> {
  if (typeof globalThis === 'undefined' || !('expo' in globalThis)) {
    return null;
  }
  try {
    return await import('expo-haptics');
  } catch {
    return null;
  }
}

/**
 * Tactile feedback for routine senior button presses (A+ font scale, theme switch, scenario chip).
 */
export async function hapticTap(): Promise<void> {
  try {
    const Haptics = await getExpoHaptics();
    if (Haptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
  } catch {
    // Fallback to Web Vibration API
  }
  safeVibrateWeb(18);
}

/**
 * Urgent double-pulse warning when a High-Risk/Caution call arrives or Cooling-Off pause opens.
 */
export async function hapticWarning(): Promise<void> {
  try {
    const Haptics = await getExpoHaptics();
    if (Haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
  } catch {
    // Fallback to Web Vibration API
  }
  safeVibrateWeb([80, 60, 120]);
}

/**
 * Reassuring confirmation pulse when a Family Alert is sent via SMS/Zalo/Telegram or Safe-Word is saved.
 */
export async function hapticSuccess(): Promise<void> {
  try {
    const Haptics = await getExpoHaptics();
    if (Haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
  } catch {
    // Fallback to Web Vibration API
  }
  safeVibrateWeb([35, 45, 55]);
}
