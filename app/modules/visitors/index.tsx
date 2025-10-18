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
import { NavigationHeader } from '@/components/NavigationHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';
import Toast from 'react-native-toast-message';

interface Visitor {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  organization?: string;
  meetingDate?: string;
  status?: string;
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

      // TODO: Replace with actual API endpoint
      const response = await apiService.get('/api/visitors');
      setVisitors(response.data || []);
    } catch (error) {
      console.error('Error loading visitors:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load visitors',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    loadVisitors(true);
  }

  function renderVisitor({ item }: { item: Visitor }) {
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
          <ThemedText style={styles.visitorName}>{item.name}</ThemedText>
          {item.organization && (
            <ThemedText style={styles.visitorOrg}>{item.organization}</ThemedText>
          )}
          <View style={styles.contactRow}>
            <IconSymbol name="phone" size={14} color={colors.icon} />
            <ThemedText style={styles.visitorContact}>{item.mobile}</ThemedText>
          </View>
          {item.meetingDate && (
            <View style={styles.dateRow}>
              <IconSymbol name="calendar" size={14} color={colors.icon} />
              <ThemedText style={styles.visitorDate}>
                {new Date(item.meetingDate).toLocaleDateString()}
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
        <NavigationHeader title="Visitors" />
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading visitors...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader 
        title="Visitors" 
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/modules/visitors/create' as any)}>
            <IconSymbol name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={visitors}
        renderItem={renderVisitor}
        keyExtractor={(item) => item.id}
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
  visitorName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  visitorOrg: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  visitorContact: {
    fontSize: 13,
    opacity: 0.7,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitorDate: {
    fontSize: 13,
    opacity: 0.7,
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
