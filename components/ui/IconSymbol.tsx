// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'book.closed': 'book',
  'plus': 'add',
  'ellipsis': 'more-horiz',
  'xmark': 'close',
  'square.grid.2x2.fill': 'apps',
  'person.circle.fill': 'person',
  'gearshape.fill': 'settings',
  'rectangle.portrait.and.arrow.right': 'logout',
  'questionmark.circle.fill': 'help',
  'info.circle.fill': 'info',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'clock.fill': 'schedule',
  'calendar': 'event',
  'safari.fill': 'explore',
  'bell.fill': 'notifications',
  'moon.fill': 'nightlight-round',
  'faceid': 'face',
  'lock.fill': 'lock',
  'shield.fill': 'security',
  'bell': 'notifications-none',
  'lock': 'lock-outline',
  'questionmark.circle': 'help-outline',
  'person.badge.plus': 'person-add',
  'checkmark.circle': 'check-circle',
  'person.2': 'people',
  'person.3': 'groups',
  'arrow.up.circle': 'arrow-upward',
  'arrow.down.circle': 'arrow-downward',
  'paperplane': 'send',
  'building.2': 'business',
  'checkmark': 'check',
  'hand.wave': 'waving-hand',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'minus': 'remove',
  'pencil': 'edit',
  'trash': 'delete',
  'envelope': 'email',
  'phone': 'phone',
  'location': 'place',
  'building': 'business',
  'person.badge.minus': 'person-remove',
  'exclamationmark.triangle': 'warning',
  'magnifyingglass': 'search',
  'arrow.clockwise': 'refresh',
  'doc.text': 'description',
  'person': 'person',
  'dollarsign.circle': 'monetization-on',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  if (!iconName) {
    console.warn(`Icon mapping not found for: ${name}`);
    return <MaterialIcons color={color} size={size} name="help-outline" style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
