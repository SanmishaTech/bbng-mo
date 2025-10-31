import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { createSiteSetting, SiteSettingFormData } from '@/services/siteSettingService';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AddSiteSettingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SiteSettingFormData>({
    key: '',
    value: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required';
    } else if (formData.key.trim().length < 2) {
      newErrors.key = 'Key must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain letters, numbers, underscores, and hyphens';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
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
      setLoading(true);
      await createSiteSetting(formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Site setting created successfully',
      });
      router.push('/modules/sitesettings' as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create site setting',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Add Site Setting"
        showBackButton
        backPath="/modules/sitesettings"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          {/* Key */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Key <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errors.key ? colors.error : colors.border, color: colors.text }]}
              placeholder="e.g., app_name, max_upload_size"
              value={formData.key}
              onChangeText={(text) => {
                setFormData({ ...formData, key: text });
                setErrors({ ...errors, key: '' });
              }}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
            />
            {errors.key && <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.key}</ThemedText>}
            <ThemedText style={[styles.hintText, { color: colors.placeholder }]}>
              Use letters, numbers, underscores, and hyphens only
            </ThemedText>
          </View>

          {/* Value */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Value <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: errors.value ? colors.error : colors.border, color: colors.text }]}
              placeholder="Enter setting value"
              value={formData.value}
              onChangeText={(text) => {
                setFormData({ ...formData, value: text });
                setErrors({ ...errors, value: '' });
              }}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.value && <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.value}</ThemedText>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: loading ? colors.border : colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Setting'}
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
    color: '#FF453A',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
