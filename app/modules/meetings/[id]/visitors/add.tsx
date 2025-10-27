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

interface Meeting {
  id: number;
  meetingTitle: string;
  date: string;
  meetingTime: string;
}

interface MeetingApiResponse {
  success: boolean;
  data: Meeting;
  status: number;
}

interface VisitorFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  referredBy: string;
  notes: string;
}

export default function AddVisitorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  
  const [formData, setFormData] = useState<VisitorFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    referredBy: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const response = await get<MeetingApiResponse>(`/api/chapter-meetings/${id}`);
      setMeeting(response.data);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch meeting data', [
        { text: 'OK', onPress: () => router.push('/modules/meetings' as any) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }

    if (formData.email.trim() && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await post(`/api/chapter-meetings/${id}/visitors`, formData);
      Alert.alert('Success', 'Visitor added successfully', [
        { text: 'OK', onPress: () => router.replace('/modules/meetings' as any) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add visitor');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof VisitorFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
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
            <TouchableOpacity onPress={() => router.push('/modules/meetings' as any)} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Visitor</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.placeholder }]}>
            Loading...
          </Text>
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
          <TouchableOpacity onPress={() => router.push('/modules/meetings')} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Add Visitor</Text>
            {meeting && (
              <Text style={styles.headerSubtitle}>{meeting.meetingTitle}</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meeting Info Card */}
        {meeting && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <IconSymbol name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {new Date(meeting.date).toLocaleDateString('en-GB')} at {meeting.meetingTime}
              </Text>
            </View>
          </View>
        )}

        {/* Visitor Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.name ? colors.error : colors.border }]}>
            <IconSymbol name="person.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter visitor name"
              placeholderTextColor={colors.placeholder}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>
          {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border }]}>
            <IconSymbol name="envelope.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter email address"
              placeholderTextColor={colors.placeholder}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Phone <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.phone ? colors.error : colors.border }]}>
            <IconSymbol name="phone.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter phone number"
              placeholderTextColor={colors.placeholder}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone && <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>}
        </View>

        {/* Company */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Company</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="building.2.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter company name"
              placeholderTextColor={colors.placeholder}
              value={formData.company}
              onChangeText={(text) => updateField('company', text)}
            />
          </View>
        </View>

        {/* Referred By */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Referred By</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="person.2.fill" size={20} color={colors.placeholder} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter referrer name"
              placeholderTextColor={colors.placeholder}
              value={formData.referredBy}
              onChangeText={(text) => updateField('referredBy', text)}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text }]}
              placeholder="Add any notes about the visitor"
              placeholderTextColor={colors.placeholder}
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.push('/modules/meetings' as any)}
            disabled={saving}
            activeOpacity={0.8}
          >
            <IconSymbol name="arrow.backward" size={20} color={colors.text} />
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          
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
                <IconSymbol name="person.badge.plus" size={20} color="white" />
                <Text style={styles.submitButtonText}>Add Visitor</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
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
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
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
