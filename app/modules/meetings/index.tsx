import React, { useState, useMemo } from 'react';
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
import { get, del } from '@/services/apiService';
import { format, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');

interface Meeting {
  id: number;
  date: string;
  meetingTime: string;
  meetingTitle: string;
  meetingVenue: string;
  chapter?: {
    id: number;
    name: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    meetings: Meeting[];
    page: number;
    totalPages: number;
    totalMeetings: number;
  };
  status: number;
}

export default function ChapterMeetingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [recordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'meetingTitle'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  // Fetch meetings
  const fetchMeetings = async (page: number = currentPage, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await get<ApiResponse>(
        `/api/chapter-meetings?page=${page}&limit=${recordsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}`
      );

      setMeetings(response.data?.meetings || []);
      setTotalPages(response.data?.totalPages || 1);
      setTotalMeetings(response.data?.totalMeetings || 0);
      setCurrentPage(page);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchMeetings(1);
  }, [sortBy, sortOrder, search]);

  const handleSort = (column: 'date' | 'meetingTitle') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this meeting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/api/chapter-meetings/${id}`);
              Alert.alert('Success', 'Meeting deleted successfully');
              fetchMeetings(currentPage);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete meeting');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const renderSortButton = (column: 'date' | 'meetingTitle', label: string) => (
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

  const renderMeeting = ({ item }: { item: Meeting }) => (
    <View style={[styles.meetingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.meetingHeader}>
        <View style={styles.dateContainer}>
          <IconSymbol name="calendar" size={18} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{item.meetingTime}</Text>
        </View>
      </View>

      <Text style={[styles.meetingTitle, { color: colors.text }]} numberOfLines={2}>
        {item.meetingTitle}
      </Text>

      <View style={styles.meetingInfo}>
        <View style={styles.infoRow}>
          <IconSymbol name="location.fill" size={14} color={colors.placeholder} />
          <Text style={[styles.infoText, { color: colors.placeholder }]} numberOfLines={1}>
            {item.meetingVenue}
          </Text>
        </View>
        {item.chapter && (
          <View style={styles.infoRow}>
            <IconSymbol name="book.closed.fill" size={14} color={colors.placeholder} />
            <Text style={[styles.infoText, { color: colors.placeholder }]} numberOfLines={1}>
              {item.chapter.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
          onPress={() => router.push(`/modules/meetings/${item.id}/visitors/add` as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="person.badge.plus" size={16} color={colors.info} />
          <Text style={[styles.actionButtonText, { color: colors.info }]}>Visitors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
          onPress={() => router.push(`/modules/meetings/${item.id}/attendance` as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="person.3.fill" size={16} color={colors.success} />
          <Text style={[styles.actionButtonText, { color: colors.success }]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
          onPress={() => router.push(`/modules/meetings/${item.id}/edit` as any)}
          activeOpacity={0.7}
        >
          <IconSymbol name="pencil" size={16} color={colors.warning} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="calendar.badge.exclamationmark" size={64} color={colors.placeholder} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Meetings Found</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.placeholder }]}>
        {search ? 'Try adjusting your search' : 'Tap the + button to add your first meeting'}
      </Text>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, { backgroundColor: colors.surface, opacity: currentPage === 1 ? 0.5 : 1 }]}
          onPress={() => currentPage > 1 && fetchMeetings(currentPage - 1)}
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
          onPress={() => currentPage < totalPages && fetchMeetings(currentPage + 1)}
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
          <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Chapter Meetings</Text>
            <Text style={styles.headerSubtitle}>{totalMeetings} total meetings</Text>
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
            placeholder="Search meetings..."
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
        {renderSortButton('date', 'Date')}
        {renderSortButton('meetingTitle', 'Title')}
      </View>

      {/* Meetings List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMeeting}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderPagination}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMeetings(currentPage, true)}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/meetings/add' as any)}
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
  meetingCard: {
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
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  meetingInfo: {
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
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
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
