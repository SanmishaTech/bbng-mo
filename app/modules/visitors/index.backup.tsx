import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';
import Toast from 'react-native-toast-message';

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

export default function VisitorsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVisitors();
  }, []);

  async function loadVisitors(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response: any = await apiService.get('/api/visitors?page=1&limit=50');
      console.log('Visitors API Response:', response);
      
      // Handle the nested response structure
      if (response.success && response.data) {
        setVisitors(response.data.visitors || []);
      } else if (response.data && Array.isArray(response.data.visitors)) {
        setVisitors(response.data.visitors);
      } else if (Array.isArray(response.data)) {
        setVisitors(response.data);
      } else {
        setVisitors([]);
      }
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

  function onRefresh() {
    loadVisitors(true);
  }

  function renderVisitor({ item }: { item: Visitor }) {
    const statusColor = 
      item.status === 'Attended' ? colors.success :
      item.status === 'Invited' ? colors.warning :
      colors.info;

    return (
      <TouchableOpacity
        style={[styles.visitorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/modules/visitors/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
          <IconSymbol name="person.badge.plus" size={28} color={colors.info} />
        </View>
        <View style={styles.visitorInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.visitorName}>{item.name}</ThemedText>
            {item.status && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {item.status}
                </ThemedText>
              </View>
            )}
          </View>
          
          {item.category && (
            <ThemedText style={styles.visitorCategory}>{item.category}</ThemedText>
          )}
          
          {item.businessDetails && (
            <ThemedText style={styles.visitorBusiness} numberOfLines={1}>
              {item.businessDetails}
            </ThemedText>
          )}
          
          <View style={styles.detailsRow}>
            <View style={styles.contactRow}>
              <IconSymbol name="phone" size={14} color={colors.icon} />
              <ThemedText style={styles.visitorContact}>{item.mobile1}</ThemedText>
            </View>
            
            {item.meeting && (
              <View style={styles.meetingRow}>
                <IconSymbol name="calendar" size={14} color={colors.icon} />
                <ThemedText style={styles.visitorDate}>
                  {new Date(item.meeting.date).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
          </View>
          
          {item.invitedByMember && (
            <View style={styles.invitedByRow}>
              <IconSymbol name="person.circle" size={14} color={colors.icon} />
              <ThemedText style={styles.invitedByText}>
                Invited by {item.invitedByMember.memberName}
              </ThemedText>
            </View>
          )}
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.icon} />
      </TouchableOpacity>
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
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/modules/visitors/create' as any)}
        >
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={visitors}
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
              Add your first visitor to get started
            </ThemedText>
          </View>
        }
      />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  visitorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  visitorCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.85,
  },
  visitorBusiness: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitorContact: {
    fontSize: 13,
    opacity: 0.7,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitorDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  invitedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  invitedByText: {
    fontSize: 12,
    opacity: 0.65,
    fontStyle: 'italic',
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
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
});
