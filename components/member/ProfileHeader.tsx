import { StatPill } from '@/components/member/StatPill';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MemberSocialProfile } from '@/types/member';
import { getMemberCoverPhoto } from '@/utils/avatarUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Dimensions, Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProfileHeaderProps {
  memberData: MemberSocialProfile | null;
  scrollY?: Animated.Value;
}

const { width } = Dimensions.get('window');

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ memberData, scrollY }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Parallax effect for cover photo
  const coverTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, -50],
        extrapolate: 'clamp',
      })
    : new Animated.Value(0);

  const coverScale = scrollY
    ? scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.3, 1],
        extrapolate: 'clamp',
      })
    : new Animated.Value(1);

  if (!memberData) return null;

  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const coverPhotoUrl = getMemberCoverPhoto(memberData, backendUrl);

  return (
    <View style={styles.container}>
      {/* Cover Photo with Parallax Effects */}
      <View style={[styles.coverContainer]}>
        <Animated.Image
          source={{ uri: coverPhotoUrl }}
          style={[
            styles.coverPhoto,
            {
              transform: [
                { translateY: coverTranslateY },
                { scale: coverScale },
              ],
            },
          ]}
          resizeMode="cover"
        />
        {/* Multi-layer overlay for maximum text readability on any background */}
        <View style={styles.darkOverlay} />
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.9)']}
          locations={[0, 0.3, 1]}
          style={styles.coverGradient}
        />
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Profile Picture - Overlapping cover */}
        <View style={[styles.profilePictureContainer, { borderColor: colors.card }]}>
          {memberData.profilePicture ? (
            <Image
              source={{ uri: memberData.profilePicture }}
              style={styles.profilePicture}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profilePictureFallback, { backgroundColor: colors.primary + '40' }]}>
              <ThemedText style={styles.initialsText}>
                {memberData.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Member Info */}
        <View style={styles.infoSection}>
          <ThemedText style={[styles.name, { color: '#ffffff' }]}>{memberData.name}</ThemedText>
          
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaIcon}>💼</ThemedText>
            <ThemedText style={[styles.designation, { color: colors.tabIconDefault }]}>
              {memberData.designation || 'Member'}
            </ThemedText>
          </View>
          
          {memberData.businessDetails.organizationName && (
            <View style={styles.metaRow}>
              <ThemedText style={styles.metaIcon}>🏢</ThemedText>
              <ThemedText style={[styles.organization, { color: colors.tabIconDefault }]}>
                {memberData.businessDetails.organizationName}
              </ThemedText>
            </View>
          )}

          {/* Quick Actions with Micro-interactions */}
          <View style={styles.actionsRow}>
            {memberData.phone ? (
              <AnimatedActionButton
                icon="📞"
                label="Call"
                onPress={() => Linking.openURL(`tel:${memberData.phone}`)}
                colors={colors}
              />
            ) : null}
            {memberData.email ? (
              <AnimatedActionButton
                icon="✉️"
                label="Email"
                onPress={() => Linking.openURL(`mailto:${memberData.email}`)}
                colors={colors}
              />
            ) : null}
            {memberData.businessDetails?.organizationWebsite && memberData.businessDetails.organizationWebsite !== 'N/A' ? (
              <AnimatedActionButton
                icon="🌐"
                label="Website"
                onPress={() => {
                  const url = memberData.businessDetails.organizationWebsite;
                  const formatted = url.startsWith('http') ? url : `https://${url}`;
                  Linking.openURL(formatted);
                }}
                colors={colors}
              />
            ) : null}
          </View>

        </View>

        {/* Stat Pills Row */}
        <View style={styles.statPillsRow}>
          <StatPill icon="🤝" label="Business Given" value={memberData.stats.totalReferences} />
          <StatPill icon="🤝" label="Buasiness Received" value={memberData.stats.totalReferences} />
          <StatPill icon="👥" label="Visitors" value={memberData.stats.totalVisitors} />
          <StatPill icon="💬" label="Testimonials" value={memberData.stats.totalTestimonials} />
        </View>

        {/* Stats Grid - Modern 4 column layout */}
        <View style={[styles.statsGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText style={styles.statIcon}>📅</ThemedText>
            </View>
            <ThemedText style={styles.statValue}>
              {memberData.stats.meetingAttendance}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              Attendance
            </ThemedText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={styles.statIcon}>🤝</ThemedText>
            </View>
            <ThemedText style={styles.statValue}>
              {memberData.stats.totalReferences}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              References
            </ThemedText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText style={styles.statIcon}>👥</ThemedText>
            </View>
            <ThemedText style={styles.statValue}>
              {memberData.stats.totalVisitors}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              Visitors
            </ThemedText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={styles.statIcon}>🎯</ThemedText>
            </View>
            <ThemedText style={styles.statValue}>
              {memberData.stats.totalDoneDeals}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.tabIconDefault }]}>
              Done Deals
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

// Animated Action Button Component with Micro-interactions
interface AnimatedActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
}

const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({ icon, label, onPress, colors }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.actionBtn,
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
            transform: [{ scale }],
          },
        ]}
      >
        <ThemedText style={styles.actionIcon}>{icon}</ThemedText>
        <ThemedText style={styles.actionText}>{label}</ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  coverContainer: {
    width: '100%',
    height: 210,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  profileCard: {
    marginTop: -60,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profilePictureContainer: {
    position: 'absolute',
    top: -60,
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePictureFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: '700',
  },
  infoSection: {
    marginTop: 68,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  designation: {
    fontSize: 14,
    fontWeight: '600',
  },
  organization: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 4,
  },
});
