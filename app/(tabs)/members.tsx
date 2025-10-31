import { ActivityCard } from '@/components/member-profiles/ActivityCard';
import { DirectoryCard } from '@/components/member-profiles/DirectoryCard';
import { InfoCard } from '@/components/member-profiles/InfoCard';
import { ProfileHeader } from '@/components/member-profiles/ProfileHeader';
import { TestimonialsCard } from '@/components/member-profiles/TestimonialsCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMemberActivitySummary, getMemberProfile, getMembers, getMemberTestimonials } from '@/services/memberService';
import { getCategories, Category } from '@/services/categoryService';
import { getSubCategories, SubCategory } from '@/services/subCategoryService';
import { getMemberAvatar, getMemberCoverPhoto, getTestimonialAvatar } from '@/utils/avatarUtils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembersTabScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Screen size state with dynamic updates
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'testimonials' | 'network'>('about');
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [subCategoryMap, setSubCategoryMap] = useState<Record<number, string>>({});

  // Calculate responsive values based on screen width
  const isTablet = screenWidth >= 768;
  
  // Always use single column layout
  const CONTAINER_PADDING = 32; // 16px on each side
  const cardWidth = screenWidth - CONTAINER_PADDING;

  // Pan responder for swipe down to close modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Close modal if swiped down more than 100px
        if (gestureState.dy > 100) {
          setMobilePanelOpen(false);
        }
      },
    })
  ).current;

  // Listen for screen size changes (orientation, window resize)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const [categoriesRes, subCategoriesRes] = await Promise.all([
        getCategories(1, 1000, '', 'name', 'asc'),
        getSubCategories(1, 1000, '', 'name', 'asc')
      ]);

      const catMap: Record<number, string> = {};
      const subCatMap: Record<number, string> = {};

      categoriesRes.data.categories.forEach((cat: Category) => {
        catMap[cat.id] = cat.name;
      });

      subCategoriesRes.data.categories.forEach((subCat: SubCategory) => {
        subCatMap[subCat.id] = subCat.name;
      });

      setCategoryMap(catMap);
      setSubCategoryMap(subCatMap);
      console.log('✅ Loaded', Object.keys(catMap).length, 'categories and', Object.keys(subCatMap).length, 'subcategories');
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    }
  }, []);

  const loadMembers = useCallback(async (searchTerm: string = '') => {
    try {
      setSearching(true);
      
      console.log('🔍 Searching API for:', searchTerm);
      const response = await getMembers(1, 100, searchTerm, 'memberName', 'asc', 'active');
      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const transformedMembers = (response.data?.members || []).map((m: any) => {
        // Resolve businessCategory ID to name
        const businessCategoryId = Number(m.businessCategory);
        const businessCategoryName = !isNaN(businessCategoryId) && categoryMap[businessCategoryId]
          ? categoryMap[businessCategoryId]
          : m.businessCategory;
        
        const memberData = {
          id: m.id.toString(),
          name: m.memberName || 'Unknown',
          handle: `@${(m.memberName || 'user').toLowerCase().replace(/\s+/g, '.')}`,
          title: m.category || businessCategoryName || 'Member',
          location: m.chapter?.name || m.location || 'Location',
          profilePicture: m.profilePicture,
          bio: m.organizationDescription || m.businessTagline || 'BBNG Member',
          tags: [
            m.category,
            businessCategoryName
          ].filter(Boolean),
          website: m.organizationWebsite || 'N/A',
          email: m.email || m.organizationEmail || 'N/A',
          phone: m.mobile1 || m.organizationMobileNo || 'N/A',
          organization: m.organizationName || '',
          businessGiven: 0,
          businessReceived: 0,
          referencesGiven: 0,
          referencesReceived: 0,
          oneToOnes: 0,
          testimonials: [],
          testimonialsCount: 0,
        };
        return {
          ...memberData,
          avatar: getMemberAvatar(memberData, backendUrl),
          coverPhoto: getMemberCoverPhoto(memberData, backendUrl),
        };
      });
      
      setMembers(transformedMembers);
      setHasSearched(true);
      console.log('✅ Loaded', transformedMembers.length, 'members');
      // DO NOT auto-select first member
    } catch (err) {
      console.error('❌ Error loading members:', err);
    } finally {
      setLoading(false);
      setSearching(false);
      setRefreshing(false);
    }
  }, [categoryMap]);

  // Call API only when there's a search query
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      loadMembers(debouncedSearchQuery);
    } else {
      // Clear members when search is cleared
      setMembers([]);
      setHasSearched(false);
    }
  }, [debouncedSearchQuery]);

  const onRefresh = useCallback(() => {
    if (debouncedSearchQuery.trim()) {
      setRefreshing(true);
      loadMembers(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  // Client-side filter for tags only (API handles search)
  const filteredMembers = useMemo(() => {
    if (!filterTag) return members;
    
    return members.filter((m) => m.tags.includes(filterTag));
  }, [members, filterTag]);

  // Get unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(members.flatMap((m) => m.tags))).sort();
  }, [members]);

  const handleSelectMember = async (member: any) => {
    setSelectedMember(member);
    
    // On mobile, open the modal
    if (!isTablet) {
      setMobilePanelOpen(true);
    }

    // Load full profile data
    try {
      const [profileData, statsData, testimonialsData] = await Promise.all([
        getMemberProfile(member.id),
        getMemberActivitySummary(member.id),
        getMemberTestimonials(member.id),
      ]);

      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const enrichedMember = {
        ...member,
        // Update with full profile data
        bio: profileData?.organizationDescription || profileData?.businessTagline || member.bio,
        website: profileData?.organizationWebsite || member.website,
        phone: profileData?.mobile1 || profileData?.organizationMobileNo || member.phone,
        email: profileData?.email || profileData?.organizationEmail || member.email,
        organization: profileData?.organizationName || member.organization,
        location: profileData?.chapter?.name || profileData?.location || member.location,
        // Activity summary stats (from actual API response structure)
        businessGiven: statsData?.businessGiven || 0,
        businessReceived: statsData?.businessReceived || 0,
        referencesGiven: statsData?.referencesGiven || 0,
        referencesReceived: statsData?.referencesReceived || 0,
        oneToOnes: statsData?.oneToOnes || 0,
        testimonialsCount: statsData?.testimonials || testimonialsData.length || 0,
        // Transform testimonials from actual API response
        testimonials: testimonialsData.map((t: any) => ({
          id: t.id,
          by: t.user?.name || 'Anonymous',
          avatar: getTestimonialAvatar(t.user),
          text: t.content || '',
          date: new Date(t.time).toLocaleDateString(),
        })),
      };

      setSelectedMember(enrichedMember);
      console.log('✅ Loaded member details:', enrichedMember);
    } catch (err) {
      console.error('Error loading member details:', err);
    }
  };



  // Initial state before search
  const renderInitialState = () => (
    <ScrollView 
      style={styles.initialStateScroll}
      contentContainerStyle={styles.initialState}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <ThemedText style={styles.searchIllustration}>👥</ThemedText>
        </View>
        <ThemedText style={styles.initialTitle}>Discover Members</ThemedText>
        <ThemedText style={[styles.initialSubtitle, { color: colors.tabIconDefault }]}>
          Connect with professionals in your network
        </ThemedText>
      </View>

      {/* Search Instructions Card */}
      <View style={[styles.instructionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.instructionHeader}>
          <ThemedText style={styles.instructionIcon}>🔍</ThemedText>
          <ThemedText style={styles.instructionTitle}>Start Searching</ThemedText>
        </View>
        <ThemedText style={[styles.instructionText, { color: colors.tabIconDefault }]}>
          Use the search bar above to find members by their name. Type a member's first name or last name to see matching results instantly.
        </ThemedText>
      </View>

      {/* Feature Cards */}
      <View style={styles.featuresGrid}>
        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
          <View style={[styles.featureIconBg, { backgroundColor: colors.primary + '15' }]}>
            <ThemedText style={styles.featureIcon}>💼</ThemedText>
          </View>
          <ThemedText style={styles.featureTitle}>Business Profiles</ThemedText>
          <ThemedText style={[styles.featureDesc, { color: colors.tabIconDefault }]}>
            View detailed member information and business details
          </ThemedText>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
          <View style={[styles.featureIconBg, { backgroundColor: colors.primary + '15' }]}>
            <ThemedText style={styles.featureIcon}>📊</ThemedText>
          </View>
          <ThemedText style={styles.featureTitle}>Activity Stats</ThemedText>
          <ThemedText style={[styles.featureDesc, { color: colors.tabIconDefault }]}>
            Track references, meetings, and business given
          </ThemedText>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
          <View style={[styles.featureIconBg, { backgroundColor: colors.primary + '15' }]}>
            <ThemedText style={styles.featureIcon}>⭐</ThemedText>
          </View>
          <ThemedText style={styles.featureTitle}>Testimonials</ThemedText>
          <ThemedText style={[styles.featureDesc, { color: colors.tabIconDefault }]}>
            Read reviews and recommendations
          </ThemedText>
        </View>

     
      </View>

      {/* Quick Tips */}
      <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ThemedText style={styles.tipsCardTitle}>💡 Quick Tips</ThemedText>
        <View style={styles.tipsList}>
          <View style={styles.tipRow}>
            <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
            <ThemedText style={[styles.tipRowText, { color: colors.tabIconDefault }]}>
              Search by typing a member's name
            </ThemedText>
          </View>
          
          <View style={styles.tipRow}>
            <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
            <ThemedText style={[styles.tipRowText, { color: colors.tabIconDefault }]}>
              Use business category filters to narrow results
            </ThemedText>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <ThemedText style={[styles.ctaText, { color: colors.tabIconDefault }]}>
          Ready to explore? Start typing a member's name above
        </ThemedText>
      </View>
    </ScrollView>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading members...</ThemedText>
      </ThemedView>
    );
  }

  // Profile Panel Component (used in both desktop and mobile)
  const ProfilePanel = ({ member }: { member: any }) => (
    <ScrollView style={styles.profilePanel} showsVerticalScrollIndicator={false}>
      <ProfileHeader member={member} onBack={isTablet ? undefined : () => setMobilePanelOpen(false)} />

      {/* Info and Activity Cards */}
      <View style={styles.cardsRow}>
        <View style={styles.cardColumn}>
          <InfoCard member={member} />
        </View>
        <View style={styles.cardColumn}>
          <ActivityCard member={member} />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'about' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('about')}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.tabText, activeTab === 'about' && { color: colors.primary, fontWeight: '700' }]}>
            About
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'testimonials' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('testimonials')}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.tabText, activeTab === 'testimonials' && { color: colors.primary, fontWeight: '700' }]}>
            Testimonials
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'network' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('network')}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.tabText, activeTab === 'network' && { color: colors.primary, fontWeight: '700' }]}>
            Network
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <View style={[styles.tabCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.tabCardTitle}>Profile Details</ThemedText>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Role</ThemedText>
                <ThemedText style={styles.detailValue}>{member.title}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Location</ThemedText>
                <ThemedText style={styles.detailValue}>{member.location}</ThemedText>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Business Given</ThemedText>
                <ThemedText style={styles.detailValue}>{member.businessGiven}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Business Received</ThemedText>
                <ThemedText style={styles.detailValue}>{member.businessReceived}</ThemedText>
              </View>
            </View>
            <View style={styles.detailItemFull}>
              <ThemedText style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Bio</ThemedText>
              <ThemedText style={styles.detailValue}>{member.bio}</ThemedText>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'testimonials' && <TestimonialsCard testimonials={member.testimonials} member={member} />}

      {activeTab === 'network' && (
        <View style={[styles.tabCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.tabCardTitle}>Network Insights</ThemedText>
          <View style={styles.insightsContent}>
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>References Given</ThemedText>
              <ThemedText style={styles.insightValue}>{member.referencesGiven || 0}</ThemedText>
            </View>
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>References Received</ThemedText>
              <ThemedText style={styles.insightValue}>{member.referencesReceived || 0}</ThemedText>
            </View>
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>One-to-Ones</ThemedText>
              <ThemedText style={styles.insightValue}>{member.oneToOnes || 0}</ThemedText>
            </View>
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>Total Testimonials</ThemedText>
              <ThemedText style={styles.insightValue}>{member.testimonialsCount || 0}</ThemedText>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header - No back button, simplified branding */}
      <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.topBarContent}>
          <ThemedText style={styles.brandText}>
            Connect<ThemedText style={[styles.brandAccent, { color: colors.primary }]}>Hub</ThemedText>
          </ThemedText>
        </View>
      </View>

      {/* Search and Tag Filters */}
      <View style={styles.searchFilterSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search members, skills, city…"
            placeholderTextColor={colors.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searching && searchQuery.length > 0 ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <ThemedText style={styles.clearIcon}>✕</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Tag Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterBadge,
              { backgroundColor: !filterTag ? colors.primary : colors.card, borderColor: colors.border },
            ]}
            onPress={() => setFilterTag(null)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.filterText, { color: !filterTag ? '#fff' : colors.text }]}>
              All
            </ThemedText>
          </TouchableOpacity>
          
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterBadge,
                {
                  backgroundColor: filterTag === tag ? colors.primary : colors.card,
                  borderColor: filterTag === tag ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilterTag(tag)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.filterText, { color: filterTag === tag ? '#fff' : colors.text }]}>
                {tag}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content - Split on Desktop, Full Width on Mobile */}
      <View style={[styles.mainContent, { flexDirection: isTablet ? 'row' : 'column' }]}>
        {/* Directory (Left on Desktop, Full on Mobile) */}
        <View style={isTablet ? styles.directoryColumn : styles.directoryFull}>
          {!hasSearched ? (
            renderInitialState()
          ) : (
            <>
              <ThemedText style={[styles.sectionLabel, { color: colors.tabIconDefault }]}>Members</ThemedText>
              <FlatList
            data={filteredMembers}
            renderItem={({ item }) => (
              <View style={{ width: cardWidth, marginBottom: 12 }}>
                <DirectoryCard member={item} onPress={() => handleSelectMember(item)} />
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.directoryContent, { paddingBottom: insets.bottom + 90 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
                <ThemedText style={styles.emptyTitle}>
                  {searchQuery ? 'No Results Found' : 'All Members'}
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
                  {searchQuery 
                    ? `No members match "${searchQuery}". Try a different search term.`
                    : 'Type in the search box to find members by name, skill, or location'}
                </ThemedText>
                {searchQuery && (
                  <TouchableOpacity
                    style={[styles.clearSearchBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setSearchQuery('')}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.clearSearchBtnText}>Clear Search</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
            </>
          )}
        </View>

        {/* Profile Panel (Right on Desktop, Hidden on Mobile) */}
        {isTablet && selectedMember && (
          <View style={styles.profileColumn}>
            <ProfilePanel member={selectedMember} />
          </View>
        )}
      </View>

      {/* Mobile Slide-Over Modal */}
      <Modal
        visible={mobilePanelOpen && !isTablet}
        animationType="slide"
        transparent
        onRequestClose={() => setMobilePanelOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            {/* Pull Handle with Swipe Gesture */}
            <View style={styles.modalHeader} {...panResponder.panHandlers}>
              <View style={[styles.pullHandle, { backgroundColor: colors.tabIconDefault + '40' }]} />
              <View style={styles.modalHeaderContent}>
                <ThemedText style={styles.modalTitle}>Profile</ThemedText>
                <TouchableOpacity onPress={() => setMobilePanelOpen(false)} activeOpacity={0.7}>
                  <ThemedText style={styles.closeIcon}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedMember && <ProfilePanel member={selectedMember} />}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topBarContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandAccent: {
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  searchFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  directoryColumn: {
    flex: 1,
  },
  directoryFull: {
    flex: 1,
  },
  profileColumn: {
    flex: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  directoryContent: {
    gap: 12,
  },
  initialStateScroll: {
    flex: 1,
  },
  initialState: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchIllustration: {
    fontSize: 48,
  },
  initialTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  initialSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  instructionIcon: {
    fontSize: 24,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  tipsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipRowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  clearSearchBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  clearSearchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  profilePanel: {
    flex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cardColumn: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  tabCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    gap: 4,
  },
  detailItemFull: {
    gap: 4,
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightsContent: {
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightLabel: {
    fontSize: 13,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pullHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
});
