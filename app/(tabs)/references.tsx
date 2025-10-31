import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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

export default function ReferencesTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'given' | 'received'>('all');
  const isInitialMount = React.useRef(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'surface');

  useEffect(() => {
    loadReferences();
  }, []);

  // Reload references when tab comes into focus (after navigating back)
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        console.log('[References Tab] Skipping reload on initial mount');
        return;
      }
      
      console.log('[References Tab] Tab focused - reloading references');
      loadReferences();
    }, [])
  );

  const loadReferences = async () => {
    try {
      console.log('[References Tab] Loading references...');
      
      // Use the same cache key as the main references index page
      const cachedData = await AsyncStorage.getItem('references_cache');
      if (cachedData) {
        console.log('[References Tab] Using cached reference data');
        setReferences(JSON.parse(cachedData));
      } else {
        console.log('[References Tab] No cached data found, using empty state');
        setReferences([]);
      }
    } catch (error) {
      console.error('[References Tab] Error loading references:', error);
      setReferences([]);
    }
  };

  const filteredReferences = references.filter(ref => {
    const matchesSearch = ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || ref.type === selectedTab;
    return matchesSearch && matchesTab;
  });

  const handleReferencePress = (reference: Reference) => {
    router.push(`/references/detail?id=${reference.id}`);
  };
                                                                      
  const handleAddReference = () => {
    router.push('/references/add');
  };

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
        onPress={() => handleReferencePress(item)}
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
        keyExtractor={item => item.id}
        renderItem={renderReference}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={50} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No references found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first reference'}
            </ThemedText>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddReference}
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
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
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
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 80 : 100,
  },
  referenceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  referenceCompany: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  referenceContact: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  referenceDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
