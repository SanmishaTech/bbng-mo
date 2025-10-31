import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface MemberDirectoryCardProps {
  member: {
    id: string;
    name: string;
    designation: string;
    location: string;
    profilePicture: string | null;
    categories: string[];
    businessGiven?: number;
    businessReceived?: number;
    visitors?: number;
  };
  onPress: () => void;
}

export const MemberDirectoryCard: React.FC<MemberDirectoryCardProps> = ({ member, onPress }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={[{backgroundColor: colors.card }]}>
        {/* Gradient Header */}
        <LinearGradient
          colors={['#34d399', '#22d3ee', '#818cf8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
              {member.profilePicture ? (
                <Image source={{ uri: member.profilePicture }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '40' }]}>
                  <ThemedText style={styles.initialsText}>{getInitials(member.name)}</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.nameContainer}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {member.name}
              </ThemedText>
              <ThemedText style={[styles.designation, { color: colors.tabIconDefault }]} numberOfLines={1}>
                {member.designation || 'Member'}
              </ThemedText>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.tagBadge, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <ThemedText style={[styles.tagText, { color: colors.tabIconDefault }]} numberOfLines={1}>
                📍 {member.location}
              </ThemedText>
            </View>
            {member.categories.slice(0, 2).map((category, index) => (
              <View
                key={index}
                style={[styles.tagBadge, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '15' }]}
              >
                <ThemedText style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>
                  {category}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{member.businessGiven || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Given</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{member.businessReceived || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Received</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{member.visitors || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Visitors</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  gradientHeader: {
    height: 80,
    width: '100%',
  },
  content: {
    padding: 12,
    marginTop: -32,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  designation: {
    fontSize: 11,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
