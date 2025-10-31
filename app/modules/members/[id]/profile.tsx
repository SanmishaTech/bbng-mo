import { NavigationHeader } from '@/components/NavigationHeader';
import { InfoSection } from '@/components/member/InfoSection';
import { ProfileHeader } from '@/components/member/ProfileHeader';
import { TestimonialPost } from '@/components/member/TestimonialPost';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMemberProfile, getMemberActivitySummary, getMemberTestimonials } from '@/services/memberService';
import { MemberSocialProfile, Testimonial } from '@/types/member';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MemberProfileScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [memberData, setMemberData] = useState<MemberSocialProfile | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'testimonials'>('about');
  
  // Dynamic back path based on where user came from
  const backPath = from === 'tab' ? '/(tabs)/members' : '/modules/members';
  
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const getBestMemberPhoto = (member: any): string | null => {
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    if (member.picture1) return `${backendUrl}/${member.picture1}`;
    if (member.picture2) return `${backendUrl}/${member.picture2}`;
    if (member.picture3) return `${backendUrl}/${member.picture3}`;
    return null;
  };

  const transformMemberData = (member: any, activitySummary: any): MemberSocialProfile => {
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Use activity summary data preferentially
    const attendedMeetings = activitySummary?.attendedMeetings || member.meetingsAttended || 0;
    const totalMeetings = activitySummary?.totalMeetings || member.totalMeetings || 0;
    const meetingPercentage = activitySummary?.meetingAttendance || 
      (totalMeetings > 0 ? Math.round((attendedMeetings / totalMeetings) * 100) : 0);
    
    return {
      id: member.id?.toString() || '',
      name: member.memberName || 'Unknown',
      profilePicture: getBestMemberPhoto(member),
      coverPhoto: member.coverPhoto ? `${backendUrl}/${member.coverPhoto}` : null,
      email: member.email || '',
      phone: member.mobile1 || '',
      designation: member.businessCategory || member.category || '',
      department: member.category || '',
      joinDate: member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
      skills: member.specificGive ? member.specificGive.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      meetingsAttended: attendedMeetings,
      totalMeetings: totalMeetings,
      projects: [
        {
          name: member.organizationName || 'N/A',
          role: member.businessTagline || 'N/A',
          status: 'Active',
        },
      ],
      achievements: member.specificAsk ? member.specificAsk.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      lastActive: member.user?.lastLogin ? new Date(member.user.lastLogin).toLocaleDateString() : 'Never',
      businessDetails: {
        gstNo: member.gstNo || 'N/A',
        organizationName: member.organizationName || 'N/A',
        organizationEmail: member.organizationEmail || member.email || 'N/A',
        organizationPhone: member.organizationMobileNo || member.mobile1 || 'N/A',
        organizationLandline: member.organizationLandlineNo || 'N/A',
        organizationWebsite: member.organizationWebsite || 'N/A',
        organizationAddress: [
          member.orgAddressLine1,
          member.orgAddressLine2,
          member.orgLocation,
          member.orgPincode,
        ]
          .filter(Boolean)
          .join(', ') || 'N/A',
        organizationDescription: member.organizationDescription || 'No description available',
      },
      personalDetails: {
        gender: member.gender || 'Not specified',
        dob: member.dob ? new Date(member.dob).toLocaleDateString() : 'Not specified',
        address: [member.addressLine1, member.addressLine2, member.location, member.pincode]
          .filter(Boolean)
          .join(', ') || 'N/A',
      },
      stats: {
        totalVisitors: activitySummary?.totalVisitors || 0,
        totalReferences: activitySummary?.totalReferences || activitySummary?.givenReferences || 0,
        totalTestimonials: activitySummary?.totalTestimonials || 0,
        totalDoneDeals: activitySummary?.totalDoneDeals || 0,
        meetingAttendance: `${meetingPercentage}%`,
      },
    };
  };

  const calculateAttendance = (attended: number, total: number): string => {
    if (!total || total === 0) return '0%';
    const percentage = Math.round((attended / total) * 100);
    return `${percentage}%`;
  };

  const loadMemberData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch member profile and stats in parallel
      const [profileData, statsData, testimonialsData] = await Promise.all([
        getMemberProfile(id),
        getMemberActivitySummary(id),
        getMemberTestimonials(id),
      ]);

      const transformedData = transformMemberData(profileData, statsData);
      setMemberData(transformedData);

      // Transform testimonials
      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const formattedTestimonials: Testimonial[] = testimonialsData.map((t: any) => ({
        id: t.id,
        content: t.content || t.message || '',
        giverName: t.giverName || 'Anonymous',
        giverProfilePicture: t.giverProfilePicture
          ? t.giverProfilePicture.startsWith('http')
            ? t.giverProfilePicture
            : `${backendUrl}/${t.giverProfilePicture}`
          : null,
        giverOrganization: t.giverOrganization || '',
        createdAt: t.time || t.createdAt || new Date().toISOString(),
        rating: t.rating,
      }));

      setTestimonials(formattedTestimonials);
    } catch (err: any) {
      console.error('Error loading member profile:', err);
      setError(err.message || 'Failed to load member profile');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load member profile',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMemberData();
  }, [id]);

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <NavigationHeader title="Member Profile" backPath={backPath} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !memberData) {
    return (
      <ThemedView style={styles.centered}>
        <NavigationHeader title="Member Profile" backPath={backPath} />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorTitle}>Member Not Found</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.tabIconDefault }]}>
            {error || "Sorry, we couldn't find the member you're looking for."}
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(backPath as any)}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.backButtonText}>Back to Members</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const scrollToSection = (section: 'about' | 'testimonials') => {
    setActiveTab(section);
    if (section === 'testimonials' && testimonials.length > 0) {
      // Scroll to first testimonial
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    } else {
      // Scroll to top
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader title="Member Profile" backPath={backPath} />
      
      <FlatList
        ref={flatListRef}
        data={testimonials}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View>
            <ProfileHeader memberData={memberData} scrollY={scrollY} />
            
            {/* Sticky Segmented Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'about' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => scrollToSection('about')}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.tabText,
                  activeTab === 'about' && [styles.activeTabText, { color: colors.primary }]
                ]}>
                  About
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'testimonials' && [styles.activeTab, { borderBottomColor: colors.primary }]
                ]}
                onPress={() => scrollToSection('testimonials')}
                activeOpacity={0.7}
              >
                <View style={styles.tabWithBadge}>
                  <ThemedText style={[
                    styles.tabText,
                    activeTab === 'testimonials' && [styles.activeTabText, { color: colors.primary }]
                  ]}>
                    Testimonials
                  </ThemedText>
                  {testimonials.length > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                      <ThemedText style={styles.tabBadgeText}>{testimonials.length}</ThemedText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.leftColumn}>
                <InfoSection memberData={memberData} />
              </View>

              {testimonials.length > 0 && (
                <View style={styles.rightColumn}>
                  <View style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}>
                    <ThemedText style={styles.sectionTitle}>💬 Testimonials</ThemedText>
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <ThemedText style={styles.badgeText}>{testimonials.length}</ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {testimonials.length === 0 && (
              <View style={[
                styles.emptyTestimonials,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}>
                <ThemedText style={styles.emptyIcon}>💬</ThemedText>
                <ThemedText style={styles.emptyText}>No testimonials yet</ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  This member hasn't received any testimonials
                </ThemedText>
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => <TestimonialPost testimonial={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTestimonials: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.6,
  },
  activeTabText: {
    fontWeight: '700',
    opacity: 1,
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
