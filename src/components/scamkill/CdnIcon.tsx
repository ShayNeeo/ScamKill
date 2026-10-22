import * as React from 'react';
import { Image, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CdnIconProps {
  /** Iconify CDN icon identifier, e.g. "lucide:shield-alert" */
  icon: string;
  /** Synchronous vector fallback for iOS/Android/offline/Vitest */
  fallback?: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}

/**
 * CDN-Optimized Vector Icon:
 * Fetches crisp SVG vectors directly from Cloudflare-backed Iconify Edge CDN
 * (`https://api.iconify.design/<prefix>/<name>.svg?color=...`) on Web,
 * with synchronous `Ionicons` vector rendering during load, offline, or on native iOS/Android.
 */
export function CdnIcon({
  icon,
  fallback = 'shield-checkmark-outline',
  size = 18,
  color = '#0B5D56',
}: CdnIconProps): React.JSX.Element {
  const [cdnFailed, setCdnFailed] = React.useState(false);

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !('vitest' in globalThis) &&
    !cdnFailed &&
    icon.includes(':')
  ) {
    const [prefix, name] = icon.split(':');
    const uri = `https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(color)}`;
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => setCdnFailed(true)}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    );
  }

  return <Ionicons name={fallback} size={size} color={color} />;
}

export default CdnIcon;
