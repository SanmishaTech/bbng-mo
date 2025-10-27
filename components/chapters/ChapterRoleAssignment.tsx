import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ChapterRoleHistory from './ChapterRoleHistory';
import {
  RoleType,
  ROLE_TYPES,
  getChapterRoles,
  assignChapterRole,
  getMembers,
  Member,
  ChapterRole,
} from '@/services/chapterRoleService';
import Toast from 'react-native-toast-message';

interface ChapterRoleAssignmentProps {
  chapterId: number;
}

export default function ChapterRoleAssignment({ chapterId }: ChapterRoleAssignmentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [chapterRoles, setChapterRoles] = useState<ChapterRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [replacingRoleId, setReplacingRoleId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load chapter roles
  const loadChapterRoles = useCallback(async () => {
    try {
      setLoading(true);
      const roles = await getChapterRoles(chapterId);
      setChapterRoles(roles);
    } catch (error) {
      console.error('Error loading chapter roles:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load chapter roles',
      });
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadChapterRoles();
  }, [loadChapterRoles]);

  // Search members
  useEffect(() => {
    if (debouncedQuery.length > 0 && selectedRole) {
      searchMembers();
    } else {
      setMembers([]);
    }
  }, [debouncedQuery, selectedRole]);

  const searchMembers = async () => {
    try {
      setLoadingMembers(true);
      const restrictedRoles: RoleType[] = ['chapterHead', 'secretary', 'treasurer'];
      const effectiveChapterId = selectedRole && restrictedRoles.includes(selectedRole)
        ? chapterId
        : undefined;
      
      const result = await getMembers(debouncedQuery, effectiveChapterId);
      setMembers(result);
    } catch (error) {
      console.error('Error searching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !selectedMemberId) return;

    try {
      setAssigning(true);
      await assignChapterRole(chapterId, selectedMemberId, selectedRole);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${ROLE_TYPES[selectedRole]} assigned successfully`,
      });
      
      // Reset and reload
      setAssignModalVisible(false);
      setSelectedRole(null);
      setSelectedMemberId(null);
      setSearchQuery('');
      setReplacingRoleId(null);
      loadChapterRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to assign role',
      });
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (roleType: RoleType, roleId?: number) => {
    setSelectedRole(roleType);
    setReplacingRoleId(roleId || null);
    setAssignModalVisible(true);
    setSearchQuery('');
    setSelectedMemberId(null);
  };

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

  // Show history view if toggled
  if (showHistory) {
    return (
      <ChapterRoleHistory
        chapterId={chapterId}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Chapter Role Assignments
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading role assignments...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Chapter Role Assignments
        </Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          Assign leadership and coordination roles to members
        </Text>
        <TouchableOpacity
          style={[styles.historyButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowHistory(true)}
        >
          <Text style={[styles.historyButtonText, { color: 'white' }]}>📋 View History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rolesGrid}>
        {Object.entries(ROLE_TYPES).map(([roleKey, roleName]) => {
          const role = chapterRoles.find((r) => r.roleType === roleKey);
          const roleColor = getRoleColor(roleKey);

          return (
            <View
              key={roleKey}
              style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  {roleName}
                </Text>
              </View>

              {role ? (
                <View style={styles.roleContent}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {role.member.memberName}
                  </Text>
                  <Text style={[styles.memberEmail, { color: colors.placeholder }]}>
                    {role.member.email}
                  </Text>
                  {role.member.mobile1 && (
                    <Text style={[styles.memberMobile, { color: colors.placeholder }]}>
                      {role.member.mobile1}
                    </Text>
                  )}
                  <Text style={[styles.assignedDate, { color: colors.placeholder }]}>
                    Assigned on {new Date(role.assignedAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    style={[styles.replaceButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                    onPress={() => openAssignModal(roleKey as RoleType, role.id)}
                  >
                    <Text style={[styles.replaceButtonText, { color: colors.primary }]}>
                      Replace Assignment
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => openAssignModal(roleKey as RoleType)}
                >
                  <Text style={[styles.assignButtonText, { color: colors.placeholder }]}>
                    + Assign {roleName}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {replacingRoleId ? 'Replace' : 'Assign'} {selectedRole ? ROLE_TYPES[selectedRole] : 'Role'}
              </Text>
              <TouchableOpacity
                onPress={() => setAssignModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.placeholder }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Search Member</Text>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Search by name, email, or mobile..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />

              {searchQuery.length > 0 && (
                <Text style={[styles.searchResults, { color: colors.placeholder }]}>
                  {loadingMembers ? 'Searching...' : `${members.length} result${members.length !== 1 ? 's' : ''}`}
                </Text>
              )}

              <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
                {loadingMembers ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : searchQuery.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
                      Enter a name, email or phone number to search
                    </Text>
                  </View>
                ) : members.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
                      No members found
                    </Text>
                  </View>
                ) : (
                  members.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberItem,
                        { 
                          backgroundColor: selectedMemberId === member.id ? colors.primary + '10' : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSelectedMemberId(member.id)}
                    >
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberItemName, { color: colors.text }]}>
                          {member.memberName}
                        </Text>
                        <Text style={[styles.memberItemEmail, { color: colors.placeholder }]}>
                          {member.email}
                        </Text>
                        {member.mobile1 && (
                          <Text style={[styles.memberItemMobile, { color: colors.placeholder }]}>
                            {member.mobile1}
                          </Text>
                        )}
                      </View>
                      {selectedMemberId === member.id && (
                        <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setAssignModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { 
                    backgroundColor: colors.primary,
                    opacity: (!selectedMemberId || assigning) ? 0.5 : 1,
                  },
                ]}
                onPress={handleAssignRole}
                disabled={!selectedMemberId || assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {replacingRoleId ? 'Replace' : 'Assign'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  historyButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '700',
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
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    width: '48%',
    minHeight: 180,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleContent: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    marginBottom: 2,
  },
  memberMobile: {
    fontSize: 12,
    marginBottom: 8,
  },
  assignedDate: {
    fontSize: 11,
    marginBottom: 12,
  },
  replaceButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  replaceButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  assignButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 100,
  },
  assignButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchResults: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  membersList: {
    maxHeight: 250,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberItemEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  memberItemMobile: {
    fontSize: 12,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
