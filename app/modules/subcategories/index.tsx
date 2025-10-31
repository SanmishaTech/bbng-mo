import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { deleteSubCategory, getSubCategories, SubCategory } from '@/services/subCategoryService';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

export default function SubCategoriesListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubcategories, setTotalSubcategories] = useState(0);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSubcategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading subcategories with search:', debouncedSearchQuery, 'filter:', activeFilter, 'page:', currentPage);
      const response = await getSubCategories(currentPage, pageSize, debouncedSearchQuery, 'name', 'asc');
      console.log('Subcategories loaded successfully:', response.data?.categories?.length || 0, 'subcategories');
      setSubcategories(response.data?.categories || []);
      setTotalPages(response.data?.totalPages || 1);
      setTotalSubcategories(response.data?.totalCategories || 0);
    } catch (err) {
      console.error('Error loading subcategories:', err);
      setError('Failed to load subcategories');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load subcategories',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery, activeFilter, currentPage]);

  useEffect(() => {
    loadSubcategories();
  }, [loadSubcategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubcategories();
  }, [loadSubcategories]);

  const handleDelete = (id: number, name: string) => {
    setSubcategoryToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!subcategoryToDelete) return;
    
    try {
      await deleteSubCategory(subcategoryToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Sub-category deleted successfully',
      });
      setDeleteModalVisible(false);
      setSubcategoryToDelete(null);
      loadSubcategories();
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to delete subcategory',
      });
      setDeleteModalVisible(false);
    }
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
            { width: 60, backgroundColor: colors.border },
          ]}
        />
        <View
          style={[
            styles.skelBox,
            { width: 150, backgroundColor: colors.border },
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
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Sub-Categories Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        You don't have any sub-categories yet. Add one to get started.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/subcategories/add' as any)}
      >
        <Text style={styles.createButtonText}>Add Sub-Category</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        We couldn't load your sub-categories. Please try again.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => loadSubcategories()}
      >
        <Text style={styles.createButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  function renderItem({ item }: { item: SubCategory }) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardId, { color: colors.placeholder }]}>
              #{item.id}
            </Text>
            <Text style={[styles.subcategoryName, { color: colors.text }]}>
              {item.name}
            </Text>
          </View>
          {item.active !== undefined && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.active
                    ? '#4CAF50' + '20'
                    : '#F44336' + '20',
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: item.active ? '#4CAF50' : '#F44336' }]} />
              <Text
                style={[
                  styles.statusText,
                  { color: item.active ? '#4CAF50' : '#F44336' },
                ]}
              >
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          )}
        </View>

        {item.categoryName && (
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>🏷️</Text>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {item.categoryName}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/modules/subcategories/${item.id}/edit` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostDangerBtn, { borderColor: '#F44336' }]}
            onPress={() => handleDelete(item.id, item.name)}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostDangerText}>🗑️ Delete</Text>
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
          data={subcategories}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContainer,
            subcategories.length === 0 && { flex: 1 },
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
              <Text
                style={[
                  styles.paginationBtnText,
                  { color: currentPage === 1 ? colors.placeholder : 'white' },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>
            
            <View style={styles.paginationInfo}>
              <Text style={[styles.paginationText, { color: colors.text }]}>
                Page {currentPage} of {totalPages}
              </Text>
              <Text style={[styles.paginationSubtext, { color: colors.placeholder }]}>
                {totalSubcategories} total
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.paginationBtn,
                { backgroundColor: currentPage === totalPages ? colors.surface : colors.primary },
              ]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.paginationBtnText,
                  { color: currentPage === totalPages ? colors.placeholder : 'white' },
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  const backgroundColor = useThemeColor({}, 'background');

  const rightComponent = (
    <TouchableOpacity
      onPress={() => router.push('/modules/subcategories/add' as any)}
      style={[styles.addButton, { backgroundColor: colors.primary }]}
    >
      <ThemedText style={styles.addButtonText}>Add</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Sub-Categories"
        rightComponent={rightComponent}
        backPath="/(tabs)/_modules"
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
        {/* Search and Filter Bar */}
        <View style={styles.searchFilterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search sub-categories..."
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
            <Text
              style={[
                styles.filterButtonText,
                { color: showFilters ? 'white' : colors.text },
              ]}
            >
              {showFilters ? '✓' : '☰'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Status:</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={activeFilter}
                onValueChange={(value) => {
                  setActiveFilter(value);
                  setCurrentPage(1);
                }}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="All Sub-Categories" value="all" />
                <Picker.Item label="Active Only" value="true" />
                <Picker.Item label="Inactive Only" value="false" />
              </Picker>
            </View>
            
            {(searchQuery || activeFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearFilterBtn, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setCurrentPage(1);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearFilterText, { color: colors.text }]}>
                  Clear Filters
                </Text>
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete Sub-Category
            </Text>
            <Text style={[styles.modalMessage, { color: colors.placeholder }]}>
              Are you sure you want to delete "{subcategoryToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSubcategoryToDelete(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Delete
                </Text>
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
    gap: 10,
    flex: 1,
  },
  cardId: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subcategoryName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
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
  // Search and Filter styles
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  clearFilterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paginationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  paginationBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  paginationInfo: {
    alignItems: 'center',
    gap: 2,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '700',
  },
  paginationSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
});
