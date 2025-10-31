import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

interface ActivityCardProps {
  member: any;
  index?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ member, index = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const getActivityIcon = (kind: string): { icon: any; color: string } => {
    switch (kind.toLowerCase()) {
      case 'given':
        return { icon: 'arrow.up.circle.fill' as const, color: '#F59E0B' };
      case 'received':
        return { icon: 'arrow.down.circle.fill' as const, color: '#10B981' };
      case 'meeting':
        return { icon: 'calendar.badge.clock' as const, color: '#8B5CF6' };
      default:
        return { icon: 'clock.fill' as const, color: '#06B6D4' };
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.card}>
        <Text style={styles.title}>Recent Activity</Text>
        
        <View style={styles.content}>
          {member.activity?.map((item: any, idx: number) => {
            const { icon, color } = getActivityIcon(item.kind);
            return (
              <ActivityItem key={idx} item={item} icon={icon} color={color} index={idx} />
            );
          })}
          
          {(!member.activity || member.activity.length === 0) && (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const ActivityItem = ({ item, icon, color, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.activityRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      
      <View style={styles.activityInfo}>
        <Text style={styles.activityLabel}>{item.label}</Text>
        <Text style={styles.activityMeta}>
          <Text style={styles.activityKind}>{item.kind}</Text>
          <Text style={styles.activityTime}> • {item.when} ago</Text>
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  content: {
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    gap: 4,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  activityMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  activityKind: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  activityTime: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
