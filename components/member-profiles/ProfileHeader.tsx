import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMemberAvatar, getMemberCoverPhoto } from '@/utils/avatarUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { StatPill } from './StatPill';

interface ProfileHeaderProps {
  member: any;
  onBack?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ member, onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();

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
    <View style={[ { borderColor: colors.border }]}>
      {/* Cover Photo Background */}
      <Image
        source={{ uri: coverPhotoUrl }}
        style={styles.coverImage}
        resizeMode="cover"
      />
      
      {/* Multi-layer overlay for maximum text readability on any background */}
      <View style={styles.darkOverlay} />
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.9)']}
        locations={[0, 0.3, 1]}
        style={styles.gradientOverlay}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Back Button for Mobile */}
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <ThemedText style={styles.backIcon}>←</ThemedText>
          </TouchableOpacity>
        )}
        
        {/* Profile Info */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarRing, { backgroundColor: colors.background }]}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <ThemedText style={[styles.name, { color: '#ffffff' }]} numberOfLines={1}>{member.name}</ThemedText>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                <ThemedText style={styles.badgeText}>{member.handle}</ThemedText>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaIcon}>💼</ThemedText>
              <ThemedText style={styles.metaText} numberOfLines={1}>
                {member.title}
              </ThemedText>
              <ThemedText style={styles.metaDot}>•</ThemedText>
              <ThemedText style={styles.metaIcon}>📍</ThemedText>
              <ThemedText style={styles.metaText} numberOfLines={1}>
                {member.location}
              </ThemedText>
            </View>
            
            <ThemedText style={styles.bio} numberOfLines={2}>
              {member.bio}
            </ThemedText>
            
            {/* Tags */}
            <View style={styles.tagsRow}>
              {member.tags.map((tag: string) => (
                <View key={tag} style={[styles.tag, { borderColor: 'rgba(255, 255, 255, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <ThemedText style={styles.tagText}>{tag}</ThemedText>
                </View>
              ))}
            </View>
            
            {/* Action Buttons - Only show for non-admin users */}
            {user?.role !== 'admin' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
                  activeOpacity={0.8}
                  onPress={() => router.push('/references' as any)}
                >
                  <ThemedText style={styles.buttonIcon}>🤝</ThemedText>
                  <ThemedText style={styles.primaryButtonText} numberOfLines={1}>Give Reference</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.secondaryButton, { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.15)' }]} 
                  activeOpacity={0.8}
                  onPress={() => router.push('/modules/onetoone' as any)}
                >
                  <ThemedText style={styles.buttonIcon}>☕</ThemedText>
                  <ThemedText style={[styles.secondaryButtonText, { color: '#000000' }]} numberOfLines={1}>One-to-One</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Stats Pills */}
        <View style={styles.statsContainer}>
          <StatPill icon="💰" label="Business Given" value={member.businessGiven} />
          <StatPill icon="💰" label="Business Received" value={member.businessReceived} />
          <StatPill icon="☕" label="One-to-Ones" value={member.oneToOnes || 0} />
          <StatPill icon="💬" label="Testimonials" value={member.testimonialsCount || member.testimonials?.length || 0} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaDot: {
    fontSize: 12,
    marginHorizontal: 2,
    color: '#fff',
    opacity: 0.8,
  },
  bio: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 14,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
});
