import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiService } from '@/services/apiService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { Picker } from '@react-native-picker/picker';

interface Membership {
  id: number;
  memberId: number;
  packageId: number;
  invoiceNumber?: string;
  invoiceDate: string;
  packageStartDate: string;
  packageEndDate: string;
  totalFees: number;
  package: {
    id: number;
    packageName: string;
    isVenueFee: boolean;
    amount?: number;
  };
  member?: {
    id: number;
    memberName: string;
  };
}

export default function MembershipsScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<{id: number, invoiceNumber?: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadMemberships = useCallback(async () => {
    if (!memberId) {
      setError('No member ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Loading memberships for member ID:', memberId);
      // Use the correct API endpoint with /api/ prefix
      const response = await apiService.get<any>(`/api/memberships/member/${memberId}`);
      console.log('Memberships API Response:', response);
      
      // Response structure: { success: true, data: [...], status: 200 }
      const membershipData = response.data || [];
      console.log('Extracted membership data:', membershipData);
      setMemberships(membershipData);
      
      // Get member name from first membership if available
      if (membershipData.length > 0 && membershipData[0].member) {
        setMemberName(membershipData[0].member.memberName);
      } else {
        // Fallback: Fetch member details separately
        try {
          const memberResponse = await apiService.get<any>(`/api/members/${memberId}`);
          if (memberResponse?.data?.memberName) {
            setMemberName(memberResponse.data.memberName);
          }
        } catch (error) {
          console.log('Could not fetch member name:', error);
        }
      }
    } catch (err: any) {
      console.error('Error loading memberships:', err);
      setError('Failed to load memberships');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.message || 'Failed to load memberships',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and paginate memberships
  useEffect(() => {
    let filtered = [...memberships];

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.package?.packageName?.toLowerCase().includes(query) ||
          m.invoiceNumber?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => {
        const isActive = new Date(m.packageEndDate) >= new Date();
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => {
        if (typeFilter === 'venue') return m.package.isVenueFee;
        if (typeFilter === 'membership') return !m.package.isVenueFee;
        return true;
      });
    }

    setFilteredMemberships(filtered);
  }, [memberships, debouncedSearchQuery, statusFilter, typeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMemberships();
  }, [loadMemberships]);

  const getMembershipStatus = (endDate: string) => {
    const now = new Date();
    const expiry = new Date(endDate);
    return expiry >= now
      ? { label: 'Active', color: colors.success }
      : { label: 'Expired', color: '#FFA726' }; // Orange for expired
  };

  const getPackageType = (isVenueFee: boolean) => {
    return isVenueFee ? 'Venue Fee' : 'Membership';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadInvoice = async (invoiceNumber: string, membershipId: number) => {
    if (downloadingInvoiceId === membershipId) return;
    
    setDownloadingInvoiceId(membershipId);
    try {
      // Get the auth token
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Invoice Download - Token retrieved:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      console.log('Platform:', Platform.OS);
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please log in again',
        });
        return;
      }

      const url = `${API_CONFIG.BASE_URL}/api/memberships/invoice/${invoiceNumber}.pdf`;
      console.log('Downloading invoice from:', url);
      console.log('Using token (first 20 chars):', token.substring(0, 20) + '...');
      
      if (Platform.OS === 'web') {
        // Web platform: Use fetch and blob download
        console.log('Using web download method');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
          },
        });

        console.log('Download response status:', response.status);
        
        if (response.status === 401) {
          Toast.show({
            type: 'error',
            text1: 'Authentication Failed',
            text2: 'Your session may have expired. Please log in again.',
          });
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to download invoice (Status: ${response.status})`);
        }

        // Get the blob and trigger download
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        Toast.show({
          type: 'success',
          text1: 'Invoice Downloaded',
          text2: 'Check your downloads folder',
        });
      } else {
        // Native platform (iOS/Android): Use FileSystem
        console.log('Using native download method');
        
        const fileUri = FileSystem.documentDirectory + `${invoiceNumber}.pdf`;
        
        const downloadResult = await FileSystem.downloadAsync(
          url,
          fileUri,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        console.log('Download result status:', downloadResult.status);
        console.log('Download result URI:', downloadResult.uri);
        
        if (downloadResult.status === 401) {
          Toast.show({
            type: 'error',
            text1: 'Authentication Failed',
            text2: 'Your session may have expired. Please log in again.',
          });
          return;
        }

        if (downloadResult.status === 200) {
          Toast.show({
            type: 'success',
            text1: 'Invoice Downloaded',
            text2: 'Opening file...',
          });

          // Share the file (opens system share sheet)
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(downloadResult.uri);
          } else {
            Toast.show({
              type: 'info',
              text1: 'File Saved',
              text2: `Saved to ${fileUri}`,
            });
          }
        } else {
          throw new Error(`Failed to download invoice (Status: ${downloadResult.status})`);
        }
      }
    } catch (error: any) {
      console.error('Download invoice error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: error?.message || 'Could not download invoice',
      });
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleDeleteMembership = async () => {
    if (!membershipToDelete) return;

    setDeleting(true);
    try {
      await apiService.delete(`/api/memberships/${membershipToDelete.id}`);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Membership deleted successfully',
      });
      setDeleteModalVisible(false);
      setMembershipToDelete(null);
      // Reload memberships
      loadMemberships();
    } catch (error: any) {
      console.error('Delete membership error:', error);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error?.message || 'Could not delete membership',
      });
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (id: number, invoiceNumber?: string) => {
    setMembershipToDelete({ id, invoiceNumber });
    setDeleteModalVisible(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
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
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Memberships Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        This member doesn't have any membership records yet.
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        {error || 'We couldn\'t load the memberships. Please try again.'}
      </Text>
    </View>
  );

  function renderItem({ item }: { item: Membership }) {
    const status = getMembershipStatus(item.packageEndDate);
    const packageType = getPackageType(item.package.isVenueFee);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.packageIcon}>
              {item.package.isVenueFee ? '🏢' : '💳'}
            </Text>
            <Text style={[styles.packageName, { color: colors.text }]} numberOfLines={2}>
              {item.package?.packageName || 'Unknown Package'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.color + '20' },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          {item.invoiceNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📄</Text>
              <Text style={[styles.infoLabel, { color: colors.placeholder }]}>
                Invoice:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                {item.invoiceNumber}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>
              Date:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(item.invoiceDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏷️</Text>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>
              Type:
            </Text>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: item.package.isVenueFee
                    ? '#9E9E9E' + '20'
                    : colors.primary + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  {
                    color: item.package.isVenueFee ? '#9E9E9E' : colors.primary,
                  },
                ]}
              >
                {packageType}
              </Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>
              Period:
            </Text>
            <View style={styles.periodDates}>
              <Text style={[styles.periodText, { color: colors.text }]}>
                {formatDate(item.packageStartDate)}
              </Text>
              <Text style={[styles.periodSeparator, { color: colors.placeholder }]}>
                {' → '}
              </Text>
              <Text style={[styles.periodText, { color: colors.text }]}>
                {formatDate(item.packageEndDate)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>
              Amount:
            </Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>
              {formatCurrency(item.totalFees)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {item.invoiceNumber && (
            <TouchableOpacity
              style={[
                styles.invoiceBtn,
                {
                  backgroundColor: '#2196F3' + '20',
                  opacity: downloadingInvoiceId === item.id ? 0.5 : 1,
                  flex: 1.4,
                },
              ]}
              onPress={() => handleDownloadInvoice(item.invoiceNumber!, item.id)}
              disabled={downloadingInvoiceId === item.id}
              activeOpacity={0.7}
            >
              {downloadingInvoiceId === item.id ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <Text style={[styles.invoiceBtnText, { color: '#2196F3' }]} numberOfLines={1}>
                  📥 Download
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: '#F44336' + '20', flex: item.invoiceNumber ? 0.85 : 1 }]}
            onPress={() => confirmDelete(item.id, item.invoiceNumber)}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteBtnText, { color: '#F44336' }]} numberOfLines={1}>
              🗑️ Delete
            </Text>
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

    // Calculate pagination
    const totalItems = filteredMemberships.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredMemberships.slice(startIndex, endIndex);

    return (
      <>
        <FlatList
          data={paginatedData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContainer,
            paginatedData.length === 0 && { flex: 1 },
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
                {totalItems} total
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

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title={memberName ? `${memberName}'s Memberships` : 'Memberships'}
        backPath="/modules/members"
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/modules/memberships/add?memberId=${memberId}` as any)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
        {/* Search and Filter Bar */}
        <View style={styles.searchFilterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search packages or invoices..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
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
                selectedValue={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="All Memberships" value="all" />
                <Picker.Item label="Active Only" value="active" />
                <Picker.Item label="Expired Only" value="expired" />
              </Picker>
            </View>
            
            <Text style={[styles.filterLabel, { color: colors.text }]}>Type:</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="All Types" value="all" />
                <Picker.Item label="Membership Only" value="membership" />
                <Picker.Item label="Venue Fee Only" value="venue" />
              </Picker>
            </View>
            
            {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearFilterBtn, { backgroundColor: colors.surface }]}
                onPress={clearFilters}
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
              Confirm Deletion
            </Text>
            <Text style={[styles.modalDescription, { color: colors.placeholder }]}>
              Are you sure you want to delete membership{' '}
              {membershipToDelete?.invoiceNumber
                ? `for invoice ${membershipToDelete.invoiceNumber}`
                : `#${membershipToDelete?.id}`}?
              This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setMembershipToDelete(null);
                }}
                disabled={deleting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  { opacity: deleting ? 0.7 : 1 },
                ]}
                onPress={handleDeleteMembership}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
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
  packageIcon: {
    fontSize: 20,
  },
  packageName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  statusBadge: {
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
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
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
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodSeparator: {
    fontSize: 13,
    fontWeight: '400',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
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
  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  invoiceBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  invoiceBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  deleteBtnText: {
    fontWeight: '700',
    fontSize: 14,
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
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
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
  modalDescription: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  modalButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
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
  // Add button styles
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
  // Search and Filter styles
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
