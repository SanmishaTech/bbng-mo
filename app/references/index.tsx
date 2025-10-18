import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';
import Toast from 'react-native-toast-message';
import { NavigationHeader } from '@/components/NavigationHeader';

// Updated interface to match API response structure
interface ApiReference {
  id: string;
  date: string;
  chapterId?: number;
  memberId?: number;
  receiverId?: number;
  urgency?: string;
  self: boolean;
  nameOfReferral: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  remarks?: string;
  addressLine1?: string;
  addressLine2?: string;
  location?: string;
  pincode?: string;
  status?: string;
  // Additional fields that might come from API
  chapter?: { name: string };
  member?: { memberName: string };
  receiver?: { memberName: string };
  giver?: { memberName: string };
  type?: 'given' | 'received'; // Added from our processing
}

// Display interface for the list view
interface Reference {
  id: string;
  title: string;
  type: 'given' | 'received';
  company: string;
  contact: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
  dateAdded: string;
  urgency?: string;
  status?: string;
}

export default function ReferencesIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'given' | 'received'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'surface');

  // Transform API reference data to display format
  const transformApiReference = (apiRef: ApiReference): Reference => {
    const memberName = apiRef.receiver?.memberName || apiRef.member?.memberName || apiRef.giver?.memberName || apiRef.nameOfReferral;
    const chapterName = apiRef.chapter?.name || 'Unknown Chapter';
    
    return {
      id: apiRef.id,
      title: `${memberName} - ${chapterName}`,
      type: apiRef.type || (apiRef.memberId === apiRef.receiverId ? 'given' : 'received'), // Use API type or determine based on relationship
      company: chapterName,
      contact: memberName,
      email: apiRef.email || '',
      phone: apiRef.mobile1 || '',
      relationship: apiRef.self ? 'Self' : 'Member',
      notes: apiRef.remarks || '',
      dateAdded: apiRef.date,
      urgency: apiRef.urgency,
      status: apiRef.status || 'pending',
    };
  };

  const loadReferences = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Try to fetch from API first
      try {
        console.log('Fetching references from API...');
        
        let allReferences: ApiReference[] = [];
        
        // Get current user's memberId from AsyncStorage
        const userData = await AsyncStorage.getItem('user_data');
        let memberId = null;
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            memberId = parsedUser?.member?.id || parsedUser?.memberId;
            console.log('Retrieved memberId from user data:', memberId);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        const limit = 50; // References per page
        
        // Fetch given references - use self=false, don't pass memberId
        const givenResponse = await apiService.get<any>(`/api/references/given?page=1&limit=${limit}&search=${searchQuery}&self=false`);
        console.log('Given References API Response:', JSON.stringify(givenResponse, null, 2));
        
        // Fetch received references - pass memberId
        const receivedResponse = await apiService.get<any>(`/api/references/received?memberId=${memberId}&page=1&limit=${limit}&search=${searchQuery}`);
        console.log('Received References API Response:', JSON.stringify(receivedResponse, null, 2));
        
        // Process given references
        let givenReferences: ApiReference[] = [];
        if (givenResponse && givenResponse.data && Array.isArray(givenResponse.data.references)) {
          givenReferences = givenResponse.data.references.map((ref: any) => ({ ...ref, type: 'given' }));
        } else if (givenResponse && Array.isArray(givenResponse.references)) {
          givenReferences = givenResponse.references.map((ref: any) => ({ ...ref, type: 'given' }));
        } else if (Array.isArray(givenResponse)) {
          givenReferences = givenResponse.map((ref: any) => ({ ...ref, type: 'given' }));
        } else if (givenResponse && givenResponse.data && Array.isArray(givenResponse.data)) {
          givenReferences = givenResponse.data.map((ref: any) => ({ ...ref, type: 'given' }));
        }
        
        // Process received references
        let receivedReferences: ApiReference[] = [];
        if (receivedResponse && receivedResponse.data && Array.isArray(receivedResponse.data.references)) {
          receivedReferences = receivedResponse.data.references.map((ref: any) => ({ ...ref, type: 'received' }));
        } else if (receivedResponse && Array.isArray(receivedResponse.references)) {
          receivedReferences = receivedResponse.references.map((ref: any) => ({ ...ref, type: 'received' }));
        } else if (Array.isArray(receivedResponse)) {
          receivedReferences = receivedResponse.map((ref: any) => ({ ...ref, type: 'received' }));
        } else if (receivedResponse && receivedResponse.data && Array.isArray(receivedResponse.data)) {
          receivedReferences = receivedResponse.data.map((ref: any) => ({ ...ref, type: 'received' }));
        }
        
        // Combine both types of references
        allReferences = [...givenReferences, ...receivedReferences];
        
        console.log('Total references loaded:', allReferences.length, '(Given:', givenReferences.length, ', Received:', receivedReferences.length, ')');
        
        // Transform API data to display format
        const transformedReferences = allReferences.map(transformApiReference);
        setReferences(transformedReferences);
        
        // Cache both the original API data and transformed data
        await AsyncStorage.setItem('references_cache', JSON.stringify(transformedReferences));
        await AsyncStorage.setItem('references_api_cache', JSON.stringify(allReferences));
        
      } catch (apiError) {
        console.log('API fetch failed, trying cache and fallback...', apiError);
        
        // Try cached data first
        const cachedData = await AsyncStorage.getItem('references_cache');
        if (cachedData) {
          console.log('Using cached reference data');
          setReferences(JSON.parse(cachedData));
        } else {
          // Fallback to old AsyncStorage format for backward compatibility
          const stored = await AsyncStorage.getItem('references');
          if (stored) {
            console.log('Using legacy AsyncStorage data');
            setReferences(JSON.parse(stored));
          } else {
            console.log('No cached data found, using empty state');
            setReferences([]);
            
            // Show a toast to inform user about the connection issue
            Toast.show({
              type: 'info',
              text1: 'Connection Issue',
              text2: 'Unable to load references. Please check your connection.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading references:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load references',
      });
      setReferences([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferences(false);
  };

  useEffect(() => {
    loadReferences();
  }, []);

  // Reload references when the screen comes into focus (after adding/editing)
  useFocusEffect(
    React.useCallback(() => {
      // Only reload if we're not currently loading
      if (!loading) {
        loadReferences(false);
      }
    }, [loading])
  );

  const filteredReferences = references.filter(ref => {
    const matchesSearch = ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || ref.type === selectedTab;
    return matchesSearch && matchesTab;
  });

  // Format status display name
  const formatStatusDisplay = (status?: string) => {
    if (!status) return 'PENDING';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'business done') {
      return 'MARK DONE DEAL';
    }
    return status.toUpperCase();
  };

  // Get status badge color
  const getStatusColor = (status?: string) => {
    if (!status) return colors.warning;
    switch (status.toLowerCase()) {
      case 'pending':
        return colors.warning;
      case 'contacted':
        return colors.info;
      case 'business done':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  function renderReference({ item }: { item: Reference }) {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={[styles.referenceCard, { backgroundColor: cardColor, borderColor: colors.border }]}
        onPress={() => router.push(`/references/detail?id=${item.id}`)}
      >
        <View style={styles.referenceHeader}>
          <ThemedText type="defaultSemiBold" style={styles.referenceTitle}>
            {item.title}
          </ThemedText>
          <View style={styles.badgeContainer}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: item.type === 'given' ? colors.success : colors.info }
            ]}>
              <ThemedText style={[styles.typeBadgeText, { color: 'white' }]}>
                {item.type.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {formatStatusDisplay(item.status)}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.referenceCompany}>{item.company}</ThemedText>
        <ThemedText style={styles.referenceContact}>{item.contact}</ThemedText>
        <ThemedText style={styles.referenceDate}>
          Added: {new Date(item.dateAdded).toLocaleDateString()}
        </ThemedText>
      </TouchableOpacity>
    );
  }

  function renderTabButton(tab: 'all' | 'given' | 'received', title: string) {
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === tab && { backgroundColor: colors.primary },
          { borderColor: colors.border }
        ]}
        onPress={() => setSelectedTab(tab)}
      >
        <ThemedText
          style={[
            styles.tabButtonText,
            selectedTab === tab && { color: 'white' }
          ]}
        >
          {title}
        </ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="References" />
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search references..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {renderTabButton('all', 'All')}
        {renderTabButton('given', 'Given')}
        {renderTabButton('received', 'Received')}
      </View>

      {/* References List */}
      <FlatList
        data={filteredReferences}
        keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
        renderItem={renderReference}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
            {loading ? (
              <>
                <IconSymbol name="arrow.clockwise" size={50} color={colors.icon} />
                <ThemedText style={styles.emptyText}>Loading references...</ThemedText>
                <ThemedText style={styles.emptySubtext}>Please wait</ThemedText>
              </>
            ) : (
              <>
                <IconSymbol name="doc.text" size={50} color={colors.icon} />
                <ThemedText style={styles.emptyText}>No references found</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  {searchQuery ? 'Try adjusting your search' : 'Add your first reference'}
                </ThemedText>
              </>
            )}
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/references/add')}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  referenceCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  referenceTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusRow: {
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  referenceCompany: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
    opacity: 0.75,
  },
  referenceContact: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.65,
  },
  referenceDate: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
});
