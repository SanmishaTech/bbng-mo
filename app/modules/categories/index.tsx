import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { deleteCategory, getCategories, Category } from '@/services/categoryService';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function CategoriesListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading categories from API');
      const response = await getCategories(1, 100, '', 'name', 'asc');
      console.log('Categories loaded successfully:', response.data?.categories?.length || 0, 'categories');
      setCategories(response.data?.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
  }, [loadCategories]);

  const handleDelete = (id: number, name: string) => {
    setCategoryToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory(categoryToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Category deleted successfully',
      });
      setDeleteModalVisible(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to delete category',
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
        No Categories Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        You don't have any categories yet. Add one to get started.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/categories/add' as any)}
      >
        <Text style={styles.createButtonText}>Add Category</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        We couldn't load your categories. Please try again.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => loadCategories()}
      >
        <Text style={styles.createButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  function renderItem({ item }: { item: Category }) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              #{item.id}
            </Text>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {item.name}
            </Text>
          </View>
          {item.active !== undefined && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.active
                    ? colors.success + '20'
                    : colors.error + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.active ? colors.success : colors.error },
                ]}
              >
                {item.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <View style={styles.descriptionRow}>
            <Text style={[styles.descriptionText, { color: colors.placeholder }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/modules/categories/${item.id}/edit` as any)}
          >
            <Text style={styles.primaryBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostDangerBtn, { borderColor: '#F44336' }]}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Text style={styles.ghostDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const content = () => {
    if (loading) {
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
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={[
          styles.listContainer,
          categories.length === 0 && { flex: 1 },
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
    );
  };

  const backgroundColor = useThemeColor({}, 'background');

  const rightComponent = (
    <TouchableOpacity
      onPress={() => router.push('/modules/categories/add' as any)}
      style={[styles.addButton, { backgroundColor: colors.primary }]}
    >
      <ThemedText style={styles.addButtonText}>Add</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Categories"
        rightComponent={rightComponent}
        backPath="/(tabs)"
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
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
              Delete Category
            </Text>
            <Text style={[styles.modalMessage, { color: colors.placeholder }]}>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setCategoryToDelete(null);
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
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    opacity: 0.6,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
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
  descriptionRow: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
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
});
