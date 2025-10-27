import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import {
  RoleType,
  ROLE_TYPES,
  getChapterRoleHistory,
  ChapterRoleHistory as ChapterRoleHistoryType,
} from '@/services/chapterRoleService';

interface ChapterRoleHistoryProps {
  chapterId: number;
  onBack: () => void;
}

type ViewMode = 'timeline' | 'member' | 'role';
type SortOrder = 'asc' | 'desc';

export default function ChapterRoleHistory({ chapterId, onBack }: ChapterRoleHistoryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roleHistory, setRoleHistory] = useState<ChapterRoleHistoryType[]>([]);
  const [selectedRoleType, setSelectedRoleType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load history
  React.useEffect(() => {
    loadHistory();
  }, [chapterId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getChapterRoleHistory(chapterId);
      setRoleHistory(data);
      // Expand all groups by default
      const allGroups = new Set<string>();
      if (viewMode === 'timeline') {
        allGroups.add('All Events');
      }
      setExpandedGroups(allGroups);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...roleHistory];

    if (selectedRoleType !== 'all') {
      filtered = filtered.filter((item) => item.roleType === selectedRoleType);
    }

    if (selectedAction !== 'all') {
      filtered = filtered.filter((item) => item.action === selectedAction);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [roleHistory, selectedRoleType, selectedAction, sortOrder]);

  // Group history
  const groupedHistory = useMemo(() => {
    if (viewMode === 'timeline') {
      return { 'All Events': filteredHistory };
    } else if (viewMode === 'member') {
      return filteredHistory.reduce((acc, item) => {
        const memberName = item.member.memberName;
        if (!acc[memberName]) acc[memberName] = [];
        acc[memberName].push(item);
        return acc;
      }, {} as Record<string, typeof filteredHistory>);
    } else if (viewMode === 'role') {
      return filteredHistory.reduce((acc, item) => {
        const roleType = ROLE_TYPES[item.roleType as RoleType] || item.roleType;
        if (!acc[roleType]) acc[roleType] = [];
        acc[roleType].push(item);
        return acc;
      }, {} as Record<string, typeof filteredHistory>);
    }
    return {};
  }, [filteredHistory, viewMode]);

  // Get unique actions
  const actions = useMemo(() => {
    const uniqueActions = new Set(roleHistory.map((item) => item.action));
    return Array.from(uniqueActions);
  }, [roleHistory]);

  const getRoleColor = (roleType: string): string => {
    const colorMap: Record<string, string> = {
      chapterHead: '#3B82F6',
      secretary: '#10B981',
      treasurer: '#8B5CF6',
      guardian: '#F59E0B',
      developmentCoordinator: '#14B8A6',
      businessDevelopmentCoordinator: '#F97316',
      membershipCommitteeCoordinator: '#EC4899',
      referenceCommitteeCoordinator: '#6366F1',
      socialMediaCoordinator: '#06B6D4',
    };
    return colorMap[roleType] || '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading role history...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: '#EF4444' }]}>
            Error loading role history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Role Assignment History
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          Complete history of role assignments and changes
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* View Mode Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: viewMode === 'timeline' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setViewMode('timeline')}
          >
            <Text
              style={[
                styles.tabText,
                { color: viewMode === 'timeline' ? 'white' : colors.text },
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: viewMode === 'member' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setViewMode('member')}
          >
            <Text
              style={[
                styles.tabText,
                { color: viewMode === 'member' ? 'white' : colors.text },
              ]}
            >
              By Member
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: viewMode === 'role' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setViewMode('role')}
          >
            <Text
              style={[
                styles.tabText,
                { color: viewMode === 'role' ? 'white' : colors.text },
              ]}
            >
              By Role
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filters:</Text>
          
          <View style={[styles.pickerWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedRoleType}
              onValueChange={setSelectedRoleType}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="All Roles" value="all" />
              {Object.entries(ROLE_TYPES).map(([value, label]) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          </View>

          <View style={[styles.pickerWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedAction}
              onValueChange={setSelectedAction}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="All Actions" value="all" />
              {actions.map((action) => (
                <Picker.Item
                  key={action}
                  label={action.charAt(0).toUpperCase() + action.slice(1)}
                  value={action}
                />
              ))}
            </Picker>
          </View>

          <View style={[styles.pickerWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="Newest First" value="desc" />
              <Picker.Item label="Oldest First" value="asc" />
            </Picker>
          </View>
        </View>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
              No role history found with the selected filters.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {Object.entries(groupedHistory).map(([group, items]) => (
              <View key={group} style={styles.groupContainer}>
                <TouchableOpacity
                  style={[styles.groupHeader, { backgroundColor: colors.surface }]}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group}
                  </Text>
                  <Text style={[styles.groupCount, { color: colors.placeholder }]}>
                    ({items.length} event{items.length !== 1 ? 's' : ''})
                  </Text>
                  <Text style={[styles.chevron, { color: colors.text }]}>
                    {expandedGroups.has(group) ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedGroups.has(group) && (
                  <View style={styles.groupContent}>
                    {items.map((item, index) => {
                      const roleColor = getRoleColor(item.roleType);
                      return (
                        <View key={item.id} style={styles.historyItem}>
                          <View
                            style={[
                              styles.timelineLine,
                              { backgroundColor: roleColor },
                            ]}
                          />
                          <View
                            style={[
                              styles.timelineDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                          <View style={styles.historyItemContent}>
                            <View style={styles.historyItemHeader}>
                              <View
                                style={[
                                  styles.roleBadge,
                                  { backgroundColor: roleColor + '20' },
                                ]}
                              >
                                <Text
                                  style={[styles.roleBadgeText, { color: roleColor }]}
                                >
                                  {ROLE_TYPES[item.roleType as RoleType] || item.roleType}
                                </Text>
                              </View>
                              <Text
                                style={[styles.actionText, { color: colors.text }]}
                              >
                                {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                              </Text>
                            </View>

                            <View style={styles.memberInfo}>
                              <Text style={[styles.memberName, { color: colors.text }]}>
                                👤 {item.member.memberName}
                              </Text>
                              <Text
                                style={[styles.memberEmail, { color: colors.placeholder }]}
                              >
                                {item.member.email}
                              </Text>
                            </View>

                            <View style={styles.historyItemFooter}>
                              <Text
                                style={[styles.dateText, { color: colors.placeholder }]}
                              >
                                📅 {formatDate(item.startDate)}
                              </Text>
                              {item.performedByName && (
                                <Text
                                  style={[
                                    styles.performedByText,
                                    { color: colors.placeholder },
                                  ]}
                                >
                                  🕒 By {item.performedByName}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  emptyState: {
    padding: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  historyList: {
    gap: 16,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  groupCount: {
    fontSize: 12,
    marginRight: 8,
  },
  chevron: {
    fontSize: 12,
  },
  groupContent: {
    paddingLeft: 8,
    paddingTop: 12,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: -16,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    marginRight: 12,
    zIndex: 1,
  },
  historyItemContent: {
    flex: 1,
    paddingBottom: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  memberInfo: {
    marginBottom: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
  },
  historyItemFooter: {
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  performedByText: {
    fontSize: 11,
  },
});
