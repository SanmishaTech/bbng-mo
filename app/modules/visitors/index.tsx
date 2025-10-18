import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

interface Visitor {
  id: number;
  name: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string | null;
  mobile1: string;
  mobile2?: string | null;
  isCrossChapter: boolean;
  meetingId: number;
  chapterId: number;
  chapter: string;
  invitedById: number;
  category?: string;
  businessDetails?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  pincode?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  meeting?: {
    id: number;
    date: string;
    meetingTime: string;
    meetingTitle: string;
    meetingVenue: string;
  };
  invitedBy?: {
    memberName: string;
    mobile1?: string;
    email?: string;
    homeChapter?: {
      name: string;
    };
  };
  invitedByMember?: {
    id: number;
    memberName: string;
    organizationName: string;
    category: string;
  };
  homeChapter?: {
    id: number;
    name: string;
  };
}

type TabType = 'visitors' | 'cross-chapter';
type StatusType = 'All' | 'Invited' | 'Confirmed' | 'Attended' | 'No-Show';

export default function VisitorsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('visitors');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const itemsPerPage = 20;
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);

  const chapterId = user?.member?.chapterId;
  const chapterName = user?.member?.chapterName || 'Your Chapter';

  useEffect(() => {
    if (chapterId) {
      loadVisitors();
    }
  }, [chapterId, activeTab, statusFilter, fromDate, toDate, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [visitors, searchQuery]);

  async function loadVisitors(isRefresh = false) {
    if (!chapterId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to determine your chapter',
      });
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Build query params matching the original UI format exactly
      const params = new URLSearchParams({
        chapterId: chapterId.toString(),
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        search: '',
        isCrossChapter: activeTab === 'cross-chapter' ? 'true' : 'false',
      });

      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }

      if (fromDate) {
        params.append('fromDate', fromDate.toISOString());
      }

      if (toDate) {
        params.append('toDate', toDate.toISOString());
      }

      const url = `/api/visitors?${params.toString()}`;
      console.log('Fetching visitors:', url);
      
      const response: any = await apiService.get(url);
      
      let visitorsData = [];
      let total = 0;
      let pages = 1;

      if (response.success && response.data) {
        visitorsData = response.data.visitors || [];
        total = response.data.totalVisitors || 0;
        pages = response.data.totalPages || 1;
      } else if (response.data && Array.isArray(response.data.visitors)) {
        visitorsData = response.data.visitors;
        total = response.data.totalVisitors || visitorsData.length;
        pages = response.data.totalPages || 1;
      } else if (response.visitors) {
        visitorsData = response.visitors;
        total = response.totalVisitors || visitorsData.length;
        pages = response.totalPages || 1;
      }

      setVisitors(visitorsData);
      setTotalVisitors(total);
      setTotalPages(pages);
    } catch (error) {
      console.error('Error loading visitors:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load visitors',
      });
      setVisitors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function applyFilters() {
    let filtered = [...visitors];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.name?.toLowerCase().includes(query) ||
        v.mobile1?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.category?.toLowerCase().includes(query) ||
        v.meeting?.meetingTitle?.toLowerCase().includes(query)
      );
    }

    setFilteredVisitors(filtered);
  }

  function onRefresh() {
    setCurrentPage(1);
    loadVisitors(true);
  }

  async function handleDelete(visitor: Visitor) {
    setVisitorToDelete(visitor);
    setDeleteConfirmVisible(true);
  }

  async function confirmDelete() {
    if (!visitorToDelete) return;

    try {
      await apiService.delete(`/api/visitors/${visitorToDelete.id}`);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Visitor deleted successfully',
      });
      setDeleteConfirmVisible(false);
      setVisitorToDelete(null);
      loadVisitors();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete visitor',
      });
    }
  }

  function handleConvertToMember(visitor: Visitor) {
    Alert.alert(
      'Convert to Member',
      `Convert ${visitor.name} to a member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Feature Coming Soon',
              text2: 'Member conversion will be available soon',
            });
          },
        },
      ]
    );
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'Invited':
        return colors.info;
      case 'Confirmed':
        return colors.success;
      case 'Attended':
        return '#8B5CF6';
      case 'No-Show':
        return colors.error;
      default:
        return colors.placeholder;
    }
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }

  function renderVisitor({ item }: { item: Visitor }) {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.visitorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.visitorMainContent}
          onPress={() => router.push(`/modules/visitors/${item.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
            <IconSymbol 
              name={item.isCrossChapter ? "person.2" : "person.badge.plus"} 
              size={24} 
              color={colors.info} 
            />
          </View>
          <View style={styles.visitorInfo}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.visitorName} numberOfLines={1}>
                {item.isCrossChapter && item.invitedBy 
                  ? item.invitedBy.memberName || 'N/A'
                  : item.name}
              </ThemedText>
              {item.status && (
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                  <ThemedText style={[styles.statusText, { color: statusColor }]}>
                    {item.status}
                  </ThemedText>
                </View>
              )}
            </View>
            
            {item.isCrossChapter && item.invitedBy?.homeChapter && (
              <ThemedText style={styles.crossChapterText}>
                From: {item.invitedBy.homeChapter.name || item.chapter || 'N/A'}
              </ThemedText>
            )}
            
            {item.category && !item.isCrossChapter && (
              <ThemedText style={styles.visitorCategory}>{item.category}</ThemedText>
            )}
            
            <View style={styles.detailsRow}>
              <View style={styles.contactRow}>
                <IconSymbol name="phone" size={12} color={colors.icon} />
                <ThemedText style={styles.visitorContact}>
                  {item.isCrossChapter && item.invitedBy
                    ? item.invitedBy.mobile1 || 'N/A'
                    : item.mobile1}
                </ThemedText>
              </View>
              
              {item.meeting && (
                <View style={styles.meetingRow}>
                  <IconSymbol name="calendar" size={12} color={colors.icon} />
                  <ThemedText style={styles.visitorDate} numberOfLines={1}>
                    {item.meeting.meetingTitle} ({new Date(item.meeting.date).toLocaleDateString('en-GB')})
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push(`/modules/visitors/${item.id}` as any)}
          >
            <IconSymbol name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          {!item.isCrossChapter && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
              onPress={() => handleConvertToMember(item)}
            >
              <IconSymbol name="person.badge.plus" size={16} color={colors.success} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleDelete(item)}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!chapterId) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <IconSymbol name="exclamationmark.triangle" size={60} color={colors.warning} />
        <ThemedText style={styles.emptyText}>Unable to determine your chapter</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Please check your profile
        </ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading visitors...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>Visitors</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{totalVisitors} total visitors</ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.addHeaderButton}
            onPress={() => router.push('/modules/visitors/create' as any)}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'visitors' && styles.activeTab,
            { borderBottomColor: activeTab === 'visitors' ? colors.primary : 'transparent' }
          ]}
          onPress={() => { setActiveTab('visitors'); setCurrentPage(1); }}
        >
          <IconSymbol name="person.3" size={18} color={activeTab === 'visitors' ? colors.primary : colors.icon} />
          <ThemedText style={[styles.tabText, activeTab === 'visitors' && { color: colors.primary, fontWeight: '600' }]}>
            Visitors
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'cross-chapter' && styles.activeTab,
            { borderBottomColor: activeTab === 'cross-chapter' ? colors.primary : 'transparent' }
          ]}
          onPress={() => { setActiveTab('cross-chapter'); setCurrentPage(1); }}
        >
          <IconSymbol name="person.2" size={18} color={activeTab === 'cross-chapter' ? colors.primary : colors.icon} />
          <ThemedText style={[styles.tabText, activeTab === 'cross-chapter' && { color: colors.primary, fontWeight: '600' }]}>
            Cross Chapter
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={[styles.filtersSection, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search visitors..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowStatusPicker(true)}
          >
            <ThemedText style={styles.filterBtnText}>{statusFilter}</ThemedText>
            <IconSymbol name="chevron.down" size={14} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : colors.background, borderColor: colors.border }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <IconSymbol name="line.3.horizontal.decrease.circle" size={16} color={showFilters ? '#fff' : colors.icon} />
            <ThemedText style={[styles.filterBtnText, showFilters && { color: '#fff' }]}>
              Dates
            </ThemedText>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.dateFiltersRow}>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowFromDatePicker(true)}
            >
              <IconSymbol name="calendar" size={14} color={colors.icon} />
              <ThemedText style={styles.dateBtnText}>
                {fromDate ? fromDate.toLocaleDateString('en-GB') : 'From'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowToDatePicker(true)}
            >
              <IconSymbol name="calendar" size={14} color={colors.icon} />
              <ThemedText style={styles.dateBtnText}>
                {toDate ? toDate.toLocaleDateString('en-GB') : 'To'}
              </ThemedText>
            </TouchableOpacity>

            {(fromDate || toDate) && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.error + '15' }]}
                onPress={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
              >
                <ThemedText style={[styles.clearBtnText, { color: colors.error }]}>
                  Clear
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <FlatList
        data={filteredVisitors}
        renderItem={renderVisitor}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.3" size={60} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No visitors found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first visitor to get started'}
            </ThemedText>
          </View>
        }
      />

      {/* Status Picker Modal */}
      <Modal visible={showStatusPicker} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.modalTitle}>Select Status</ThemedText>
            {(['All', 'Invited', 'Confirmed', 'Attended', 'No-Show'] as StatusType[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setStatusFilter(status);
                  setShowStatusPicker(false);
                  setCurrentPage(1);
                }}
              >
                <ThemedText style={[styles.modalItemText, statusFilter === status && { color: colors.primary, fontWeight: '600' }]}>
                  {status}
                </ThemedText>
                {statusFilter === status && <IconSymbol name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: colors.card }]}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
            <ThemedText style={styles.confirmTitle}>Confirm Delete</ThemedText>
            <ThemedText style={styles.confirmMessage}>
              Are you sure you want to delete {visitorToDelete?.name}? This action cannot be undone.
            </ThemedText>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  setVisitorToDelete(null);
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={confirmDelete}
              >
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowFromDatePicker(false);
            if (event.type === 'set' && date) {
              setFromDate(date);
              setCurrentPage(1);
            }
          }}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowToDatePicker(false);
            if (event.type === 'set' && date) {
              setToDate(date);
              setCurrentPage(1);
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  addHeaderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
  },
  filtersSection: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
  },
  dateFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  dateBtnText: {
    fontSize: 12,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  visitorCard: {
    flexDirection: 'column',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  visitorMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visitorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  crossChapterText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  visitorCategory: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.85,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitorContact: {
    fontSize: 12,
    opacity: 0.7,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  visitorDate: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {},
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
