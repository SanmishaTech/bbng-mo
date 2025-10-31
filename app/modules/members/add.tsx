import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createMember } from '@/services/memberService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function AddMemberScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [memberName, setMemberName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    memberName: '',
    email: '',
    mobile1: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  };

  const validate = () => {
    const newErrors = {
      memberName: '',
      email: '',
      mobile1: '',
    };
    let isValid = true;

    if (!memberName.trim()) {
      newErrors.memberName = 'Member name is required';
      isValid = false;
    } else if (memberName.trim().length < 2) {
      newErrors.memberName = 'Member name must be at least 2 characters';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!mobile1.trim()) {
      newErrors.mobile1 = 'Mobile number is required';
      isValid = false;
    } else if (!validateMobile(mobile1.trim())) {
      newErrors.mobile1 = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        memberName: memberName.trim(),
        email: email.trim().toLowerCase(),
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim() || undefined,
        organizationName: organizationName.trim() || undefined,
        active,
      };

      console.log('Creating member with payload:', payload);
      await createMember(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Member created successfully',
      });
      router.push('/modules/members' as any);
    } catch (error: any) {
      console.error('Error creating member:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to create member',
      });
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Member" backPath="/modules/members" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Member Details
            </Text>

            {/* Member Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Member Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.memberName ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter member name"
                placeholderTextColor={colors.placeholder}
                value={memberName}
                onChangeText={(text) => {
                  setMemberName(text);
                  if (errors.memberName) setErrors({ ...errors, memberName: '' });
                }}
                editable={!loading}
                autoCapitalize="words"
              />
              {errors.memberName && (
                <Text style={styles.errorText}>{errors.memberName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.email ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter email address"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Mobile 1 */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Mobile Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.mobile1 ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.placeholder}
                value={mobile1}
                onChangeText={(text) => {
                  setMobile1(text);
                  if (errors.mobile1) setErrors({ ...errors, mobile1: '' });
                }}
                editable={!loading}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.mobile1 && (
                <Text style={styles.errorText}>{errors.mobile1}</Text>
              )}
            </View>

            {/* Mobile 2 (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Alternate Mobile Number (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter alternate mobile number"
                placeholderTextColor={colors.placeholder}
                value={mobile2}
                onChangeText={setMobile2}
                editable={!loading}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Organization Name (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Organization Name (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter organization name"
                placeholderTextColor={colors.placeholder}
                value={organizationName}
                onChangeText={setOrganizationName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            {/* Active Status */}
            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Active Status
                  </Text>
                  <Text style={[styles.switchDescription, { color: colors.placeholder }]}>
                    {active ? 'Member is active' : 'Member is inactive'}
                  </Text>
                </View>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={active ? colors.primary : colors.surface}
                  disabled={loading}
                />
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => router.push('/modules/members' as any)}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Member</Text>
                )}
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    color: '#F44336',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
