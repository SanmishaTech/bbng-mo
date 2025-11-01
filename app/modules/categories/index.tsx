import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getCategories, deleteCategory, Category } from '@/services/categoryService';

const { width } = Dimensions.get('window');

export default function CategoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  // Fetch categories
  const fetchCategories = async (page: number = currentPage, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getCategories(page, recordsPerPage, search, sortBy, sortOrder);

      setCategories(response.data?.categories || []);
      setTotalPages(response.data?.totalPages || 1);
      setTotalCategories(response.data?.totalCategories || 0);
      setCurrentPage(page);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchCategories(1);
  }, [sortBy, sortOrder, search]);

  const handleSort = (column: 'name' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
              Alert.alert('Success', 'Category deleted successfully');
              fetchCategories(currentPage);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderSortButton = (column: 'name' | 'createdAt', label: string) => (
    <TouchableOpacity
      style={[styles.sortButton, { backgroundColor: sortBy === column ? colors.primary : colors.surface }]}
      onPress={() => handleSort(column)}
      activeOpacity={0.7}
    >
      <Text style={[styles.sortButtonText, { color: sortBy === column ? 'white' : colors.text }]}>
        {label}
      </Text>
      {sortBy === column && (
        <IconSymbol
          name={sortOrder === 'asc' ? 'chevron.up' : 'chevron.down'}
          size={14}
          color="white"
        />
      )}
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.nameContainer}>
          <IconSymbol name="tag.fill" size={18} color={colors.primary} />
          <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Active</Text>
        </View>
      </View>

      <View style={styles.categoryInfo}>
        <View style={styles.infoRow}>
          <IconSymbol name="number" size={14} color={colors.placeholder} />
          <Text style={[styles.infoText, { color: colors.placeholder }]}>
            ID: #{item.id}
          </Text>
        </View>
        {item.subCategories && item.subCategories.length > 0 && (
          <View style={styles.infoRow}>
            <IconSymbol name="list.bullet" size={14} color={colors.placeholder} />
            <Text style={[styles.infoText, { color: colors.placeholder }]}>
              {item.subCategories.length} {item.subCategories.length === 1 ? 'Subcategory' : 'Subcategories'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning + '20', flex: 1 }]}
          onPress={() => router.push(`/modules/categories/${item.id}/edit` as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="pencil" size={16} color={colors.warning} />
          <Text style={[styles.actionButtonText, { color: colors.warning }]} numberOfLines={1}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '20', flex: 1 }]}
          onPress={() => handleDelete(item.id, item.name)}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash" size={16} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]} numberOfLines={1}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="tag" size={64} color={colors.placeholder} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Categories Found</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.placeholder }]}>
        {search ? 'Try adjusting your search' : 'Tap the + button to add your first category'}
      </Text>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, { backgroundColor: colors.surface, opacity: currentPage === 1 ? 0.5 : 1 }]}
          onPress={() => currentPage > 1 && fetchCategories(currentPage - 1)}
          disabled={currentPage === 1}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.paginationText, { color: colors.text }]}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.paginationButton, { backgroundColor: colors.surface, opacity: currentPage === totalPages ? 0.5 : 1 }]}
          onPress={() => currentPage < totalPages && fetchCategories(currentPage + 1)}
          disabled={currentPage === totalPages}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.right" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/_modules' as any)} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Categories</Text>
            <Text style={styles.headerSubtitle}>{totalCategories} total categories</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search categories..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortContainer}>
        {renderSortButton('name', 'Name')}
        {renderSortButton('createdAt', 'Date')}
      </View>

      {/* Categories List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategory}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderPagination}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCategories(currentPage, true)}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/categories/add' as any)}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
