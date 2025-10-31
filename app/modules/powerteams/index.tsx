import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { getPowerTeams, deletePowerTeam, PowerTeam, CategorySummary } from '@/services/powerTeamService';

export default function PowerTeamsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();

  const [powerTeams, setPowerTeams] = useState<PowerTeam[]>([]);
  const [filteredPowerTeams, setFilteredPowerTeams] = useState<PowerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [powerTeamToDelete, setPowerTeamToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const limit = 10;

  // Load power teams
  const loadPowerTeams = async (pageNum: number = 1, isRefreshing: boolean = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getPowerTeams({ page: pageNum, limit });
      setPowerTeams(response.powerTeams || []);
      setTotalPages(response.totalPages || 1);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading power teams:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load power teams',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    loadPowerTeams(1);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter power teams based on search
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setFilteredPowerTeams(powerTeams);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = powerTeams.filter((pt) => {
      const nameMatch = pt.name?.toLowerCase().includes(query);
      const categoryMatch = pt.categories?.some(cat => 
        cat.name?.toLowerCase().includes(query)
      );
      const subCategoryMatch = pt.subCategories?.some(sub => 
        sub.name?.toLowerCase().includes(query)
      );
      return nameMatch || categoryMatch || subCategoryMatch;
    });

    setFilteredPowerTeams(filtered);
  }, [powerTeams, debouncedSearchQuery]);

  // Handle refresh
  const handleRefresh = () => {
    loadPowerTeams(1, true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!powerTeamToDelete) return;

    try {
      await deletePowerTeam(powerTeamToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Power team deleted successfully',
      });
      setDeleteModalVisible(false);
      setPowerTeamToDelete(null);
      loadPowerTeams(page);
    } catch (error: any) {
      console.error('Error deleting power team:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete power team',
      });
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (pt: { id: number; name: string }) => {
    setPowerTeamToDelete(pt);
    setDeleteModalVisible(true);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Format categories
  const formatCategories = (categories: CategorySummary[], subCategories?: any[]) => {
    if (!categories || categories.length === 0) return 'No categories';
    const catText = categories.map(cat => cat.name).join(', ');
    if (subCategories && subCategories.length > 0) {
      return `${catText} (${subCategories.length} subcategories)`;
    }
    return catText;
  };

  // Render power team item
  const renderPowerTeamItem = ({ item }: { item: PowerTeam }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.powerTeamIcon}>👥</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.cardId, { color: colors.placeholder }]}>ID: #{item.id}</Text>
          </View>
        </View>
      </View>

      {(item.categories && item.categories.length > 0) && (
        <View style={styles.categoriesSection}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>🏷️</Text>
            <Text style={[styles.categoryLabel, { color: colors.placeholder }]}>Categories:</Text>
          </View>
          <View style={styles.categoryBadges}>
            {item.categories.slice(0, 3).map((cat, index) => (
              <View key={index} style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.primary }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </View>
            ))}
            {item.categories.length > 3 && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.placeholder }]}>
                  +{item.categories.length - 3}
                </Text>
              </View>
            )}
          </View>
          {item.subCategories && item.subCategories.length > 0 && (
            <Text style={[styles.subCategoryText, { color: colors.placeholder }]}>
              📋 {item.subCategories.length} subcategories
            </Text>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/modules/powerteams/${item.id}/edit` as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryBtnText} numberOfLines={1}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ghostDangerBtn}
          onPress={() => openDeleteConfirmation({ id: item.id, name: item.name })}
          activeOpacity={0.7}
        >
          <Text style={styles.ghostDangerText} numberOfLines={1}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.placeholder }]}>
        No power teams found
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/powerteams/add' as any)}
      >
        <Text style={styles.emptyButtonText}>Create First Power Team</Text>
      </TouchableOpacity>
    </View>
  );

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            { backgroundColor: page === 1 ? colors.border : colors.primary },
          ]}
          onPress={() => page > 1 && loadPowerTeams(page - 1)}
          disabled={page === 1}
        >
          <Text
            style={[
              styles.paginationButtonText,
              { color: page === 1 ? colors.placeholder : 'white' },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={[styles.paginationText, { color: colors.text }]}>
          Page {page} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            { backgroundColor: page === totalPages ? colors.border : colors.primary },
          ]}
          onPress={() => page < totalPages && loadPowerTeams(page + 1)}
          disabled={page === totalPages}
        >
          <Text
            style={[
              styles.paginationButtonText,
              { color: page === totalPages ? colors.placeholder : 'white' },
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader
          title="Power Teams"
          backPath="/(tabs)/_modules"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Power Teams"
        backPath="/(tabs)/_modules"
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/modules/powerteams/add' as any)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
        {/* Search Bar */}
        <View style={styles.searchFilterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search power teams, categories..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {searchQuery && (
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.card }]}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, { color: colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredPowerTeams}
          renderItem={renderPowerTeamItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: (Platform.OS === 'ios' ? 100 : 80) + insets.bottom }
          ]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderPagination}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete Power Team
            </Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Are you sure you want to delete "{powerTeamToDelete?.name}"? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setPowerTeamToDelete(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  powerTeamIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: 12,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  categoriesSection: {
    marginBottom: 12,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Search styles
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
});
