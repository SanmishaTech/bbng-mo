import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import {
  getTrainingById,
  updateTraining,
  TrainingFormData,
} from '@/services/trainingService';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function EditTrainingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TrainingFormData>({
    date: '',
    title: '',
    time: '',
    venue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    loadTraining();
  }, [id]);

  const loadTraining = async () => {
    try {
      setLoading(true);
      const training = await getTrainingById(Number(id));
      setFormData({
        date: training.date,
        title: training.title,
        time: training.time,
        venue: training.venue,
      });
      setSelectedDate(new Date(training.date));
      
      // Parse time string (e.g., "14:30") to Date
      const [hours, minutes] = training.time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      setSelectedTime(timeDate);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load training',
      });
      router.push('/modules/trainings' as any);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Time is required';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    } else if (formData.venue.trim().length < 3) {
      newErrors.venue = 'Venue must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, date: date.toISOString() });
      setErrors({ ...errors, date: '' });
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
      const timeString = format(time, 'HH:mm');
      setFormData({ ...formData, time: timeString });
      setErrors({ ...errors, time: '' });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix all errors before submitting',
      });
      return;
    }

    try {
      setSubmitting(true);
      await updateTraining(Number(id), formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Training updated successfully',
      });
      router.push('/modules/trainings' as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update training',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <NavigationHeader
          title="Edit Training"
          showBackButton
          backPath="/modules/trainings"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading training...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Edit Training"
        showBackButton
        backPath="/modules/trainings"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Title <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter training title"
              value={formData.title}
              onChangeText={(text) => {
                setFormData({ ...formData, title: text });
                setErrors({ ...errors, title: '' });
              }}
              placeholderTextColor="#999"
            />
            {errors.title && <ThemedText style={styles.errorText}>{errors.title}</ThemedText>}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Date <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, errors.date && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <ThemedText style={styles.dateButtonText}>
                {formData.date ? format(new Date(formData.date), 'dd-MM-yyyy') : 'Select date'}
              </ThemedText>
            </TouchableOpacity>
            {errors.date && <ThemedText style={styles.errorText}>{errors.date}</ThemedText>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {/* Time */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Time <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, errors.time && styles.inputError]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <ThemedText style={styles.dateButtonText}>
                {formData.time || 'Select time'}
              </ThemedText>
            </TouchableOpacity>
            {errors.time && <ThemedText style={styles.errorText}>{errors.time}</ThemedText>}
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          {/* Venue */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Venue <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, errors.venue && styles.inputError]}
              placeholder="Enter venue name"
              value={formData.venue}
              onChangeText={(text) => {
                setFormData({ ...formData, venue: text });
                setErrors({ ...errors, venue: '' });
              }}
              placeholderTextColor="#999"
            />
            {errors.venue && <ThemedText style={styles.errorText}>{errors.venue}</ThemedText>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? 'Updating...' : 'Update Training'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
