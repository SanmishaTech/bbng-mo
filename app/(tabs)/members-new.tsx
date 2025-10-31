import { MemberDirectoryCard } from '@/components/member/MemberDirectoryCard';
import { StoryAvatar } from '@/components/member/StoryAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMembers, Member } from '@/services/memberService';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembersTabScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // Load initial members
  useEffect(() => {
    loadAllMembers();
  }, []);

  const loadAllMembers = async () => {
    setLoading(true);
    try {
      // Load first 100 members for story strip and filtering
      const response = await getMembers(1, 100, '', 'memberName', 'asc', 'active');
      const memberData = response.data?.members || [];
      setAllMembers(memberData);
      setMembers(memberData);
      if (memberData.length > 0) {
        setSelectedMember(memberData[0]);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllMembers().finally(() => setRefreshing(false));
  }, []);

  // Filter members by search query and tag
  const filteredMembers = useMemo(() => {
    let result = allMembers;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) => {
        const searchText = [
          m.memberName,
          m.email,
          m.designation,
          m.organizationName,
          m.chapter?.name,
          ...(m.categories || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchText.includes(query);
      });
    }

    // Apply tag filter
    if (filterTag) {
      result = result.filter((m) => m.categories?.includes(filterTag));
    }

    return result;
  }, [allMembers, searchQuery, filterTag]);

  // Extract all unique tags/categories
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allMembers.forEach((m) => {
      m.categories?.forEach((cat) => tagSet.add(cat));
    });
    return Array.from(tagSet).sort();
  }, [allMembers]);

  const getMemberPhoto = (member: Member) => {
    if (member.picture1) return `${backendUrl}/${member.picture1}`;
    if (member.picture2) return `${backendUrl}/${member.picture2}`;
    if (member.picture3) return `${backendUrl}/${member.picture3}`;
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <View style={styles.topBarContent}>
          <ThemedText style={styles.brandText}>
            Connect<ThemedText style={{ color: colors.primary }}>Hub</ThemedText>
          </ThemedText>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search members, skills, city…"
              placeholderTextColor={colors.tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <ThemedText style={styles.clearIcon}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Story Strip */}
      <View style={styles.storyStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyStripContent}
        >
          {allMembers.slice(0, 20).map((member) => (
            <StoryAvatar
              key={member.id}
              member={{
                id: member.id.toString(),
                name: member.memberName,
                profilePicture: getMemberPhoto(member),
              }}
              selected={selectedMember?.id === member.id}
              onPress={() => {
                setSelectedMember(member);
                router.push('/member-profiles' as any);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Tag Filters */}
      <View style={styles.tagFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagFiltersContent}>
          <TouchableOpacity
            style={[
              styles.tagBadge,
              !filterTag && [styles.tagBadgeActive, { backgroundColor: colors.primary }],
              { borderColor: colors.border },
            ]}
            onPress={() => setFilterTag(null)}
          >
            <ThemedText style={[styles.tagText, !filterTag && styles.tagTextActive]}>All</ThemedText>
          </TouchableOpacity>

          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagBadge,
                filterTag === tag && [styles.tagBadgeActive, { backgroundColor: colors.primary }],
                { borderColor: colors.border },
              ]}
              onPress={() => setFilterTag(tag === filterTag ? null : tag)}
            >
              <ThemedText style={[styles.tagText, filterTag === tag && styles.tagTextActive]}>{tag}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.contentWrapper}>
          <ThemedText style={[styles.sectionLabel, { color: colors.tabIconDefault }]}>
            Members ({filteredMembers.length})
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <ThemedText style={styles.emptyIcon}>👥</ThemedText>
              <ThemedText style={styles.emptyTitle}>No members found</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                Try adjusting your search or filters
              </ThemedText>
            </View>
          ) : (
            <View style={styles.directory}>
              {filteredMembers.map((member) => (
                <MemberDirectoryCard
                  key={member.id}
                  member={{
                    id: member.id.toString(),
                    name: member.memberName,
                    designation: member.designation || 'Member',
                    location: member.chapter?.name || 'Location',
                    profilePicture: getMemberPhoto(member),
                    categories: member.categories || [],
                    businessGiven: 0,
                    businessReceived: 0,
                    visitors: 0,
                  }}
                  onPress={() => router.push(`/member-profiles/${member.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <ThemedText style={[styles.footerText, { color: colors.tabIconDefault }]}>
          Built with ❤️ • Insta‑style profiles • Mobile‑first • Great UX
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  topBarContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  storyStrip: {
    paddingVertical: 16,
  },
  storyStripContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  tagFilters: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tagFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagBadgeActive: {
    borderWidth: 0,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  contentWrapper: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  directory: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
