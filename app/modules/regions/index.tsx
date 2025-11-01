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
import { getRegions, deleteRegion, Region, getRegionRoles } from '@/services/regionService';

const { width } = Dimensions.get('window');

interface RegionWithRoles extends Region {
  roleCount?: number;
  hasRoles?: boolean;
}

export default function RegionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [regions, setRegions] = useState<RegionWithRoles[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegions, setTotalRegions] = useState(0);
  const [recordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  // Fetch regions with role counts
  const fetchRegions = async (page: number = currentPage, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getRegions(page, recordsPerPage, search, sortBy, sortOrder, 'all');

      const regionsData = response.data?.zones || [];
      
      // Fetch role counts for each region
      const regionsWithRoles = await Promise.all(
        regionsData.map(async (region) => {
          try {
            const rolesData = await getRegionRoles(region.id);
            return {
              ...region,
              roleCount: rolesData?.roles?.length || 0,
              hasRoles: (rolesData?.roles?.length || 0) > 0,
            };
          } catch (error) {
            return { ...region, roleCount: 0, hasRoles: false };
          }
        })
      );

      setRegions(regionsWithRoles);
      setTotalPages(response.data?.totalPages || 1);
      setTotalRegions(response.data?.totalZones || 0);
      setCurrentPage(page);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch regions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchRegions(1);
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
              await deleteRegion(id);
              Alert.alert('Success', 'Region deleted successfully');
              fetchRegions(currentPage);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete region');
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

  const renderRegion = ({ item }: { item: RegionWithRoles }) => (
    <View style={[styles.regionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.regionHeader}>
        <View style={styles.nameContainer}>
          <IconSymbol name="globe" size={18} color={colors.primary} />
          <Text style={[styles.regionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={[
          styles.badge, 
          { backgroundColor: item.hasRoles ? '#4CAF50' + '20' : colors.border + '50' }
        ]}>
          <View style={[
            styles.badgeDot,
            { backgroundColor: item.hasRoles ? '#4CAF50' : colors.placeholder }
          ]} />
          <Text style={[
            styles.badgeText, 
            { color: item.hasRoles ? '#4CAF50' : colors.placeholder }
          ]}>
            {item.roleCount || 0} {item.roleCount === 1 ? 'Role' : 'Roles'}
          </Text>
        </View>
      </View>

      <View style={styles.regionInfo}>
        <View style={styles.infoRow}>
          <IconSymbol name="number" size={14} color={colors.placeholder} />
          <Text style={[styles.infoText, { color: colors.placeholder }]}>
            ID: #{item.id}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1.3 }]}
          onPress={() => router.push(`/modules/regions/${item.id}/edit` as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="pencil" size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]} numberOfLines={1}>Manage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '20', flex: 0.85 }]}
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
      <IconSymbol name="globe" size={64} color={colors.placeholder} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Regions Found</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.placeholder }]}>
        {search ? 'Try adjusting your search' : 'Tap the + button to add your first region'}
      </Text>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, { backgroundColor: colors.surface, opacity: currentPage === 1 ? 0.5 : 1 }]}
          onPress={() => currentPage > 1 && fetchRegions(currentPage - 1)}
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
          onPress={() => currentPage < totalPages && fetchRegions(currentPage + 1)}
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
            <Text style={styles.headerTitle}>Regions</Text>
            <Text style={styles.headerSubtitle}>{totalRegions} total regions</Text>
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
            placeholder="Search regions..."
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

      {/* Regions List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRegion}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderPagination}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRegions(currentPage, true)}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/regions/add' as any)}
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
  regionCard: {
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
  regionHeader: {
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
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  regionInfo: {
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
