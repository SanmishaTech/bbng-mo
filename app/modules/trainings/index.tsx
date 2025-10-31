import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getTrainings, deleteTraining, Training } from '@/services/trainingService';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

export default function TrainingListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = useThemeColor({}, 'background');
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<number | null>(null);

  const recordsPerPage = 10;

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search executes
      loadTrainings();
    }, 500); // 500ms delay for search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Immediate effect for pagination and sorting
  useEffect(() => {
    loadTrainings();
  }, [currentPage, sortBy, sortOrder]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      const response = await getTrainings(currentPage, sortBy, sortOrder, searchQuery, recordsPerPage);
      setTrainings(response.trainings || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading trainings:', error);
      setTrainings([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load trainings',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadTrainings();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const confirmDelete = (id: number) => {
    setTrainingToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (trainingToDelete) {
      try {
        await deleteTraining(trainingToDelete);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Training deleted successfully',
        });
        setDeleteModalVisible(false);
        setTrainingToDelete(null);
        loadTrainings();
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to delete training',
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MM-yy');
    } catch {
      return dateString;
    }
  };

  const renderTrainingCard = ({ item }: { item: Training }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.trainingIcon}>🏛️</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={[styles.dateText, { color: colors.placeholder }]}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={[styles.detailLabel, { color: colors.placeholder }]}>Time:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={[styles.detailLabel, { color: colors.placeholder }]}>Venue:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>{item.venue}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/modules/trainings/${item.id}/edit` as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryBtnText} numberOfLines={1}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ghostDangerBtn}
          onPress={() => confirmDelete(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.ghostDangerText} numberOfLines={1}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSortButton = (column: string, label: string) => (
    <TouchableOpacity
      style={[styles.sortButton, { backgroundColor: sortBy === column ? colors.primary + '20' : colors.surface }]}
      onPress={() => handleSort(column)}
      activeOpacity={0.7}
    >
      <Text style={[styles.sortButtonText, { color: sortBy === column ? colors.primary : colors.text }]}>{label}</Text>
      {sortBy === column && (
        <Text style={styles.sortArrow}>
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Removed renderHeader - moved outside FlatList

  const renderPagination = () => (
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
          {trainings.length} trainings
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
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏛️</Text>
      <Text style={[styles.emptyText, { color: colors.placeholder }]}>No trainings found</Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/trainings/add' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.createButtonText}>Create First Training</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Trainings"
        showBackButton
        backPath="/(tabs)/_modules"
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/modules/trainings/add' as any)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search and Sort Controls */}
      <View style={styles.searchAndSortContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.text }]}>Sort by:</Text>
          {renderSortButton('date', 'Date')}
          {renderSortButton('title', 'Title')}
          {renderSortButton('time', 'Time')}
        </View>
      </View>

      {loading && (!trainings || trainings.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={trainings || []}
          renderItem={renderTrainingCard}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={(trainings && trainings.length > 0) ? renderPagination : null}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Training</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Are you sure you want to delete this training? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
                activeOpacity={0.7}
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
  searchAndSortContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  searchContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginBottom: 12,
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
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
  trainingIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateIcon: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsSection: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
    marginBottom: 24,
    lineHeight: 22,
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
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
