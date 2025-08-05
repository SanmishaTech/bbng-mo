import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'stat' | 'action';
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  subtitle,
  value,
  icon,
  iconColor,
  onPress,
  style,
  variant = 'default',
  children,
}: DashboardCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const CardComponent = onPress ? TouchableOpacity : View;

  const getCardStyle = () => {
    switch (variant) {
      case 'stat':
        return styles.statCard;
      case 'action':
        return styles.actionCard;
      default:
        return styles.defaultCard;
    }
  };

  return (
    <CardComponent
      style={[
        getCardStyle(),
        {
          backgroundColor: colors.card,
          shadowColor: colorScheme === 'dark' ? '#000' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: (iconColor || colors.primary) + '20',
            },
            variant === 'action' ? styles.actionIconContainer : {},
          ]}
        >
          <IconSymbol
            name={icon as any}
            size={variant === 'action' ? 24 : 18}
            color={iconColor || colors.primary}
          />
        </View>
      )}

      <View style={[styles.content, variant === 'action' ? styles.actionContent : {}]}>
        <ThemedText
          type={variant === 'action' ? 'defaultSemiBold' : 'default'}
          style={[styles.title, variant === 'action' ? styles.actionTitle : {}]}
        >
          {title}
        </ThemedText>

        {subtitle && (
          <ThemedText
            style={[styles.subtitle, { color: colors.placeholder }, variant === 'action' ? styles.actionSubtitle : {}]}
          >
            {subtitle}
          </ThemedText>
        )}

        {value !== undefined && (
          <ThemedText
            type="title"
            style={[styles.value, { color: colors.text }]}
          >
            {value}
          </ThemedText>
        )}

        {children}
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  defaultCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 0,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCard: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 0,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 4,
    opacity: 0.6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 0,
  },
  actionIconContainer: {
    marginRight: 0,
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
  },
});
