import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { get, post } from '@/services/apiService';
import { apiService } from '@/services/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/contexts/AuthContext';

interface Meeting {
  id: number;
  date: string;
  meetingTime: string;
  meetingTitle: string;
  meetingVenue: string;
  chapterId: number;
}

interface MeetingApiResponse {
  success: boolean;
  data: Meeting;
  status: number;
}


interface MeetingFormData {
  date: Date;
  meetingTime: string;
  meetingTitle: string;
  meetingVenue: string;
  chapterId: number | null;
}

export default function EditMeetingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [formData, setFormData] = useState<MeetingFormData>({
    date: new Date(),
    meetingTime: '',
    meetingTitle: '',
    meetingVenue: '',
    chapterId: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meetingResponse = await get<MeetingApiResponse>(`/api/chapter-meetings/${id}`);
      const meeting = meetingResponse.data;

      setFormData({
        date: new Date(meeting.date),
        meetingTime: meeting.meetingTime,
        meetingTitle: meeting.meetingTitle,
        meetingVenue: meeting.meetingVenue,
        chapterId: user?.member?.chapterId || null, // Always use logged-in user's chapter
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch meeting data', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meetingTitle.trim()) {
      newErrors.meetingTitle = 'Meeting title is required';
    }

    if (!formData.meetingTime.trim()) {
      newErrors.meetingTime = 'Meeting time is required';
    }

    if (!formData.meetingVenue.trim()) {
      newErrors.meetingVenue = 'Meeting venue is required';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: formData.date.toISOString().split('T')[0],
        meetingTime: formData.meetingTime,
        meetingTitle: formData.meetingTitle,
        meetingVenue: formData.meetingVenue,
        chapterId: formData.chapterId,
      };

      await apiService.put(`/api/chapter-meetings/${id}`, payload);
      Alert.alert('Success', 'Meeting updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update meeting');
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData({ ...formData, meetingTime: `${hours}:${minutes}` });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB');
  };

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
            <Text style={styles.headerTitle}>Edit Meeting</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.placeholder }]}>Loading meeting...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerTitle}>Edit Meeting</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meeting Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Meeting Title <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.meetingTitle ? colors.error : colors.border }]}>
            <IconSymbol name="text.alignleft" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter meeting title"
              placeholderTextColor={colors.placeholder}
              value={formData.meetingTitle}
              onChangeText={(text) => {
                setFormData({ ...formData, meetingTitle: text });
                setErrors({ ...errors, meetingTitle: '' });
              }}
            />
          </View>
          {errors.meetingTitle && <Text style={[styles.errorText, { color: colors.error }]}>{errors.meetingTitle}</Text>}
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <IconSymbol name="calendar" size={20} color={colors.placeholder} />
            <Text style={[styles.input, { color: colors.text }]}>
              {formatDate(formData.date)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>

        {/* Time */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.meetingTime ? colors.error : colors.border }]}
            onPress={() => setShowTimePicker(true)}
          >
            <IconSymbol name="clock" size={20} color={colors.placeholder} />
            <Text style={[styles.input, { color: formData.meetingTime ? colors.text : colors.placeholder }]}>
              {formData.meetingTime || 'Select time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
          {errors.meetingTime && <Text style={[styles.errorText, { color: colors.error }]}>{errors.meetingTime}</Text>}
        </View>

        {/* Venue */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Venue <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.meetingVenue ? colors.error : colors.border }]}>
            <IconSymbol name="location.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter venue"
              placeholderTextColor={colors.placeholder}
              value={formData.meetingVenue}
              onChangeText={(text) => {
                setFormData({ ...formData, meetingVenue: text });
                setErrors({ ...errors, meetingVenue: '' });
              }}
            />
          </View>
          {errors.meetingVenue && <Text style={[styles.errorText, { color: colors.error }]}>{errors.meetingVenue}</Text>}
        </View>

        {/* Chapter is automatically set from logged-in user */}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
              <Text style={styles.submitButtonText}>Update Meeting</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
