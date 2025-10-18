import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

interface Chapter {
  id: string;
  name: string;
  description: string;
}

export default function ChaptersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');
  const animatedValues = useRef<{[key: string]: Animated.Value}>({}).current;

  const addChapter = () => {
    if (newChapterName.trim() !== '') {
      const newChapter = {
        id: Date.now().toString(),
        name: newChapterName,
        description: newChapterDescription,
      };
      setChapters([...chapters, newChapter]);
      setNewChapterName('');
      setNewChapterDescription('');
      setModalVisible(false);
    }
  };

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <IconSymbol name="book.closed" size={64} color={colors.placeholder} />
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Chapters Yet</Text>
        <Text style={[styles.emptyStateSubtitle, { color: colors.placeholder }]}>
          Tap the + button below to add your first chapter
        </Text>
      </View>
    );
  }

  function renderItem({ item }: { item: Chapter }) {
    if (!animatedValues[item.id]) {
      animatedValues[item.id] = new Animated.Value(0);
    }

    Animated.timing(animatedValues[item.id], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const translateY = animatedValues[item.id].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View style={[
        styles.chapterItemWrapper,
        { opacity: animatedValues[item.id], transform: [{ translateY }] }
      ]}>
        <TouchableOpacity 
          style={[styles.chapterItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <View style={styles.chapterHeader}>
            <Text style={[styles.chapterName, { color: colors.text }]}>{item.name}</Text>
            <TouchableOpacity style={styles.chapterMenu}>
              <IconSymbol name="ellipsis" size={20} color={colors.placeholder} />
            </TouchableOpacity>
          </View>
          {item.description ? (
            <Text style={[styles.chapterDescription, { color: colors.placeholder }]}>
              {item.description}
            </Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Chapters</Text>
        <Text style={styles.headerSubtitle}>Manage your book chapters</Text>
      </LinearGradient>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.modernModalView, { backgroundColor: colors.background }]}>
              {/* Modal Header */}
              <View style={styles.modernModalHeader}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <IconSymbol name="xmark" size={20} color={colors.placeholder} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
                  <Text style={[styles.modernModalTitle, { color: colors.text }]}>Add New Chapter</Text>
                  <Text style={[styles.modernModalSubtitle, { color: colors.placeholder }]}>
                    Fill in the details below to create a new chapter
                  </Text>

                  {/* Chapter Name Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Chapter Name</Text>
                    <View style={[styles.modernInputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <TextInput
                        style={[styles.modernInput, { color: colors.text }]}
                        placeholder="Enter chapter name"
                        placeholderTextColor={colors.placeholder}
                        value={newChapterName}
                        onChangeText={setNewChapterName}
                        autoFocus
                      />
                    </View>
                  </View>

                  {/* Chapter Description Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                    <View style={[styles.modernInputContainer, styles.textAreaContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <TextInput
                        style={[styles.modernInput, styles.textArea, { color: colors.text }]}
                        placeholder="Add a brief description (optional)"
                        placeholderTextColor={colors.placeholder}
                        value={newChapterDescription}
                        onChangeText={setNewChapterDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modernButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modernButton, styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modernButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modernButton, styles.primaryButton, { 
                    backgroundColor: newChapterName.trim() ? colors.primary : colors.border,
                    opacity: newChapterName.trim() ? 1 : 0.5
                  }]}
                  onPress={addChapter}
                  activeOpacity={0.8}
                  disabled={!newChapterName.trim()}
                >
                  <Text style={[styles.modernButtonText, { color: 'white' }]}>Add Chapter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  chapterItemWrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  chapterItem: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chapterName: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.3,
  },
  chapterDescription: {
    fontSize: 15,
    marginTop: 10,
    lineHeight: 22,
    opacity: 0.8,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.3,
  },
  input: {
    height: 54,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    marginRight: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chapterMenu: {
    padding: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
  },
  modernModalView: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  modernModalHeader: {
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modernModalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modernModalSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modernInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  modernInput: {
    height: 56,
    fontSize: 16,
  },
  textAreaContainer: {
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
  },
  modernButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E5EA',
  },
  modernButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  modernButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
