import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getRegionById,
  updateRegion,
  getRegionRoles,
  fetchAllChapters,
  searchMembersForZoneAssignment,
  assignZoneRole,
  removeZoneRole,
  ChapterOption,
  MemberSearchResult,
  ZoneRoleAssignment,
  RegionDetailsWithRoles,
} from '@/services/regionService';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const ZONE_ROLE_TYPES = {
  REGIONAL_DIRECTOR: 'Regional Director',
  JOINT_SECRETARY: 'Joint Secretary',
};

export default function EditRegionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Region details state
  const [regionName, setRegionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  // Role management state
  const [roles, setRoles] = useState<ZoneRoleAssignment[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [searchedMembers, setSearchedMembers] = useState<MemberSearchResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState('');
  const [replacingRole, setReplacingRole] = useState<ZoneRoleAssignment | null>(null);
  const [assigningRole, setAssigningRole] = useState(false);
  const [searchingMembers, setSearchingMembers] = useState(false);

  useEffect(() => {
    if (id) {
      loadRegionData();
      loadChapters();
    }
  }, [id]);

  const loadRegionData = async () => {
    setLoading(true);
    try {
      const [regionData, rolesData] = await Promise.all([
        getRegionById(id as string),
        getRegionRoles(parseInt(id as string)),
      ]);
      setRegionName(regionData?.name || '');
      // Handle case where rolesData might be undefined or null
      setRoles(rolesData?.roles || []);
    } catch (error) {
      console.error('Error loading region:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load region data',
      });
      router.push('/modules/regions' as any);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    try {
      const chaptersData = await fetchAllChapters();
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load chapters',
      });
    }
  };

  const searchMembers = async (search: string) => {
    if (!selectedChapterId || !search.trim()) {
      setSearchedMembers([]);
      return;
    }

    setSearchingMembers(true);
    try {
      const members = await searchMembersForZoneAssignment(search, selectedChapterId);
      setSearchedMembers(members);
    } catch (error) {
      console.error('Error searching members:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to search members',
      });
    } finally {
      setSearchingMembers(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (memberSearchInput) {
        searchMembers(memberSearchInput);
      } else {
        setSearchedMembers([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [memberSearchInput, selectedChapterId]);

  const validate = () => {
    if (!regionName.trim()) {
      setNameError('Region name is required');
      return false;
    } else if (regionName.trim().length < 2) {
      setNameError('Region name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleUpdateRegion = async () => {
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      await updateRegion(id as string, { name: regionName.trim() });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Region updated successfully',
      });
    } catch (error) {
      console.error('Error updating region:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update region',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateReplacement = (role: ZoneRoleAssignment) => {
    setReplacingRole(role);
    setSelectedRoleType(role.roleType);
    setSelectedChapterId(null);
    setSelectedMember(null);
    setMemberSearchInput('');
    setSearchedMembers([]);
  };

  const handleAssignRole = async () => {
    if (!selectedMember || !selectedRoleType) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a member and role type',
      });
      return;
    }

    setAssigningRole(true);
    try {
      // Check if role is already assigned
      const existingRole = roles.find(r => r.roleType === selectedRoleType);
      
      // If replacing, remove old assignment first
      if (existingRole && existingRole.memberId !== selectedMember.id) {
        await removeZoneRole(existingRole.assignmentId);
      }

      // Assign new role
      await assignZoneRole(parseInt(id as string), selectedMember.id, selectedRoleType);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Role assigned successfully',
      });

      // Reset form
      setSelectedChapterId(null);
      setSelectedMember(null);
      setMemberSearchInput('');
      setSearchedMembers([]);
      setSelectedRoleType('');
      setReplacingRole(null);

      // Reload roles
      const rolesData = await getRegionRoles(parseInt(id as string));
      setRoles(rolesData?.roles || []);
    } catch (error) {
      console.error('Error assigning role:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to assign role',
      });
    } finally {
      setAssigningRole(false);
    }
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setMemberSearchInput(member.memberName);
    setSearchedMembers([]);
  };

  const backgroundColor = useThemeColor({}, 'background');

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader title="Edit Region" backPath="/modules/regions" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading region data...
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Manage Region" backPath="/modules/regions" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Region Details Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Region Details
            </Text>
            
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Region Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: nameError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter region name"
                placeholderTextColor={colors.placeholder}
                value={regionName}
                onChangeText={(text) => {
                  setRegionName(text);
                  if (nameError) setNameError('');
                }}
                editable={!submitting}
                autoCapitalize="words"
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
              onPress={handleUpdateRegion}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Update Region</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Roles Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Assigned Roles
            </Text>

            {roles.length > 0 ? (
              <View style={styles.rolesTable}>
                {roles.map((role) => (
                  <View
                    key={role.assignmentId}
                    style={[styles.roleRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.roleInfo}>
                      <Text style={[styles.roleType, { color: colors.text }]}>
                        {role.roleType}
                      </Text>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {role.memberName}
                      </Text>
                      {role.organizationName && (
                        <Text style={[styles.orgName, { color: colors.placeholder }]}>
                          {role.organizationName}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.replaceBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleInitiateReplacement(role)}
                    >
                      <Text style={styles.replaceBtnText}>Replace</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noRolesText, { color: colors.placeholder }]}>
                No roles assigned yet. Use the form below to assign roles.
              </Text>
            )}
          </View>

          {/* Role Assignment Form */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: replacingRole ? '#f8f9ff' : colors.card,
                borderColor: replacingRole ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {replacingRole ? `Replace Role: ${replacingRole.roleType}` : 'Assign New Role'}
              </Text>
              {replacingRole && (
                <TouchableOpacity onPress={() => setReplacingRole(null)}>
                  <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {replacingRole && (
              <View style={[styles.replacingInfo, { backgroundColor: '#e8f4fd' }]}>
                <Text style={styles.replacingInfoText}>
                  <Text style={styles.bold}>Currently assigned to:</Text> {replacingRole.memberName}
                  {replacingRole.organizationName && ` (${replacingRole.organizationName})`}
                </Text>
              </View>
            )}

            {/* Chapter Selection */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Select Chapter <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedChapterId}
                  onValueChange={(value) => {
                    setSelectedChapterId(value);
                    setSelectedMember(null);
                    setMemberSearchInput('');
                  }}
                  style={[styles.picker, { color: colors.text }]}
                >
                  <Picker.Item label="-- Select a Chapter --" value={null} />
                  {chapters.map((chapter) => (
                    <Picker.Item
                      key={chapter.id}
                      label={chapter.name}
                      value={chapter.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Member Search */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Search Member <Text style={styles.required}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: !selectedChapterId ? colors.surface : 'white',
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={
                    selectedChapterId
                      ? 'Type member name to search...'
                      : 'Select a chapter first'
                  }
                  placeholderTextColor={colors.placeholder}
                  value={memberSearchInput}
                  onChangeText={setMemberSearchInput}
                  editable={!!selectedChapterId}
                />
                {searchingMembers && (
                  <ActivityIndicator
                    style={styles.searchingIndicator}
                    size="small"
                    color={colors.primary}
                  />
                )}
              </View>

              {searchedMembers.length > 0 && !selectedMember && (
                <View style={[styles.searchResults, { backgroundColor: colors.card }]}>
                  {searchedMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectMember(member)}
                    >
                      <Text style={[styles.searchResultName, { color: colors.text }]}>
                        {member.memberName}
                      </Text>
                      <Text style={[styles.searchResultOrg, { color: colors.placeholder }]}>
                        {member.organizationName || 'No Organization'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedMember && (
                <View style={[styles.selectedMember, { backgroundColor: '#f0f7ff' }]}>
                  <View>
                    <Text style={[styles.selectedMemberName, { color: '#0050b3' }]}>
                      {selectedMember.memberName}
                    </Text>
                    {selectedMember.organizationName && (
                      <Text style={styles.selectedMemberOrg}>
                        {selectedMember.organizationName}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setSelectedMember(null)}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Role Type Selection */}
            {!replacingRole && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Role Type <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <Picker
                    selectedValue={selectedRoleType}
                    onValueChange={setSelectedRoleType}
                    style={[styles.picker, { color: colors.text }]}
                    enabled={!!selectedMember}
                  >
                    <Picker.Item label="-- Select Role Type --" value="" />
                    {Object.entries(ZONE_ROLE_TYPES).map(([key, value]) => (
                      <Picker.Item key={key} label={value} value={value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.assignBtn,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    assigningRole || !selectedMember || !selectedRoleType || !selectedChapterId
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={handleAssignRole}
              disabled={
                assigningRole || !selectedMember || !selectedRoleType || !selectedChapterId
              }
            >
              {assigningRole ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.assignBtnText}>
                  {replacingRole ? 'Replace Role' : 'Assign Role'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    color: '#F44336',
  },
  primaryBtn: {
    paddingVertical: 14,
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
    fontSize: 15,
  },
  rolesTable: {
    marginTop: 8,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  roleInfo: {
    flex: 1,
  },
  roleType: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  orgName: {
    fontSize: 13,
  },
  replaceBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replaceBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  noRolesText: {
    textAlign: 'center',
    fontSize: 15,
    marginVertical: 20,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  replacingInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  replacingInfoText: {
    fontSize: 14,
    color: '#333',
  },
  bold: {
    fontWeight: '700',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  searchingIndicator: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  searchResults: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultOrg: {
    fontSize: 13,
  },
  selectedMember: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedMemberName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedMemberOrg: {
    fontSize: 13,
    color: '#444',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  assignBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assignBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
