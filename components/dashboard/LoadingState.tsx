import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

function Skeleton({ width: skeletonWidth = '100%', height = 20, borderRadius = 4 }: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: skeletonWidth,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
      ]}
    />
  );
}

export function LoadingState() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const cardWidth = (width - 64) / 2; // Account for padding and spacing

  return (
    <ThemedView style={styles.container}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Skeleton width={120} height={16} />
            <View style={styles.spacing} />
            <Skeleton width={180} height={28} />
            <View style={styles.spacing} />
            <Skeleton width={200} height={14} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Actions Skeleton */}
        <Skeleton width={140} height={24} />
        <View style={styles.sectionSpacing} />
        
        <View style={styles.grid}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: cardWidth,
                },
              ]}
            >
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={styles.spacing} />
              <Skeleton width={100} height={16} />
              <View style={styles.smallSpacing} />
              <Skeleton width={80} height={12} />
            </View>
          ))}
        </View>

        {/* Stats Section Skeleton */}
        <Skeleton width={160} height={24} />
        <View style={styles.sectionSpacing} />
        
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  width: cardWidth,
                },
              ]}
            >
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.statContent}>
                <Skeleton width={60} height={24} />
                <View style={styles.smallSpacing} />
                <Skeleton width={80} height={12} />
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity Skeleton */}
        <Skeleton width={140} height={24} />
        <View style={styles.sectionSpacing} />
        
        {[1, 2].map((item) => (
          <View
            key={item}
            style={[
              styles.activityCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.activityContent}>
              <Skeleton width={200} height={16} />
              <View style={styles.smallSpacing} />
              <Skeleton width={100} height={12} />
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeleton: {
    opacity: 0.3,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  spacing: {
    height: 8,
  },
  smallSpacing: {
    height: 4,
  },
  sectionSpacing: {
    height: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  statCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
});
