import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { deleteLocation, getLocations, Location, toggleLocationStatus } from '@/services/locationService';
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

export default function LocationsListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{ id: number; name: string } | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading locations from API');
      const response = await getLocations(1, 100, '', 'location', 'asc', 'all');
      console.log('Locations loaded successfully:', response.data?.locations?.length || 0, 'locations');
      setLocations(response.data?.locations || []);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load locations',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocations();
  }, [loadLocations]);

  const handleDelete = (id: number, name: string) => {
    setLocationToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    
    try {
      await deleteLocation(locationToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Location deleted successfully',
      });
      setDeleteModalVisible(false);
      setLocationToDelete(null);
      loadLocations();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to delete location',
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
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Locations Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        You don't have any locations yet. Add one to get started.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/locations/add' as any)}
      >
        <Text style={styles.createButtonText}>Add Location</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        We couldn't load your locations. Please try again.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => loadLocations()}
      >
        <Text style={styles.createButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  function renderItem({ item }: { item: Location }) {
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
            <Text style={[styles.locationName, { color: colors.text }]}>
              {item.location}
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

        {item.zoneName && (
          <View style={styles.zoneRow}>
            <Text style={[styles.zoneLabel, { color: colors.placeholder }]}>
              Region:
            </Text>
            <Text style={[styles.zoneName, { color: colors.text }]}>
              {item.zoneName}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/modules/locations/${item.id}/edit` as any)}
          >
            <Text style={styles.primaryBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ghostDangerBtn, { borderColor: '#F44336' }]}
            onPress={() => handleDelete(item.id, item.location)}
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
        data={locations}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={[
          styles.listContainer,
          locations.length === 0 && { flex: 1 },
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
      onPress={() => router.push('/modules/locations/add' as any)}
      style={[styles.addButton, { backgroundColor: colors.primary }]}
    >
      <ThemedText style={styles.addButtonText}>Add</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Locations"
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
              Delete Location
            </Text>
            <Text style={[styles.modalMessage, { color: colors.placeholder }]}>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setLocationToDelete(null);
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
  locationName: {
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
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '500',
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
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
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
