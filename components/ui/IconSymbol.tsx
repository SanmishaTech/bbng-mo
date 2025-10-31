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
  // Navigation & UI
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'arrow.backward': 'arrow-back',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'arrow.up.circle': 'arrow-upward',
  'arrow.down.circle': 'arrow-downward',
  'arrow.up.circle.fill': 'arrow-circle-up',
  'arrow.down.circle.fill': 'arrow-circle-down',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'arrow.clockwise': 'refresh',
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'ellipsis': 'more-horiz',
  
  // People & Communication
  'person': 'person',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'person.2': 'people',
  'person.2.fill': 'people',
  'person.3': 'groups',
  'person.3.fill': 'groups',
  'person.badge.plus': 'person-add',
  'person.badge.minus': 'person-remove',
  
  // Communication
  'envelope': 'email',
  'envelope.fill': 'email',
  'phone': 'phone',
  'phone.fill': 'phone',
  'paperplane': 'send',
  'paperplane.fill': 'send',
  'bell': 'notifications-none',
  'bell.fill': 'notifications',
  
  // Places & Objects
  'building': 'business',
  'building.2': 'business',
  'building.2.fill': 'business',
  'location': 'place',
  'map.fill': 'map',
  'globe': 'public',
  'mappin.and.ellipse': 'location-on',
  'book': 'menu-book',
  'book.fill': 'menu-book',
  'book.closed': 'book',
  'book.closed.fill': 'book',
  'calendar': 'event',
  'clock.fill': 'schedule',
  'tag': 'label-outline',
  'tag.fill': 'label',
  'shippingbox.fill': 'inventory-2',
  'message.fill': 'chat',
  
  // System & Settings
  'gearshape.fill': 'settings',
  'lock': 'lock-outline',
  'lock.fill': 'lock',
  'shield.fill': 'security',
  'slider.horizontal.3': 'tune',
  
  // Content & Media
  'doc.text': 'description',
  'magnifyingglass': 'search',
  'square.grid.2x2.fill': 'apps',
  'chart.bar.fill': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',
  
  // Symbols & Icons
  'questionmark.circle': 'help-outline',
  'questionmark.circle.fill': 'help',
  'info.circle': 'info-outline',
  'info.circle.fill': 'info',
  'exclamationmark.triangle': 'warning',
  
  // Actions
  'pencil': 'edit',
  'trash': 'delete',
  'rectangle.portrait.and.arrow.right': 'logout',
  
  // Special
  'chevron.left.forwardslash.chevron.right': 'code',
  'safari.fill': 'explore',
  'moon.fill': 'nightlight-round',
  'faceid': 'face',
  'hand.wave': 'waving-hand',
  'hand.raised.fill': 'front-hand',
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
