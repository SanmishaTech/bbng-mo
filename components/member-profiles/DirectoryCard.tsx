import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMemberAvatar, getMemberCoverPhoto } from '@/utils/avatarUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DirectoryCardProps {
  member: any;
  onPress: () => void;
}

export const DirectoryCard: React.FC<DirectoryCardProps> = ({ member, onPress }) => {
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

  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const coverPhotoUrl = getMemberCoverPhoto(member, backendUrl);
  const avatarUrl = getMemberAvatar(member, backendUrl);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Cover Photo Header */}
      <View style={styles.coverHeaderContainer}>
        <Image
          source={{ uri: coverPhotoUrl }}
          style={styles.coverHeader}
          resizeMode="cover"
        />
        {/* Multi-layer overlay for maximum text contrast on any background */}
        <View style={styles.coverOverlay} />
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.9)']} 
          locations={[0, 0.3, 1]}
          style={styles.coverGradient}
        />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarRing, { backgroundColor: colors.background }]}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          </View>
          
          <View style={styles.nameContainer}>
            <ThemedText style={[styles.name, { color: '#ffffff' }]} numberOfLines={1}>{member.name}</ThemedText>
            <ThemedText style={[styles.title, { color: colors.tabIconDefault }]} numberOfLines={1}>
              {member.title}
            </ThemedText>
          </View>
        </View>
        
        {/* Tags */}
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <ThemedText style={[styles.tagText, { color: colors.tabIconDefault }]} numberOfLines={1}>
              📍 {member.location}
            </ThemedText>
          </View>
          {member.tags.slice(0, 2).map((tag: string, index: number) => (
            <View key={index} style={[styles.tag, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '15' }]}>
              <ThemedText style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: '#ffffff' }]}>{member.businessGiven}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Given</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: '#ffffff' }]}>{member.businessReceived}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Received</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: '#ffffff' }]}>{member.visitors}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>Visitors</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  coverHeaderContainer: {
    height: 100,
    width: '100%',
    position: 'relative',
  },
  coverHeader: {
    height: 100,
    width: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 12,
    marginTop: -40,
    maxWidth: '100%',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    maxWidth: '100%',
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 11,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    maxWidth: '100%',
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    flexShrink: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
