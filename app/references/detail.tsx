import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

// Updated interface to match the actual API data structure
interface ReferenceDetail {
  id: string;
  date: string;
  noOfReferences?: number | null;
  chapterId?: number;
  giverId?: number;
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
  createdAt?: string;
  updatedAt?: string;
  // Nested objects from API
  giver?: {
    id: number;
    memberName: string;
    email: string;
    organizationName: string;
  };
  receiver?: {
    id: number;
    memberName: string;
    email: string;
    organizationName: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
  statusHistory?: Array<{
    id: number;
    date: string;
    status: string;
    comment: string;
    referenceId: number;
    createdAt: string;
    updatedAt: string;
  }>;
  // For backward compatibility with AsyncStorage data
  title?: string;
  type?: 'given' | 'received';
  company?: string;
  contact?: string;
  phone?: string;
  relationship?: string;
  notes?: string;
  dateAdded?: string;
  memberId?: number; // for backward compatibility
}

export default function ReferenceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reference, setReference] = useState<ReferenceDetail | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'surface');

  useEffect(() => {
    const fetchReferenceDetail = async () => {
      try {
        console.log('Fetching reference detail for ID:', id);
        
        // First try to get from API
        try {
          const apiResponse = await apiService.get<any>(`/api/references/${id}`);
          console.log('API response (full):', JSON.stringify(apiResponse, null, 2));
          
          // Handle nested response structure
          let data;
          if (apiResponse && apiResponse.data) {
            data = apiResponse.data;
          } else {
            data = apiResponse;
          }
          
          console.log('Extracted reference detail data:', JSON.stringify(data, null, 2));
          setReference(data);
        } catch (apiError) {
          console.log('API fetch failed, trying cached data...', apiError);
          
          // Try API cache first (contains original API data structure)
          const apiCachedData = await AsyncStorage.getItem('references_api_cache');
          if (apiCachedData) {
            console.log('Found API cached reference data');
            const apiReferences = JSON.parse(apiCachedData);
            const foundReference = apiReferences.find((ref: any) => ref.id === id || ref.id === String(id));
            if (foundReference) {
              console.log('Found reference in API cache:', JSON.stringify(foundReference, null, 2));
              setReference(foundReference);
              return;
            }
          }
          
          // Try display cached data (from references list)
          const cachedData = await AsyncStorage.getItem('references_cache');
          if (cachedData) {
            console.log('Found cached reference data');
            const references = JSON.parse(cachedData);
            const foundReference = references.find((ref: any) => ref.id === id || ref.id === String(id));
            if (foundReference) {
              console.log('Found reference in cache:', JSON.stringify(foundReference, null, 2));
              setReference(foundReference);
              return;
            }
          }
          
          // Fallback to legacy AsyncStorage (for backward compatibility)
          const stored = await AsyncStorage.getItem('references');
          if (stored) {
            console.log('Found legacy reference data');
            const references = JSON.parse(stored);
            const foundReference = references.find((ref: any) => ref.id === id || ref.id === String(id));
            if (foundReference) {
              console.log('Found reference in legacy storage:', JSON.stringify(foundReference, null, 2));
              setReference(foundReference);
              return;
            }
          }
          
          throw new Error('Reference not found in any storage');
        }
      } catch (error) {
        console.error('Failed to fetch reference detail', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch reference detail',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReferenceDetail();
    }
  }, [id]);

  const handleEdit = () => {
    router.push(`/references/edit?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reference',
      'Are you sure you want to delete this reference?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/api/references/${id}`);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Reference deleted successfully',
              });
              router.back();
            } catch (error) {
              console.error('Failed to delete reference', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete reference',
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading reference...</ThemedText>
      </ThemedView>
    );
  }

  if (!reference) {
    return (
      <ThemedView style={[styles.container, styles.centered, { backgroundColor }]}>
        <IconSymbol name="exclamationmark.triangle" size={50} color={colors.icon} />
        <ThemedText style={styles.errorText}>Reference not found</ThemedText>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderField = (label: string, value: string | undefined, icon?: string) => {
    if (!value) return null;
    
    return (
      <View style={[styles.fieldContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
        <View style={styles.fieldHeader}>
          {icon && <IconSymbol name={icon as any} size={16} color={colors.icon} />}
          <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.fieldValue}>{value}</ThemedText>
      </View>
    );
  };

  // Format date display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader 
        title="Reference Detail" 
        rightComponent={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
            >
              <IconSymbol name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.destructive }]}
              onPress={handleDelete}
            >
              <IconSymbol name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardColor, borderColor: colors.border }]}>
          <ThemedText style={styles.title}>
            {reference.title || reference.nameOfReferral || 'Reference Detail'}
          </ThemedText>
          {(reference.type || reference.urgency) && (
            <View style={styles.badgeContainer}>
              {reference.type && (
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: reference.type === 'given' ? colors.success : colors.info }
                ]}>
                  <ThemedText style={[styles.badgeText, { color: 'white' }]}>
                    {reference.type.toUpperCase()}
                  </ThemedText>
                </View>
              )}
              {reference.urgency && (
                <View style={[
                  styles.urgencyBadge,
                  { backgroundColor: colors.warning }
                ]}>
                  <ThemedText style={[styles.badgeText, { color: 'white' }]}>
                    {reference.urgency.toUpperCase()}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Reference Participants */}
        {(reference.giver || reference.receiver) && (
          <View style={styles.sectionContainer}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Reference Participants</ThemedText>
            
            {reference.giver && (
              <View style={[styles.participantCard, { backgroundColor: cardColor, borderColor: colors.border }]}>
                <View style={styles.participantHeader}>
                  <IconSymbol name="person.badge.plus" size={20} color={colors.primary} />
                  <ThemedText style={[styles.participantRole, { color: colors.primary }]}>Given By</ThemedText>
                </View>
                <ThemedText style={styles.participantName}>{reference.giver.memberName}</ThemedText>
                <ThemedText style={styles.participantOrg}>{reference.giver.organizationName}</ThemedText>
                <ThemedText style={styles.participantEmail}>{reference.giver.email}</ThemedText>
              </View>
            )}
            
            {reference.receiver && (
              <View style={[styles.participantCard, { backgroundColor: cardColor, borderColor: colors.border }]}>
                <View style={styles.participantHeader}>
                  <IconSymbol name="person.badge.minus" size={20} color={colors.info} />
                  <ThemedText style={[styles.participantRole, { color: colors.info }]}>Received By</ThemedText>
                </View>
                <ThemedText style={styles.participantName}>{reference.receiver.memberName}</ThemedText>
                <ThemedText style={styles.participantOrg}>{reference.receiver.organizationName}</ThemedText>
                <ThemedText style={styles.participantEmail}>{reference.receiver.email}</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Chapter Information */}
        {reference.chapter && (
          <View style={styles.sectionContainer}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Chapter</ThemedText>
            <View style={[styles.fieldContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
              <View style={styles.fieldHeader}>
                <IconSymbol name="building.2" size={16} color={colors.icon} />
                <ThemedText style={styles.fieldLabel}>Chapter Name</ThemedText>
              </View>
              <ThemedText style={styles.fieldValue}>{reference.chapter.name}</ThemedText>
            </View>
          </View>
        )}

        {/* Reference Details */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Reference Details</ThemedText>
          <View style={styles.detailsContainer}>
            {renderField('Date', reference.date ? formatDate(reference.date) : formatDate(reference.dateAdded || ''), 'calendar')}
            {renderField('Name', reference.nameOfReferral || reference.contact, 'person')}
            {renderField('Company', reference.company, 'building')}
            {renderField('Primary Mobile', reference.mobile1 || reference.phone, 'phone')}
            {renderField('Secondary Mobile', reference.mobile2, 'phone')}
            {renderField('Email', reference.email, 'envelope')}
            {renderField('Address Line 1', reference.addressLine1, 'house')}
            {renderField('Address Line 2', reference.addressLine2, 'house')}
            {renderField('Location', reference.location, 'location')}
            {renderField('Pincode', reference.pincode, 'location')}
            {renderField('Relationship', reference.relationship, 'person.2')}
            {renderField('Current Status', reference.status, 'checkmark.circle')}
            {renderField('Urgency', reference.urgency, 'exclamationmark.triangle')}
            {renderField('Remarks', reference.remarks || reference.notes, 'note.text')}
            
            {reference.self && (
              <View style={[styles.fieldContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
                <View style={styles.fieldHeader}>
                  <IconSymbol name="checkmark.circle" size={16} color={colors.success} />
                  <ThemedText style={styles.fieldLabel}>Self Reference</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Status History */}
        {reference.statusHistory && reference.statusHistory.length > 0 && (
          <View style={styles.sectionContainer}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Status History</ThemedText>
            <View style={styles.historyContainer}>
              {reference.statusHistory.map((history, index) => (
                <View key={history.id} style={[styles.historyItem, { backgroundColor: cardColor, borderColor: colors.border }]}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyStatusContainer}>
                      <View style={[styles.historyStatusDot, { backgroundColor: colors.primary }]} />
                      <ThemedText style={[styles.historyStatus, { color: colors.primary }]}>
                        {history.status.toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.historyDate, { color: colors.icon }]}>
                      {formatDate(history.date)}
                    </ThemedText>
                  </View>
                  {history.comment && (
                    <ThemedText style={[styles.historyComment, { color: textColor }]}>
                      {history.comment}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.historyTimestamp, { color: colors.icon }]}>
                    Updated: {formatDate(history.updatedAt)}
                  </ThemedText>
                  {index < reference.statusHistory!.length - 1 && (
                    <View style={[styles.historyConnector, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
          onPress={handleEdit}
        >
          <IconSymbol name="pencil" size={20} color="white" />
          <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>Edit</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.destructive }]}
          onPress={handleDelete}
        >
          <IconSymbol name="trash" size={20} color="white" />
          <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    gap: 12,
  },
  fieldContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    marginTop: 4,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    // Specific styles for edit button if needed
  },
  deleteButton: {
    // Specific styles for delete button if needed
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  participantCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  participantRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  participantOrg: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    opacity: 0.8,
  },
  participantEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyComment: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  historyTimestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  historyConnector: {
    position: 'absolute',
    bottom: -6,
    left: 27,
    width: 2,
    height: 6,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

