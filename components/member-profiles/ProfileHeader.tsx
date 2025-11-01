import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMemberAvatar, getMemberCoverPhoto } from '@/utils/avatarUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ProfileHeaderProps {
  member: any;
  onBack?: () => void;
}

// Modern Stat Card Component
const ModernStatCard = ({ icon, label, value, color, index, colors }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 80,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      </View>
      <ThemedText style={[styles.statValue, { color: colors.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: colors.placeholder }]}>{label}</ThemedText>
    </Animated.View>
  );
};

// Action Button Component
const ActionButton = ({ icon, label, onPress, primary = false, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: 200 + index * 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          primary ? styles.primaryButton : styles.secondaryButton,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
        onPress={onPress}
      >
        {primary ? (
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <ThemedText style={styles.buttonIcon}>{icon}</ThemedText>
            <ThemedText style={styles.primaryButtonText} numberOfLines={1}>
              {label}
            </ThemedText>
          </LinearGradient>
        ) : (
          <View style={styles.secondaryButtonContent}>
            <ThemedText style={styles.buttonIcon}>{icon}</ThemedText>
            <ThemedText style={styles.secondaryButtonText} numberOfLines={1}>
              {label}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ member, onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const [headerHeight] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [slideUpAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerHeight, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const coverPhotoUrl = getMemberCoverPhoto(member, backendUrl);
  const avatarUrl = getMemberAvatar(member, backendUrl);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = [
    {
      icon: '💰',
      label: 'Business Given',
      value: `₹${member.businessGiven?.toLocaleString() || 0}`,
      color: '#10B981',
    },
    {
      icon: '💸',
      label: 'Business Received',
      value: `₹${member.businessReceived?.toLocaleString() || 0}`,
      color: '#8B5CF6',
    },
    {
      icon: '☕',
      label: 'One-to-Ones',
      value: member.oneToOnes || 0,
      color: '#F59E0B',
    },
    {
      icon: '⭐',
      label: 'Testimonials',
      value: member.testimonialsCount || member.testimonials?.length || 0,
      color: '#06B6D4',
    },
  ];

  const coverGradientColors =
    colorScheme === 'dark'
      ? ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.65)', colors.background]
      : ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)', colors.background];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cover Photo with Gradient Overlay */}
      <View style={styles.coverContainer}>
        <Image source={{ uri: coverPhotoUrl }} style={styles.coverImage} resizeMode="cover" />
        <LinearGradient colors={coverGradientColors} locations={[0, 0.7, 1]} style={styles.coverGradient} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        {/* Back Button */}
        {onBack && (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
            onPress={onBack}
          >
            <View style={styles.backButtonInner}>
              <ThemedText style={styles.backIcon}>×</ThemedText>
            </View>
          </Pressable>
        )}

        {/* Profile Info Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar with Ring */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED', '#6D28D9']} style={styles.avatarGradient}>
                <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
                </View>
              </LinearGradient>
            </View>

            {/* Status Indicator */}
            <View style={styles.statusDot} />
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            {/* Name and Handle */}
            <View style={styles.nameRow}>
              <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {member.name}
              </ThemedText>
              {member.handle && (
                <View style={styles.handleBadge}>
                  <ThemedText style={styles.handleText}>@{member.handle}</ThemedText>
                </View>
              )}
            </View>

            {/* Title and Location */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <ThemedText style={styles.metaIcon}>💼</ThemedText>
                <ThemedText style={[styles.metaText, { color: colors.placeholder }]} numberOfLines={1}>
                  {member.title}
                </ThemedText>
              </View>
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metaItem}>
                <ThemedText style={styles.metaIcon}>📍</ThemedText>
                <ThemedText style={[styles.metaText, { color: colors.placeholder }]} numberOfLines={1}>
                  {member.location}
                </ThemedText>
              </View>
            </View>

            {/* Bio */}
            {member.bio && (
              <View style={styles.bioContainer}>
                <ThemedText style={[styles.bio, { color: colors.placeholder }]} numberOfLines={3}>
                  {member.bio}
                </ThemedText>
              </View>
            )}

            {/* Tags */}
            {member.tags && member.tags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContainer}
              >
                {member.tags.map((tag: string, index: number) => (
                  <View key={`${tag}-${index}`} style={styles.tag}>
                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Action Buttons - Only show for non-admin users */}
            {user?.role !== 'admin' && (
              <View style={styles.actionsRow}>
                <ActionButton
                  icon="🤝"
                  label="Give Reference"
                  primary={true}
                  onPress={() => router.push('/references' as any)}
                  index={0}
                />
                <ActionButton
                  icon="☕"
                  label="Schedule 1:1"
                  primary={false}
                  onPress={() => router.push('/modules/onetoone' as any)}
                  index={1}
                />
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <ThemedText style={[styles.statsTitle, { color: colors.text }]}>Performance Overview</ThemedText>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <ModernStatCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                index={index}
                colors={colors}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  coverContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
    marginTop: 0,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    marginTop: -120,
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative',
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: -160,
    left: 20,
    zIndex: 20,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    bottom: 8,
    right: '50%',
    marginRight: -40,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  infoSection: {
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  handleBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  handleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  bioContainer: {
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  tagsContainer: {
    gap: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    borderRadius: 16,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    fontSize: 16,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  statsSection: {
    marginTop: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
