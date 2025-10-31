import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createLocation, fetchAllZones, ZoneOption } from '@/services/locationService';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function AddLocationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [locationName, setLocationName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const zonesData = await fetchAllZones();
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading zones:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load regions',
      });
    } finally {
      setLoadingZones(false);
    }
  };

  const validate = () => {
    if (!locationName.trim()) {
      setNameError('Location name is required');
      return false;
    } else if (locationName.trim().length < 2) {
      setNameError('Location name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        location: locationName.trim(),
      };
      
      // Only include zoneId if it's selected and convert to number
      if (selectedZoneId) {
        payload.zoneId = Number(selectedZoneId);
      }
      
      console.log('Creating location with payload:', payload);
      console.log('zoneId type:', typeof payload.zoneId);
      await createLocation(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Location created successfully',
      });
      router.push('/modules/locations' as any);
    } catch (error) {
      console.error('Error creating location:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create location',
      });
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Location" backPath="/modules/locations" />

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
            {/* Form Header */}
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Location Information
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.placeholder }]}>
                Create a new location and optionally assign it to a region
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Location Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: nameError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="e.g., Mumbai Office, Delhi Branch"
                placeholderTextColor={colors.placeholder}
                value={locationName}
                onChangeText={(text) => {
                  setLocationName(text);
                  if (nameError) setNameError('');
                }}
                editable={!loading}
                autoCapitalize="words"
                autoFocus
              />
              {nameError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{nameError}</Text>
                </View>
              ) : (
                <Text style={[styles.helperText, { color: colors.placeholder }]}>
                  Enter a descriptive name for this location
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                🌍 Region (Optional)
              </Text>
              {loadingZones ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading regions...
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                    <Picker
                      selectedValue={selectedZoneId}
                      onValueChange={(value) => setSelectedZoneId(value)}
                      style={[styles.picker, { color: colors.text }]}
                      enabled={!loading}
                    >
                      <Picker.Item label="-- Select a Region (Optional) --" value={null} />
                      {zones.map((zone) => (
                        <Picker.Item
                          key={zone.id}
                          label={zone.name}
                          value={zone.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  <Text style={[styles.helperText, { color: colors.placeholder }]}>
                    Assign this location to a region for better organization
                  </Text>
                </>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                onPress={() => router.push('/modules/locations' as any)}
                disabled={loading}
                activeOpacity={0.7}
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
                activeOpacity={0.7}
              >
                {loading ? (
                  <View style={styles.loadingBtnContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Creating...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>✓ Create Location</Text>
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
  formHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '400',
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F44336',
    flex: 1,
  },
  loadingBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
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
    borderWidth: 1,
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
