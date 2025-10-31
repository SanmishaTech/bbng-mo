import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface EnhancedStatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: string;
  iconColor?: string;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function EnhancedStatCard({
  title,
  value,
  previousValue,
  icon,
  iconColor,
  suffix = '',
  prefix = '',
  trend,
}: EnhancedStatCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const calculatePercentageChange = () => {
    if (!previousValue || previousValue === 0) return 0;
    return ((value - previousValue) / previousValue * 100).toFixed(1);
  };

  const percentageChange = calculatePercentageChange();
  const actualTrend = trend || (previousValue ? (value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral') : 'neutral');

  const getTrendColor = () => {
    switch (actualTrend) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const getTrendIcon = () => {
    switch (actualTrend) {
      case 'up':
        return 'arrow.up.right';
      case 'down':
        return 'arrow.down.right';
      default:
        return 'minus';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.primary) + '20' }]}>
          <IconSymbol
            name={icon as any}
            size={24}
            color={iconColor || colors.primary}
          />
        </View>
        {actualTrend !== 'neutral' && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
            <IconSymbol
              name={getTrendIcon() as any}
              size={14}
              color={getTrendColor()}
            />
            <ThemedText style={[styles.trendText, { color: getTrendColor() }]}>
              {Math.abs(Number(percentageChange))}%
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.placeholder }]}>{title}</ThemedText>
        <View style={styles.valueContainer}>
          <ThemedText style={[styles.value, { color: colors.text }]}>
            {prefix}
            {value.toLocaleString()}
            {suffix}
          </ThemedText>
        </View>
        {previousValue !== undefined && (
          <ThemedText style={[styles.comparison, { color: colors.placeholder }]}>
            vs. {prefix}{previousValue.toLocaleString()}{suffix} previous
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
  },
  comparison: {
    fontSize: 12,
    marginTop: 4,
  },
});
