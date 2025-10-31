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
  getSiteSettingByKey,
  updateSiteSetting,
  SiteSettingFormData,
} from '@/services/siteSettingService';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EditSiteSettingScreen() {
  const router = useRouter();
  const { key } = useLocalSearchParams();
  const settingKey = decodeURIComponent(key as string);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settingId, setSettingId] = useState<number>(0); // Store ID for PUT request
  const [formData, setFormData] = useState<SiteSettingFormData>({
    key: '',
    value: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSetting();
  }, [settingKey]);

  const loadSetting = async () => {
    try {
      setLoading(true);
      // GET by key: /api/sites/contact_email
      const setting = await getSiteSettingByKey(settingKey);
      setSettingId(setting.id); // Store ID for later PUT request
      setFormData({
        key: setting.key,
        value: setting.value,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load site setting',
      });
      router.push('/modules/sitesettings' as any);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      setSubmitting(true);
      // PUT by ID: /api/sites/2
      await updateSiteSetting(settingId, formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Site setting updated successfully',
      });
      router.push('/modules/sitesettings' as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update site setting',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <NavigationHeader
          title="Edit Site Setting"
          showBackButton
          backPath="/modules/sitesettings"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.placeholder }]}>Loading setting...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader
        title="Edit Site Setting"
        showBackButton
        backPath="/modules/sitesettings"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          {/* Key (Read-only) */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Key</ThemedText>
            <View style={[styles.readOnlyInput, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
              <ThemedText style={[styles.readOnlyText, { color: colors.placeholder }]}>{formData.key}</ThemedText>
            </View>
            <ThemedText style={[styles.hintText, { color: colors.placeholder }]}>Key cannot be changed</ThemedText>
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
            style={[styles.submitButton, { backgroundColor: submitting ? colors.border : colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? 'Updating...' : 'Update Setting'}
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
  readOnlyInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
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
