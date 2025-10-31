import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { requirementService, Requirement } from '@/services/requirementService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RequirementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadRequirements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await requirementService.getAllRequirements();
      setRequirements(data);
      setFilteredRequirements(data);
    } catch (error) {
      console.error('Error loading requirements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Search filter
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredRequirements(requirements);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = requirements.filter((req) =>
        req.heading.toLowerCase().includes(searchLower) ||
        req.requirement.toLowerCase().includes(searchLower) ||
        req.member?.memberName?.toLowerCase().includes(searchLower)
      );
      setFilteredRequirements(filtered);
    }
  }, [search, requirements]);

  const onRefresh = () => {
    loadRequirements(true);
  };

  const handleViewDetails = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setDetailModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRequirementCard = ({ item }: { item: Requirement }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleViewDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.heading}
        </Text>
        <Text style={[styles.cardDate, { color: colors.placeholder }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {item.member?.memberName && (
        <View style={styles.memberRow}>
          <Text style={[styles.memberLabel, { color: colors.placeholder }]}>👤 Member: </Text>
          <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
            {item.member.memberName}
          </Text>
        </View>
      )}

      <Text style={[styles.cardDescription, { color: colors.text }]} numberOfLines={3}>
        {item.requirement}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <NavigationHeader title="Requirements" backPath="/(tabs)/_modules" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading requirements...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleAddPress = () => {
    router.push('/modules/requirements/add' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader 
        title="Requirements" 
        backPath="/(tabs)/_modules"
        rightComponent={
          <TouchableOpacity
            onPress={handleAddPress}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            placeholder="Search by member, heading, requirement..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Requirements List */}
        <FlatList
          data={filteredRequirements}
          renderItem={renderRequirementCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 20 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                {search ? 'No requirements found matching your search.' : 'No requirements available.'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Requirement Details
              </Text>
              <Pressable
                onPress={() => setDetailModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedRequirement && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                      Heading
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedRequirement.heading}
                    </Text>
                  </View>

                  {selectedRequirement.member?.memberName && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                        👤 Member
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {selectedRequirement.member.memberName}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                      📅 Created At
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDate(selectedRequirement.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                      Requirement
                    </Text>
                    <Text style={[styles.detailRequirement, { color: colors.text }]}>
                      {selectedRequirement.requirement}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    fontSize: 18,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 15,
    borderWidth: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberLabel: {
    fontSize: 13,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#999',
  },
  modalScrollView: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailRequirement: {
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
