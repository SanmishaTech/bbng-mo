import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiService } from '@/services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isReceived, setIsReceived] = useState(false);
  const [isGiven, setIsGiven] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'surface');

  useEffect(() => {
    const fetchReferenceDetail = async () => {
      try {
        console.log('Fetching reference detail for ID:', id);
        
        // Get current user's memberId
        const userData = await AsyncStorage.getItem('user_data');
        let memberId = null;
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            memberId = parsedUser?.member?.id || parsedUser?.memberId;
            setCurrentUserId(memberId);
            console.log('Current user memberId:', memberId);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
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
          console.log('Status History:', data.statusHistory);
          setReference(data);
          
          // Determine if this is a received or given reference
          if (data.receiverId === memberId) {
            console.log('This is a RECEIVED reference');
            setIsReceived(true);
            setIsGiven(false);
          } else if (data.giverId === memberId) {
            console.log('This is a GIVEN reference');
            setIsReceived(false);
            setIsGiven(true);
          } else {
            console.log('User is neither giver nor receiver');
          }
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
              // Set isReceived/isGiven flags
              if (foundReference.receiverId === memberId) {
                setIsReceived(true);
                setIsGiven(false);
              } else if (foundReference.giverId === memberId) {
                setIsReceived(false);
                setIsGiven(true);
              }
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
              // Set isReceived/isGiven flags
              if (foundReference.receiverId === memberId) {
                setIsReceived(true);
                setIsGiven(false);
              } else if (foundReference.giverId === memberId) {
                setIsReceived(false);
                setIsGiven(true);
              }
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
              // Set isReceived/isGiven flags for legacy data
              if (foundReference.type === 'received') {
                setIsReceived(true);
                setIsGiven(false);
              } else if (foundReference.type === 'given') {
                setIsReceived(false);
                setIsGiven(true);
              } else if (foundReference.receiverId === memberId) {
                setIsReceived(true);
                setIsGiven(false);
              } else if (foundReference.giverId === memberId) {
                setIsReceived(false);
                setIsGiven(true);
              }
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
    // Only allow deleting if it's a given reference with pending status
    if (!isGiven || reference?.status !== 'pending') {
      Toast.show({
        type: 'error',
        text1: 'Cannot Delete',
        text2: 'Only pending references you gave can be deleted',
      });
      return;
    }

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

  const handleUpdateStatus = async (newStatus: string, comment: string = '') => {
    try {
      const updateData = {
        status: newStatus,
        comment: comment || `Status updated to ${newStatus}`,
        date: new Date().toISOString(),
      };
      
      console.log('Updating status with data:', updateData);
      await apiService.patch(`/api/references/${id}/status`, updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Reference status updated to ${newStatus}`,
      });
      
      // Refresh the reference data
      const apiResponse = await apiService.get<any>(`/api/references/${id}`);
      const data = apiResponse?.data || apiResponse;
      setReference(data);
    } catch (error) {
      console.error('Failed to update status', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update reference status',
      });
    }
  };

  // Define status hierarchy (order matters) - matching backend validation
  const statusHierarchy = ['pending', 'contacted', 'business done'];
  
  const getAvailableStatuses = () => {
    if (!reference?.status) return [];
    
    const currentStatus = reference.status.toLowerCase();
    const currentIndex = statusHierarchy.indexOf(currentStatus);
    
    // If status is business done, only allow rejected
    if (currentStatus === 'business done') {
      return [{ value: 'rejected', label: 'Rejected', comment: 'Reference rejected', color: 'error', icon: 'xmark.circle.fill' }];
    }
    
    // If status is rejected, don't allow any changes
    if (currentStatus === 'rejected') {
      return [];
    }
    
    // Build available statuses (current status onwards + rejected)
    const available = [];
    
    // Add statuses that come after current status
    if (currentIndex !== -1) {
      for (let i = currentIndex + 1; i < statusHierarchy.length; i++) {
        const status = statusHierarchy[i];
        if (status === 'contacted') {
          available.push({ value: 'contacted', label: 'Contacted', comment: 'Initial contact made', color: 'info', icon: 'phone' });
        } else if (status === 'business done') {
          available.push({ value: 'business done', label: 'Mark Done Deal', comment: 'Business completed successfully', color: 'success', icon: 'checkmark.circle' });
        }
      }
    }
    
    // Always allow rejection (unless already rejected)
    available.push({ value: 'rejected', label: 'Rejected', comment: 'Reference rejected', color: 'error', icon: 'xmark.circle.fill' });
    
    return available;
  };

  const showStatusUpdateOptions = () => {
    console.log('showStatusUpdateOptions called');
    const availableStatuses = getAvailableStatuses();
    console.log('Current status:', reference?.status);
    console.log('Available statuses:', availableStatuses);
    
    if (availableStatuses.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Updates Available',
        text2: 'This reference status cannot be changed further',
      });
      return;
    }
    
    setStatusModalVisible(true);
  };

  const handleStatusSelect = (status: string, comment: string) => {
    console.log('Status selected:', status);
    setStatusModalVisible(false);
    handleUpdateStatus(status, comment);
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

  function renderField(label: string, value: string | undefined, icon?: string) {
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
  }

  // Format date display
  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  // Format status display name
  function formatStatusDisplay(status: string) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'business done') {
      return 'Mark Done Deal';
    }
    // Capitalize first letter of each word
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // Get status color
  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'pending':
        return colors.warning;
      case 'contacted':
        return colors.info;
      case 'accepted':
        return colors.success;
      case 'business done':
        return colors.success;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.primary;
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader 
        title="Reference Detail" 
        rightComponent={
          isGiven && reference?.status === 'pending' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.primary }]}
                onPress={handleEdit}
              >
                <IconSymbol name="pencil" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.error }]}
                onPress={handleDelete}
              >
                <IconSymbol name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : null
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
            {renderField('Address Line 1', reference.addressLine1, 'location')}
            {renderField('Address Line 2', reference.addressLine2, 'location')}
            {renderField('Location', reference.location, 'location')}
            {renderField('Pincode', reference.pincode, 'location')}
            {renderField('Relationship', reference.relationship, 'person.2')}
            {reference.status && (
              <View style={[styles.fieldContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
                <View style={styles.fieldHeader}>
                  <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
                  <ThemedText style={styles.fieldLabel}>Current Status</ThemedText>
                </View>
                <ThemedText style={styles.fieldValue}>{formatStatusDisplay(reference.status)}</ThemedText>
              </View>
            )}
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
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Status History ({reference.statusHistory.length})
            </ThemedText>
            <View style={styles.historyContainer}>
              {[...reference.statusHistory].reverse().map((history, index) => {
                const statusColor = getStatusColor(history.status);
                return (
                  <View key={history.id} style={[styles.historyItem, { backgroundColor: cardColor, borderColor: colors.border }]}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyStatusContainer}>
                        <View style={[styles.historyStatusDot, { backgroundColor: statusColor }]} />
                        <ThemedText style={[styles.historyStatus, { color: statusColor }]}>
                          {formatStatusDisplay(history.status).toUpperCase()}
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
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {isReceived && getAvailableStatuses().length > 0 ? (
        <View style={[styles.actionContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={showStatusUpdateOptions}
          >
            <IconSymbol name="pencil.circle" size={20} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>Update Status</ThemedText>
          </TouchableOpacity>
        </View>
      ) : isGiven && reference?.status === 'pending' ? (
        <View style={[styles.actionContainer, { backgroundColor: cardColor, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
            onPress={handleEdit}
          >
            <IconSymbol name="pencil" size={20} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>Edit</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash" size={20} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Update Reference Status</ThemedText>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
                Current Status: <Text style={{ fontWeight: 'bold', color: colors.text }}>{reference?.status ? formatStatusDisplay(reference.status).toUpperCase() : 'PENDING'}</Text>
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.icon, marginTop: 4, marginBottom: 8 }]}>
                Select the new status:
              </Text>
              
              {getAvailableStatuses().map((statusOption) => {
                const bgColor = colors[statusOption.color as keyof typeof colors] || colors.primary;
                return (
                  <TouchableOpacity
                    key={statusOption.value}
                    style={[styles.statusOption, { backgroundColor: bgColor, opacity: 0.9 }]}
                    onPress={() => handleStatusSelect(statusOption.value, statusOption.comment)}
                  >
                    <IconSymbol name={statusOption.icon as any} size={24} color="white" />
                    <ThemedText style={styles.statusOptionText}>{statusOption.label}</ThemedText>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.cancelOption, { borderColor: colors.border }]}
                onPress={() => setStatusModalVisible(false)}
              >
                <ThemedText style={[styles.cancelOptionText, { color: colors.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
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
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    // Specific styles for edit button if needed
  },
  deleteButton: {
    // Specific styles for delete button if needed
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    gap: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

