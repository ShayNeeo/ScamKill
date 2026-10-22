import * as React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CdnIconProps {
  /** Iconify CDN icon name, e.g. "lucide:shield-alert" or "ph:phone-incoming-bold" */
  icon: string;
  /** Native vector fallback for iOS/Android/Vitest */
  fallback?: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}

/**
 * CDN-Optimized Vector Icon (`iconify-icon` via jsDelivr + Cloudflare Iconify API on Web,
 * with `Ionicons` native vector fallback on iOS/Android and unit test environments).
 */
export function CdnIcon({
  icon,
  fallback = 'shield-checkmark-outline',
  size = 18,
  color = 'currentColor',
}: CdnIconProps): React.JSX.Element {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !('vitest' in globalThis)) {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {React.createElement('iconify-icon', {
          icon,
          width: String(size),
          height: String(size),
          style: { color, display: 'inline-flex', verticalAlign: 'middle' },
          'aria-hidden': 'true',
        })}
      </View>
    );
  }

  return <Ionicons name={fallback} size={size} color={color} />;
}

export default CdnIcon;
