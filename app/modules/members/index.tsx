import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { deleteMember, getMembers, Member } from '@/services/memberService';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembersListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading members with search:', debouncedSearchQuery, 'filter:', activeFilter, 'page:', currentPage);
      const response = await getMembers(currentPage, pageSize, debouncedSearchQuery, 'memberName', 'asc', activeFilter);
      console.log('Members API Response:', response);
      console.log('Members loaded successfully:', response.data?.members?.length || 0, 'members');
      setMembers(response.data?.members || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalMembers(response.data?.pagination?.totalItems || response.data?.members?.length || 0);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load members',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchQuery, activeFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMembers();
  }, [loadMembers]);

  const handleDelete = (id: number, name: string) => {
    setMemberToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    
    try {
      await deleteMember(memberToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Member deleted successfully',
      });
      setDeleteModalVisible(false);
      setMemberToDelete(null);
      loadMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to delete member',
      });
      setDeleteModalVisible(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setCurrentPage(1);
  };

  const getMembershipStatus = (date?: string) => {
    if (!date) return { label: 'No Membership', color: '#2196F3' };
    const now = new Date();
    const isActive = new Date(date) >= now;
    return isActive 
      ? { label: 'Active', color: colors.success }
      : { label: 'Expired', color: colors.error };
  };

  const SkeletonCard = () => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.skelRow}>
        <View
          style={[
            styles.skelBox,
            { width: 150, backgroundColor: colors.border },
          ]}
        />
        <View
          style={[
            styles.skelBox,
            { width: 80, backgroundColor: colors.border },
          ]}
        />
      </View>
      <View style={styles.skelRow}>
        <View
          style={[
            styles.skelBox,
            { width: 200, backgroundColor: colors.border },
          ]}
        />
      </View>
      <View style={[styles.skelActions]}>
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Members Found
      </ThemedText>
      <ThemedText style={[styles.emptyStateText, { color: colors.placeholder }]}>
        {searchQuery || activeFilter !== 'all' 
          ? 'No members match your current filters. Try adjusting your search.'
          : "You don't have any members yet. Add one to get started."}
      </ThemedText>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/members/add' as any)}
      >
        <ThemedText style={styles.createButtonText}>Add Member</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </ThemedText>
      <ThemedText style={[styles.emptyStateText, { color: colors.placeholder }]}>
        We couldn't load your members. Please try again.
      </ThemedText>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => loadMembers()}
      >
        <ThemedText style={styles.createButtonText}>Retry</ThemedText>
      </TouchableOpacity>
    </View>
  );

  function renderItem({ item }: { item: Member }) {
    const hoStatus = getMembershipStatus(item.hoExpiryDate);
    const venueStatus = getMembershipStatus(item.venueExpiryDate);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <ThemedText style={styles.memberIcon}>👤</ThemedText>
            <ThemedText style={[styles.memberName, { color: colors.text }]}>
              {item.memberName}
            </ThemedText>
          </View>
          <View
            style={[
              styles.userStatusBadge,
              {
                backgroundColor: item.isActive
                  ? '#4CAF50' + '20'
                  : '#F44336' + '20',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }]} />
            <ThemedText
              style={[
                styles.userStatusText,
                { color: item.isActive ? '#4CAF50' : '#F44336' },
              ]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoIcon}>📧</ThemedText>
            <ThemedText style={[styles.infoLabel, { color: colors.placeholder }]}>
              Email:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {item.email}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoIcon}>📱</ThemedText>
            <ThemedText style={[styles.infoLabel, { color: colors.placeholder }]}>
              Mobile:
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: colors.text }]}>
              {item.mobile1}
            </ThemedText>
          </View>

          {item.organizationName && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoIcon}>🏢</ThemedText>
              <ThemedText style={[styles.infoLabel, { color: colors.placeholder }]}>
                Organization:
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {item.organizationName}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Membership Status Badges Section */}
        <View style={styles.statusSection}>
          <ThemedText style={[styles.statusSectionTitle, { color: colors.text }]}>
            💳 Membership Status
          </ThemedText>
          <View style={styles.statusBadgesRow}>
            {/* HO Membership Status */}
            <View style={styles.statusBadgeContainer}>
              <ThemedText style={[styles.statusBadgeLabel, { color: colors.placeholder }]}>
                HO
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: hoStatus.color + '20' },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: hoStatus.color },
                  ]}
                >
                  {hoStatus.label}
                </ThemedText>
              </View>
            </View>

            {/* Venue Membership Status */}
            <View style={styles.statusBadgeContainer}>
              <ThemedText style={[styles.statusBadgeLabel, { color: colors.placeholder }]}>
                Venue
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: venueStatus.color + '20' },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: venueStatus.color },
                  ]}
                >
                  {venueStatus.label}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.tint + '20', borderColor: colors.tint, flex: 1.3 }]}
            onPress={() => router.push('/member-profiles' as any)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.profileBtnText, { color: colors.tint }]} numberOfLines={1}>👤 View Profile</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.membershipBtn, { backgroundColor: '#9C27B0' + '20', borderColor: '#9C27B0', flex: 1.3 }]}
            onPress={() => router.push(`/modules/memberships?memberId=${item.id}` as any)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.membershipBtnText, { color: '#9C27B0' }]} numberOfLines={1}>💳 Memberships</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={[styles.actionsRow, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => router.push(`/modules/members/${item.id}/edit` as any)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.primaryBtnText} numberOfLines={1}>✏️ Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostDangerBtn, { borderColor: '#F44336', flex: 1 }]}
            onPress={() => handleDelete(item.id, item.memberName)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.ghostDangerText} numberOfLines={1}>🗑️ Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const content = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return <ErrorState />;
    }

    return (
      <>
        <FlatList
          data={members}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: (Platform.OS === 'ios' ? 100 : 80) + insets.bottom },
            members.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={[styles.paginationContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.paginationBtn,
                { backgroundColor: currentPage === 1 ? colors.surface : colors.primary },
              ]}
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.paginationBtnText,
                  { color: currentPage === 1 ? colors.placeholder : colors.text },
                ]}
              >
                Previous
              </ThemedText>
            </TouchableOpacity>
            
            <View style={styles.paginationInfo}>
              <ThemedText style={[styles.paginationText, { color: colors.text }]}>
                Page {currentPage} of {totalPages}
              </ThemedText>
              <ThemedText style={[styles.paginationSubtext, { color: colors.placeholder }]}>
                {totalMembers} total
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.paginationBtn,
                { backgroundColor: currentPage === totalPages ? colors.border : colors.primary },
              ]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.paginationBtnText,
                  { color: currentPage === totalPages ? colors.placeholder : colors.text },
                ]}
              >
                Next
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  const backgroundColor = useThemeColor({}, 'background');

  const rightComponent = (
    <TouchableOpacity
      onPress={() => router.push('/modules/members/add' as any)}
      style={[styles.addButton, { backgroundColor: colors.primary }]}
    >
      <ThemedText style={styles.addButtonText}>Add</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Members"
        rightComponent={rightComponent}
        backPath="/(tabs)/_modules"
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
        {/* Search and Filter Bar */}
        <View style={styles.searchFilterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search members..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: showFilters ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                { color: showFilters ? 'white' : colors.text },
              ]}
            >
              {showFilters ? '✓' : '☰'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.filterLabel, { color: colors.text }]}>Status:</ThemedText>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={activeFilter}
                onValueChange={(value) => {
                  setActiveFilter(value);
                  setCurrentPage(1);
                }}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="All Members" value="all" />
                <Picker.Item label="Active Only" value="true" />
                <Picker.Item label="Inactive Only" value="false" />
              </Picker>
            </View>
            
            {(searchQuery || activeFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearFilterBtn, { backgroundColor: colors.surface }]}
                onPress={clearFilters}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.clearFilterText, { color: colors.text }]}>
                  Clear Filters
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {content()}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Delete Member
            </ThemedText>
            <ThemedText style={[styles.modalMessage, { color: colors.placeholder }]}>
              Are you sure you want to delete "{memberToDelete?.name}"? This action cannot be undone.
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setMemberToDelete(null);
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton, { backgroundColor: '#F44336' }]}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: 'white' }]}>
                  Delete
                </ThemedText>
              </TouchableOpacity>
            </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  filterContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterSection: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  clearFilterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFilterText: {
    fontWeight: '600',
    fontSize: 14,
  },
  clearFiltersBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearFiltersBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberIcon: {
    fontSize: 20,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 90,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  membershipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  statusSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadgeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  membershipStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  membershipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  membershipBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  profileBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  ghostDangerBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  ghostDangerText: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
    lineHeight: 22,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  // Skeleton styles
  skelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skelBox: {
    height: 16,
    borderRadius: 6,
  },
  skelActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  skelActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  paginationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paginationBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  paginationInfo: {
    flex: 1,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  paginationSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
});
