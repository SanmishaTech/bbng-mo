import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import {
  getMessageById,
  updateMessage,
  MessageFormData,
  parseAttachment,
} from '@/services/messageService';
import Toast from 'react-native-toast-message';

export default function EditMessageScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const messageId = Number(id);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MessageFormData>({
    heading: '',
    powerteam: '',
    message: '',
  });
  const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMessage();
  }, [messageId]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      const message = await getMessageById(messageId);
      setFormData({
        heading: message.heading,
        powerteam: message.powerteam,
        message: message.message,
      });
      setCurrentAttachment(message.attachment);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load message',
      });
      router.push('/modules/messages' as any);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.heading.trim()) {
      newErrors.heading = 'Heading is required';
    } else if (formData.heading.trim().length < 3) {
      newErrors.heading = 'Heading must be at least 3 characters';
    }

    if (!formData.powerteam.trim()) {
      newErrors.powerteam = 'Power Team is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      await updateMessage(messageId, formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Message updated successfully',
      });
      router.push('/modules/messages' as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update message',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <NavigationHeader
          title="Edit Message"
          showBackButton
          backPath="/modules/messages"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading message...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const attachment = parseAttachment(currentAttachment);

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Edit Message"
        showBackButton
        backPath="/modules/messages"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          {/* Heading */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Heading <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, errors.heading && styles.inputError]}
              placeholder="Enter message heading"
              value={formData.heading}
              onChangeText={(text) => {
                setFormData({ ...formData, heading: text });
                setErrors({ ...errors, heading: '' });
              }}
              placeholderTextColor="#999"
            />
            {errors.heading && <ThemedText style={styles.errorText}>{errors.heading}</ThemedText>}
          </View>

          {/* Power Team */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Power Team <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, errors.powerteam && styles.inputError]}
              placeholder="Enter power team name"
              value={formData.powerteam}
              onChangeText={(text) => {
                setFormData({ ...formData, powerteam: text });
                setErrors({ ...errors, powerteam: '' });
              }}
              placeholderTextColor="#999"
            />
            {errors.powerteam && <ThemedText style={styles.errorText}>{errors.powerteam}</ThemedText>}
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Message <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, errors.message && styles.inputError]}
              placeholder="Enter message content"
              value={formData.message}
              onChangeText={(text) => {
                setFormData({ ...formData, message: text });
                setErrors({ ...errors, message: '' });
              }}
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {errors.message && <ThemedText style={styles.errorText}>{errors.message}</ThemedText>}
          </View>

          {/* Current Attachment Info */}
          {attachment && (
            <View style={styles.attachmentInfo}>
              <ThemedText style={styles.attachmentLabel}>Current Attachment:</ThemedText>
              <ThemedText style={styles.attachmentName}>{attachment.originalname}</ThemedText>
            </View>
          )}

          <ThemedText style={styles.note}>
            Note: Attachment editing feature will be available soon
          </ThemedText>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? 'Updating...' : 'Update Message'}
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
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  attachmentInfo: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  attachmentName: {
    fontSize: 14,
    color: '#007AFF',
  },
  note: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
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
