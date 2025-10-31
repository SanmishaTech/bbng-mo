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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Ionicons } from '@expo/vector-icons';
import { getSiteSettings, deleteSiteSetting, SiteSetting } from '@/services/siteSettingService';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SiteSettingsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [filteredSettings, setFilteredSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'key' | 'value'>('key');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Debounced search and sort effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterAndSortSettings();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, sortOrder, settings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      setSettings(data);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setSettings([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load site settings',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortSettings = () => {
    let result = [...settings];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (setting) =>
          setting.key.toLowerCase().includes(query) ||
          setting.value.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredSettings(result);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const handleSort = (column: 'key' | 'value') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const confirmDelete = (id: number) => {
    setSettingToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (settingToDelete) {
      try {
        await deleteSiteSetting(settingToDelete);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Site setting deleted successfully',
        });
        setDeleteModalVisible(false);
        setSettingToDelete(null);
        loadSettings();
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to delete site setting',
        });
      }
    }
  };

  const renderSettingCard = ({ item }: { item: SiteSetting }) => (
    <ThemedView style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.settingInfo}>
          <ThemedText style={styles.keyText}>{item.key}</ThemedText>
          <ThemedText style={[styles.valueText, { color: colors.placeholder }]} numberOfLines={2}>
            {item.value}
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push(`/modules/sitesettings/${encodeURIComponent(item.key)}/edit` as any)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );

  const renderSortButton = (column: 'key' | 'value', label: string) => (
    <TouchableOpacity 
      style={[styles.sortButton, { backgroundColor: sortBy === column ? colors.primary + '20' : colors.surfaceSecondary }]} 
      onPress={() => handleSort(column)}
    >
      <ThemedText style={styles.sortButtonText}>{label}</ThemedText>
      {sortBy === column && (
        <Ionicons
          name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <ThemedView style={styles.emptyContainer}>
      <Ionicons name="settings-outline" size={64} color={colors.border} />
      <ThemedText style={[styles.emptyText, { color: colors.placeholder }]}>No site settings found</ThemedText>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/sitesettings/add' as any)}
      >
        <ThemedText style={styles.createButtonText}>Create First Setting</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Site Settings"
        showBackButton
        backPath="/(tabs)/_modules"
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/modules/sitesettings/add' as any)}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Search and Sort Controls */}
      <View style={styles.searchAndSortContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search settings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.sortContainer}>
          <ThemedText style={styles.sortLabel}>Sort by:</ThemedText>
          {renderSortButton('key', 'Key')}
          {renderSortButton('value', 'Value')}
        </View>
      </View>

      {loading && settings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSettings}
          renderItem={renderSettingCard}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
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
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Delete Setting</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to delete this site setting? This action cannot be undone.
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleDelete}
              >
                <ThemedText style={styles.confirmButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
