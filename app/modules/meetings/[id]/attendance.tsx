import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { get, post } from '@/services/apiService';

interface Member {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  isPresent: boolean;
}

interface AttendanceData {
  meeting: {
    id: number;
    meetingTitle: string;
    date: string;
    meetingTime: string;
  };
  members: Member[];
}

interface AttendanceApiResponse {
  success: boolean;
  data: AttendanceData;
  status: number;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  useEffect(() => {
    if (search.trim()) {
      setFilteredMembers(
        members.filter((member) =>
          member.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredMembers(members);
    }
  }, [search, members]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await get<AttendanceApiResponse>(`/api/chapter-meetings/${id}/attendance`);
      setMeeting(response.data?.meeting);
      setMembers(response.data?.members || []);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch attendance data', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (memberId: number) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, isPresent: !member.isPresent } : member
      )
    );
  };

  const toggleAll = () => {
    const allPresent = members.every((m) => m.isPresent);
    setMembers((prev) =>
      prev.map((member) => ({ ...member, isPresent: !allPresent }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attendance = members
        .filter((m) => m.isPresent)
        .map((m) => ({ memberId: m.id }));

      await post(`/api/chapter-meetings/${id}/attendance`, { attendance });
      Alert.alert('Success', 'Attendance saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = members.filter((m) => m.isPresent).length;
  const totalCount = members.length;

  const renderMember = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[
        styles.memberCard,
        {
          backgroundColor: item.isPresent ? colors.success + '10' : colors.card,
          borderColor: item.isPresent ? colors.success : colors.border,
        },
      ]}
      onPress={() => toggleAttendance(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.memberInfo}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: item.isPresent ? colors.success : 'transparent',
              borderColor: item.isPresent ? colors.success : colors.border,
            },
          ]}
        >
          {item.isPresent && (
            <IconSymbol name="checkmark" size={16} color="white" />
          )}
        </View>
        <View style={styles.memberDetails}>
          <Text style={[styles.memberName, { color: colors.text }]}>
            {item.name}
          </Text>
          {item.email && (
            <Text style={[styles.memberContact, { color: colors.placeholder }]}>
              {item.email}
            </Text>
          )}
          {item.phone && (
            <Text style={[styles.memberContact, { color: colors.placeholder }]}>
              {item.phone}
            </Text>
          )}
        </View>
      </View>
      {item.isPresent && (
        <View style={[styles.presentBadge, { backgroundColor: colors.success }]}>
          <Text style={styles.presentBadgeText}>Present</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={styles.headerTitle}>Attendance</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.placeholder }]}>
            Loading attendance...
          </Text>
        </View>
      </View>
    );
  }

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Attendance</Text>
            {meeting && (
              <Text style={styles.headerSubtitle}>{meeting.meetingTitle}</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {presentCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Present</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalCount - presentCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Absent</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {totalCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Total</Text>
        </View>
      </View>

      {/* Search & Toggle All */}
      <View style={styles.controlsContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search members..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.toggleAllButton, { backgroundColor: colors.primary }]}
          onPress={toggleAll}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={members.every((m) => m.isPresent) ? 'checkmark.square.fill' : 'square'}
            size={18}
            color="white"
          />
          <Text style={styles.toggleAllText}>Toggle All</Text>
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMember}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="person.3" size={64} color={colors.placeholder} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {search ? 'No members found' : 'No members available'}
            </Text>
          </View>
        }
      />

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Attendance</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  toggleAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  toggleAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 12,
  },
  presentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presentBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
