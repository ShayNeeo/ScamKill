import { describe, expect, it } from 'vitest';
import { hapticSuccess, hapticTap, hapticWarning } from '@/lib/haptics';

describe('Senior Tactile Haptics (Expo SDK 57)', () => {
  it('executes hapticTap, hapticWarning, and hapticSuccess safely in test/web environments', async () => {
    await expect(hapticTap()).resolves.toBeUndefined();
    await expect(hapticWarning()).resolves.toBeUndefined();
    await expect(hapticSuccess()).resolves.toBeUndefined();
  });
});
