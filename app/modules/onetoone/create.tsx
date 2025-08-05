import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { get, post } from '@/services/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// Utility functions to replace date-fns
const formatDate = (date: Date, formatString: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (formatString === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  if (formatString === 'MMM d, yyyy') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
  }
  
  return date.toLocaleDateString();
};

interface Member {
  id: number;
  memberName: string;
  email: string;
  organizationName: string;
}

interface Chapter {
  id: number;
  name: string;
}

interface OneToOneFormData {
  date: string;       // yyyy-MM-dd
  requestedId: string;
  chapterId: string;
  remarks: string;
}

export default function OneToOneFormScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<OneToOneFormData>({
    date: formatDate(new Date(), 'yyyy-MM-dd'),
    requestedId: '',
    chapterId: '',
    remarks: '',
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterMembers, setChapterMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);

  const [errors, setErrors] = useState<{ date?: string; chapterId?: string; requestedId?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formData.chapterId) newErrors.chapterId = 'Chapter is required';
    if (!formData.requestedId) newErrors.requestedId = 'Member is required';
    if (!formData.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: keyof OneToOneFormData, value: string) => {
    setFormData(prev => {
      if (key === 'chapterId') {
        return { ...prev, chapterId: value, requestedId: '' };
      }
      return { ...prev, [key]: value };
    });
  };

  // Load chapters
  useEffect(() => {
    const loadChapters = async () => {
      setLoading(true);
      try {
        const chaptersResponse = await get('/api/chapters');
        setChapters(chaptersResponse.data.chapters || []);
      } catch (error) {
        console.error('Error loading chapters:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load form data'
        });
      } finally {
        setLoading(false);
      }
    };
    loadChapters();
  }, []);

  // Load members by chapter
  useEffect(() => {
    const loadMembers = async () => {
      if (!formData.chapterId) {
        setChapterMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const membersResponse = await get(`/api/members?chapterId=${formData.chapterId}&excludeCurrentUser=true`);
        setChapterMembers(membersResponse.data.members || []);
      } catch (error) {
        console.error('Error loading members:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load members for this chapter'
        });
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [formData.chapterId]);

  const onSubmit = async () => {
    if (!validate()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields'
      });
      return;
    }
    setSubmitting(true);
    try {
      await post('/api/one-to-ones', formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'One-to-One meeting scheduled successfully'
      });
      router.push('/modules/onetoone');
    } catch (error) {
      console.error('Error creating One-to-One meeting:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to schedule One-to-One meeting'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayDate = () => {
    try {
      const d = new Date(formData.date);
      return formatDate(d, 'MMM d, yyyy');
    } catch {
      return formData.date;
    }
  };

  const PickerModal = ({
    visible,
    title,
    data,
    keyExtractor,
    renderLabel,
    onSelect,
    onClose,
    loading,
    emptyText,
  }: {
    visible: boolean;
    title: string;
    data: any[];
    keyExtractor: (item: any) => string;
    renderLabel: (item: any) => string;
    onSelect: (item: any) => void;
    onClose: () => void;
    loading?: boolean;
    emptyText?: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {loading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.placeholder, marginLeft: 8 }}>Loading...</Text>
              </View>
            ) : data.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ color: colors.placeholder }}>{emptyText || 'No options available'}</Text>
              </View>
            ) : (
              <FlatList
                data={data}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    style={styles.optionItem}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{renderLabel(item)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader 
          title="Schedule One-to-One"
          showBackButton
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.placeholder }]}>Loading form data...</Text>
        </View>
      </ThemedView>
    );
  }

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader 
        title="Schedule One-to-One"
        showBackButton
      />
      
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Meeting Details</Text>
              <Text style={[styles.formSubtitle, { color: colors.placeholder }]}>Schedule a one-to-one meeting with a fellow member</Text>
            </View>

            <View style={styles.formSection}>

              {/* Chapter */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Chapter</Text>
                  <Text style={styles.req}>*</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    { borderColor: errors.chapterId ? '#F44336' : colors.border, backgroundColor: colors.background },
                  ]}
                  onPress={() => setChapterPickerOpen(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      { color: formData.chapterId ? colors.text : colors.placeholder },
                    ]}
                  >
                    {formData.chapterId
                      ? chapters.find(c => String(c.id) === String(formData.chapterId))?.name || 'Select chapter'
                      : 'Select chapter'}
                  </Text>
                </TouchableOpacity>
                {errors.chapterId ? <Text style={styles.errorText}>{errors.chapterId}</Text> : null}
              </View>

              {/* Member */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Member</Text>
                  <Text style={styles.req}>*</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    {
                      borderColor: errors.requestedId ? '#F44336' : colors.border,
                      backgroundColor: formData.chapterId ? colors.background : '#F5F5F5',
                    },
                  ]}
                  onPress={() => {
                    if (!formData.chapterId || loadingMembers) return;
                    setMemberPickerOpen(true);
                  }}
                  disabled={!formData.chapterId || loadingMembers}
                >
                  <Text
                    style={[
                      styles.selectText,
                      {
                        color:
                          formData.requestedId && formData.chapterId
                            ? colors.text
                            : formData.chapterId
                            ? colors.placeholder
                            : '#A1A1A1',
                      },
                    ]}
                  >
                    {loadingMembers
                      ? 'Loading members...'
                      : !formData.chapterId
                      ? 'First select a chapter'
                      : formData.requestedId
                      ? chapterMembers.find(m => String(m.id) === String(formData.requestedId))?.memberName
                      : 'Select a member'}
                  </Text>
                </TouchableOpacity>
                {errors.requestedId ? <Text style={styles.errorText}>{errors.requestedId}</Text> : null}
              </View>

              {/* Date */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Meeting Date</Text>
                  <Text style={styles.req}>*</Text>
                </View>
                <TouchableOpacity
                  style={[styles.selectBox, { borderColor: errors.date ? '#F44336' : colors.border, backgroundColor: colors.background }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.selectText, { color: colors.text }]}>{getDisplayDate()}</Text>
                </TouchableOpacity>
                {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              </View>
            </View>

            {/* Remarks */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Discussion Topics</Text>
              <TextInput
                style={[
                  styles.textarea,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
                placeholder="What would you like to discuss in this meeting?"
                placeholderTextColor={colors.placeholder}
                value={formData.remarks}
                onChangeText={text => handleChange('remarks', text)}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>

          </View>
        </ScrollView>
        
        {/* Fixed Footer */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.push('/modules/onetoone')}
            disabled={submitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scheduleButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.scheduleButtonText}>Schedule Meeting</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Chapter Picker */}
      <PickerModal
        visible={chapterPickerOpen}
        title="Select Chapter"
        data={chapters}
        keyExtractor={(item: Chapter) => String(item.id)}
        renderLabel={(item: Chapter) => item.name}
        onSelect={(item: Chapter) => handleChange('chapterId', String(item.id))}
        onClose={() => setChapterPickerOpen(false)}
        loading={false}
        emptyText="No chapters found"
      />

      {/* Member Picker */}
      <PickerModal
        visible={memberPickerOpen}
        title="Select Member"
        data={chapterMembers}
        keyExtractor={(item: Member) => String(item.id)}
        renderLabel={(item: Member) => `${item.memberName} • ${item.organizationName}`}
        onSelect={(item: Member) => handleChange('requestedId', String(item.id))}
        onClose={() => setMemberPickerOpen(false)}
        loading={loadingMembers}
        emptyText="No members found in this chapter"
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date)}
          mode="date"
          display={Platform.select({ ios: 'inline', android: 'calendar' })}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              handleChange('date', formatDate(selectedDate, 'yyyy-MM-dd'));
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backText: {
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 8,
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  field: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  req: {
    color: '#F44336',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
  },

  selectBox: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 15,
    fontWeight: '500',
  },

  textarea: {
    minHeight: 110,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },

  footer: {
    borderTopWidth: 1,
    padding: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontWeight: '700',
  },
  modalContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    opacity: 0.6,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

