import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ActivityCardProps {
  member: any;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ member }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBadgeColor = (kind: string) => {
    switch (kind) {
      case 'given':
        return { bg: colors.card, border: colors.border };
      case 'received':
        return { bg: colors.primary + '20', border: colors.primary };
      default:
        return { bg: colors.card, border: colors.border };
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.title}>Recent Activity</ThemedText>
      
      <View style={styles.content}>
        {member.activity?.map((item: any, index: number) => {
          const badgeColors = getBadgeColor(item.kind);
          return (
            <View key={index} style={styles.activityRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
                ]}
              >
                <ThemedText style={[styles.badgeText, { color: colors.text }]} numberOfLines={1}>
                  {item.kind}
                </ThemedText>
              </View>
              
              <View style={styles.activityInfo}>
                <ThemedText style={[styles.activityLabel, { color: colors.text }]}>
                  {item.label}
                </ThemedText>
                <ThemedText style={[styles.activityTime, { color: colors.tabIconDefault }]}>
                  {item.when} ago
                </ThemedText>
              </View>
            </View>
          );
        })}
        
        {(!member.activity || member.activity.length === 0) && (
          <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
            No recent activity
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  content: {
    gap: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    padding: 16,
  },
});
