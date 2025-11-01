import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';

const ZONE_ROLE_TYPES = {
  REGIONAL_DIRECTOR: 'Regional Director',
  JOINT_SECRETARY: 'Joint Secretary',
};

const DC = {
  bg_primary: '#0F172A',
  bg_secondary: '#1E293B',
  bg_tertiary: '#334155',
  primary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#06B6D4',
  error: '#EF4444',
  text_primary: '#FFFFFF',
  text_secondary: '#CBD5E1',
  text_tertiary: '#94A3B8',
  text_quaternary: '#64748B',
  border: 'rgba(255, 255, 255, 0.05)',
  border_emphasis: 'rgba(255, 255, 255, 0.1)',
};

export default function EditRegionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
      Alert.alert('Error', 'Failed to load region data');
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
      Alert.alert('Error', 'Failed to load chapters');
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
      Alert.alert('Error', 'Failed to search members');
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
      Alert.alert('Success', 'Region updated successfully');
    } catch (error) {
      console.error('Error updating region:', error);
      Alert.alert('Error', 'Failed to update region');
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
      Alert.alert('Error', 'Please select a member and role type');
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
      
      Alert.alert('Success', 'Role assigned successfully');

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
      Alert.alert('Error', 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setMemberSearchInput(member.memberName);
    setSearchedMembers([]);
  };

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? DC.bg_primary : colors.background;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={DC.text_primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Region</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DC.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={DC.text_primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Region</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{roles.length} ROLES</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ opacity: fadeAnim }}
        >
          {/* Region Details Section */}
          <View style={[styles.card, { backgroundColor: isDark ? DC.bg_secondary : colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: DC.info + '20' }]}>
                <IconSymbol name="globe" size={20} color={DC.info} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: isDark ? DC.text_primary : colors.text }]}>
                  Region Details
                </Text>
                <Text style={[styles.cardSubtitle, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                  Update the region's basic information
                </Text>
              </View>
            </View>
            
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                REGION NAME <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? DC.bg_tertiary : colors.surface,
                    color: isDark ? DC.text_primary : colors.text,
                    borderColor: nameError ? DC.error : DC.border_emphasis,
                  },
                ]}
                placeholder="Enter region name"
                placeholderTextColor={DC.text_quaternary}
                value={regionName}
                onChangeText={(text) => {
                  setRegionName(text);
                  if (nameError) setNameError('');
                }}
                editable={!submitting}
                autoCapitalize="words"
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : (
                <Text style={styles.helperText}>
                  This name will be used throughout the system
                </Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleUpdateRegion}
              disabled={submitting}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
                {submitting ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Updating...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={16} color="white" />
                    <Text style={styles.buttonText}>Update Region</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Roles Section */}
          <View style={[styles.card, { backgroundColor: isDark ? DC.bg_secondary : colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: DC.primary + '20' }]}>
                <IconSymbol name="person.2.fill" size={20} color={DC.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: isDark ? DC.text_primary : colors.text }]}>
                  Assigned Roles
                </Text>
                <Text style={[styles.cardSubtitle, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                  {roles.length} {roles.length === 1 ? 'role' : 'roles'} currently assigned
                </Text>
              </View>
            </View>

            {roles.length > 0 ? (
              <View style={styles.rolesList}>
                {roles.map((role, index) => (
                  <View
                    key={role.assignmentId}
                    style={[
                      styles.roleItem,
                      index < roles.length - 1 && { borderBottomWidth: 1, borderBottomColor: DC.border },
                    ]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: DC.success + '15' }]}>
                      <IconSymbol name="person.fill" size={20} color={DC.success} />
                    </View>
                    <View style={styles.roleContent}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{role.roleType}</Text>
                      </View>
                      <Text style={[styles.roleName, { color: isDark ? DC.text_primary : colors.text }]}>
                        {role.memberName}
                      </Text>
                      {role.organizationName && (
                        <Text style={[styles.roleOrg, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                          {role.organizationName}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.replaceButton,
                        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                      ]}
                      onPress={() => handleInitiateReplacement(role)}
                    >
                      <Text style={styles.replaceButtonText}>Replace</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="person.badge.plus" size={48} color={DC.text_quaternary} />
                <Text style={[styles.emptyStateTitle, { color: isDark ? DC.text_primary : colors.text }]}>
                  No roles assigned yet
                </Text>
                <Text style={[styles.emptyStateText, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                  Use the form below to assign roles to members
                </Text>
              </View>
            )}
          </View>

          {/* Role Assignment Form */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? DC.bg_secondary : colors.card },
              replacingRole && {
                borderColor: DC.primary,
                borderWidth: 2,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: DC.warning + '20' }]}>
                <IconSymbol name={replacingRole ? "arrow.triangle.2.circlepath" : "plus.circle.fill"} size={20} color={DC.warning} />
              </View>
              <View style={[styles.cardHeaderText, { flex: 1 }]}>
                <Text style={[styles.cardTitle, { color: isDark ? DC.text_primary : colors.text }]}>
                  {replacingRole ? `Replace: ${replacingRole.roleType}` : 'Assign New Role'}
                </Text>
                <Text style={[styles.cardSubtitle, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                  {replacingRole ? 'Select a new member for this role' : 'Add a member to a leadership role'}
                </Text>
              </View>
              {replacingRole && (
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => setReplacingRole(null)}
                >
                  <IconSymbol name="xmark" size={16} color={DC.text_secondary} />
                </Pressable>
              )}
            </View>

            {replacingRole && (
              <View style={styles.replacingInfo}>
                <Text style={[styles.replacingInfoText, { color: isDark ? DC.text_secondary : '#333' }]}>
                  Currently: {replacingRole.memberName}
                  {replacingRole.organizationName && ` (${replacingRole.organizationName})`}
                </Text>
              </View>
            )}

            {/* Chapter Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                SELECT CHAPTER <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? DC.bg_tertiary : colors.surface, borderColor: DC.border_emphasis }]}>
                <Picker
                  selectedValue={selectedChapterId}
                  onValueChange={(value) => {
                    setSelectedChapterId(value);
                    setSelectedMember(null);
                    setMemberSearchInput('');
                  }}
                  style={[styles.picker, { color: isDark ? DC.text_primary : colors.text }]}
                  dropdownIconColor={isDark ? DC.text_secondary : colors.text}
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
              <Text style={styles.label}>
                SEARCH MEMBER <Text style={styles.required}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? DC.bg_tertiary : colors.surface,
                      color: isDark ? DC.text_primary : colors.text,
                      borderColor: DC.border_emphasis,
                    },
                  ]}
                  placeholder={selectedChapterId ? 'Type member name...' : 'Select a chapter first'}
                  placeholderTextColor={DC.text_quaternary}
                  value={memberSearchInput}
                  onChangeText={setMemberSearchInput}
                  editable={!!selectedChapterId}
                />
                {searchingMembers && (
                  <ActivityIndicator
                    style={styles.searchIndicator}
                    size="small"
                    color={DC.primary}
                  />
                )}
              </View>

              {searchedMembers.length > 0 && !selectedMember && (
                <View style={[styles.searchResults, { backgroundColor: isDark ? DC.bg_tertiary : colors.card, borderColor: DC.border_emphasis }]}>
                  {searchedMembers.map((member) => (
                    <Pressable
                      key={member.id}
                      style={({ pressed }) => [
                        styles.searchResultItem,
                        pressed && { backgroundColor: isDark ? DC.bg_tertiary : colors.surface, opacity: 0.8 },
                      ]}
                      onPress={() => handleSelectMember(member)}
                    >
                      <Text style={[styles.searchResultName, { color: isDark ? DC.text_primary : colors.text }]}>
                        {member.memberName}
                      </Text>
                      <Text style={[styles.searchResultOrg, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                        {member.organizationName || 'No Organization'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {selectedMember && (
                <View style={[styles.selectedMember, { backgroundColor: DC.success + '15', borderColor: DC.success + '40' }]}>
                  <View style={[styles.iconContainer, { backgroundColor: DC.success + '20', width: 36, height: 36 }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={DC.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectedName, { color: isDark ? DC.text_primary : colors.text }]}>
                      {selectedMember.memberName}
                    </Text>
                    {selectedMember.organizationName && (
                      <Text style={[styles.selectedOrg, { color: isDark ? DC.text_tertiary : colors.placeholder }]}>
                        {selectedMember.organizationName}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.clearButton,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => setSelectedMember(null)}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Role Type Selection */}
            {!replacingRole && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  ROLE TYPE <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: isDark ? DC.bg_tertiary : colors.surface, borderColor: DC.border_emphasis }]}>
                  <Picker
                    selectedValue={selectedRoleType}
                    onValueChange={setSelectedRoleType}
                    style={[styles.picker, { color: isDark ? DC.text_primary : colors.text }]}
                    enabled={!!selectedMember}
                    dropdownIconColor={isDark ? DC.text_secondary : colors.text}
                  >
                    <Picker.Item label="-- Select Role Type --" value="" />
                    {Object.entries(ZONE_ROLE_TYPES).map(([key, value]) => (
                      <Picker.Item key={key} label={value} value={value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                (assigningRole || !selectedMember || !selectedRoleType || !selectedChapterId) && {
                  opacity: 0.5,
                },
              ]}
              onPress={handleAssignRole}
              disabled={
                assigningRole || !selectedMember || !selectedRoleType || !selectedChapterId
              }
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
                {assigningRole ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <IconSymbol name="person.badge.plus" size={16} color="white" />
                    <Text style={styles.buttonText}>
                      {replacingRole ? 'Replace Role' : 'Assign Role'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: DC.text_primary,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: DC.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DC.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: DC.text_secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DC.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
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
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: DC.text_quaternary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  required: {
    color: DC.error,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: DC.text_quaternary,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: DC.error,
    marginTop: 6,
    fontWeight: '500',
  },
  loadingBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: DC.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {},
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DC.text_primary,
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
  rolesList: {
    gap: 0,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleContent: {
    flex: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DC.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleOrg: {
    fontSize: 12,
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
    gap: 6,
  },
  roleBadge: {
    backgroundColor: DC.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleType: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  orgName: {
    fontSize: 13,
  },
  replaceButton: {
    backgroundColor: DC.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replaceButtonText: {
    color: 'white',
    fontWeight: '600',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  emptyRolesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyRolesIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noRolesText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noRolesSubtext: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  replacingInfo: {
    backgroundColor: DC.info + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DC.info + '40',
  },
  replacingInfoText: {
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  searchIndicator: {
    position: 'absolute',
    right: 16,
    top: 14,
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
    maxHeight: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
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
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedOrg: {
    fontSize: 13,
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DC.primary,
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
