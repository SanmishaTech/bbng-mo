import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { requirementService } from '@/services/requirementService';
import { useAuth } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function AddRequirementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [heading, setHeading] = useState('');
  const [requirement, setRequirement] = useState('');
  const [headingError, setHeadingError] = useState('');
  const [requirementError, setRequirementError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setHeadingError('');
    setRequirementError('');

    if (!heading.trim()) {
      setHeadingError('Heading is required');
      isValid = false;
    } else if (heading.length > 100) {
      setHeadingError('Heading must be 100 characters or less');
      isValid = false;
    }

    if (!requirement.trim()) {
      setRequirementError('Requirement is required');
      isValid = false;
    } else if (requirement.length > 513) {
      setRequirementError('Requirement must be 513 characters or less');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.member?.id) {
      Alert.alert('Error', 'Member ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      await requirementService.createRequirement({
        memberId: user.member.id,
        heading: heading.trim(),
        requirement: requirement.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Requirement added successfully',
      });

      // Navigate back to requirements list
      router.push('/modules/requirements' as any);
    } catch (error: any) {
      console.error('Error creating requirement:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to add requirement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader title="Add Requirement" backPath="/modules/requirements" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Heading Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Heading <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: headingError ? '#EF4444' : colors.border,
                  },
                ]}
                placeholder="Enter heading"
                placeholderTextColor={colors.placeholder}
                value={heading}
                onChangeText={(text) => {
                  setHeading(text);
                  if (headingError) setHeadingError('');
                }}
                maxLength={100}
              />
              <View style={styles.inputFooter}>
                {headingError ? (
                  <Text style={styles.errorText}>{headingError}</Text>
                ) : null}
                <Text style={[styles.charCount, { color: colors.placeholder }]}>
                  {heading.length}/100
                </Text>
              </View>
            </View>

            {/* Requirement Field */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Requirement <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: requirementError ? '#EF4444' : colors.border,
                  },
                ]}
                placeholder="Enter requirement details"
                placeholderTextColor={colors.placeholder}
                value={requirement}
                onChangeText={(text) => {
                  setRequirement(text);
                  if (requirementError) setRequirementError('');
                }}
                maxLength={513}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                {requirementError ? (
                  <Text style={styles.errorText}>{requirementError}</Text>
                ) : null}
                <Text style={[styles.charCount, { color: colors.placeholder }]}>
                  {requirement.length}/513
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>💾 Save Requirement</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    minHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    marginLeft: 8,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
