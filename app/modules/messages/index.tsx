import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMessages, deleteMessage, parseAttachment, getAttachmentUrl, Message } from '@/services/messageService';
import Toast from 'react-native-toast-message';

export default function MessagesListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = useThemeColor({}, 'background');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  const recordsPerPage = 10;

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadMessages();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Immediate effect for pagination and sorting
  useEffect(() => {
    loadMessages();
  }, [currentPage, sortBy, sortOrder]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(currentPage, recordsPerPage, searchQuery, sortBy, sortOrder);
      setMessages(response.messages || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setMessages([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load messages',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const confirmDelete = (id: number) => {
    setMessageToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (messageToDelete) {
      try {
        await deleteMessage(messageToDelete);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Message deleted successfully',
        });
        setDeleteModalVisible(false);
        setMessageToDelete(null);
        loadMessages();
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to delete message',
        });
      }
    }
  };

  const handleDownloadAttachment = async (messageId: number) => {
    const url = getAttachmentUrl(messageId.toString());
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Cannot open attachment',
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to download attachment',
        });
      }
    }
  };

  const renderMessageCard = ({ item }: { item: Message }) => {
    const attachment = parseAttachment(item.attachment);
    
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.messageIcon}>📧</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.heading, { color: colors.text }]} numberOfLines={2}>{item.heading}</Text>
              <View style={styles.powerteamRow}>
                <Text style={styles.powerteamIcon}>👥</Text>
                <Text style={[styles.powerteam, { color: colors.primary }]} numberOfLines={1}>{item.powerteam}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
          {item.message}
        </Text>

        {attachment && (
          <TouchableOpacity 
            style={[styles.attachmentContainer, { backgroundColor: colors.primary + '15' }]}
            onPress={() => handleDownloadAttachment(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.attachmentIcon}>📎</Text>
            <Text style={[styles.attachmentText, { color: colors.primary }]} numberOfLines={1}>{attachment.originalname}</Text>
            <Text style={styles.downloadIcon}>📥</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerSection}>
          <View style={styles.dateRow}>
            <Text style={styles.dateIcon}>🕒</Text>
            <Text style={[styles.date, { color: colors.placeholder }]}>
              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/modules/messages/${item.id}/edit` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryBtnText} numberOfLines={1}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostDangerBtn}
              onPress={() => confirmDelete(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.ghostDangerText} numberOfLines={1}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSortButton = (column: string, label: string) => (
    <TouchableOpacity
      style={[styles.sortButton, { backgroundColor: sortBy === column ? colors.primary + '20' : colors.surface }]}
      onPress={() => handleSort(column)}
      activeOpacity={0.7}
    >
      <Text style={[styles.sortButtonText, { color: sortBy === column ? colors.primary : colors.text }]}>{label}</Text>
      {sortBy === column && (
        <Text style={styles.sortArrow}>
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderPagination = () => (
    <View style={[styles.paginationContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[
          styles.paginationBtn,
          { backgroundColor: currentPage === 1 ? colors.surface : colors.primary },
        ]}
        onPress={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.paginationBtnText,
            { color: currentPage === 1 ? colors.placeholder : 'white' },
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>
      
      <View style={styles.paginationInfo}>
        <Text style={[styles.paginationText, { color: colors.text }]}>
          Page {currentPage} of {totalPages}
        </Text>
        <Text style={[styles.paginationSubtext, { color: colors.placeholder }]}>
          {messages.length} messages
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.paginationBtn,
          { backgroundColor: currentPage === totalPages ? colors.surface : colors.primary },
        ]}
        onPress={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.paginationBtnText,
            { color: currentPage === totalPages ? colors.placeholder : 'white' },
          ]}
        >
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📧</Text>
      <Text style={[styles.emptyText, { color: colors.placeholder }]}>No messages found</Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modules/messages/add' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.createButtonText}>Create First Message</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Messages"
        showBackButton
        backPath="/(tabs)/_modules"
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/modules/messages/add' as any)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search and Sort Controls */}
      <View style={styles.searchAndSortContainer}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.text }]}>Sort by:</Text>
          {renderSortButton('createdAt', 'Date')}
          {renderSortButton('heading', 'Heading')}
          {renderSortButton('powerteam', 'Power Team')}
        </View>
      </View>

      {loading && (!messages || messages.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages || []}
          renderItem={renderMessageCard}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={(messages && messages.length > 0) ? renderPagination : null}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Message</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Are you sure you want to delete this message? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
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
  searchAndSortContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  searchContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  powerteamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  powerteamIcon: {
    fontSize: 12,
  },
  powerteam: {
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  attachmentIcon: {
    fontSize: 16,
  },
  attachmentText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  downloadIcon: {
    fontSize: 16,
  },
  footerSection: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateIcon: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  ghostDangerBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  ghostDangerText: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  paginationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paginationBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  paginationInfo: {
    flex: 1,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  paginationSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
