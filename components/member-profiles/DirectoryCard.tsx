import { getMemberAvatar, getMemberCoverPhoto } from '@/utils/avatarUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DirectoryCardProps {
  member: any;
  onPress: () => void;
  index?: number;
}

export const DirectoryCard: React.FC<DirectoryCardProps> = ({ member, onPress, index = 0 }) => {
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

  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const coverPhotoUrl = getMemberCoverPhoto(member, backendUrl);
  const avatarUrl = getMemberAvatar(member, backendUrl);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }
        ]}
        onPress={onPress}
      >
        {/* Cover Photo Header */}
        <View style={styles.coverHeaderContainer}>
          <Image
            source={{ uri: coverPhotoUrl }}
            style={styles.coverHeader}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.7)']} 
            style={styles.coverGradient}
          />
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.profileRow}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {member.title}
              </Text>
            </View>
          </View>
          
          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.locationTag}>
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {member.location}
              </Text>
            </View>
            {member.tags.slice(0, 2).map((tag: string, idx: number) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.businessGiven || 0}</Text>
              <Text style={styles.statLabel}>GIVEN</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.businessReceived || 0}</Text>
              <Text style={styles.statLabel}>RECEIVED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.visitors || 0}</Text>
              <Text style={styles.statLabel}>VISITORS</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
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
  coverHeaderContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  coverHeader: {
    height: 80,
    width: '100%',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
    marginTop: -32,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    padding: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locationTag: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  tag: {
    backgroundColor: '#8B5CF620',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
});
