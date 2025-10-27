import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getLocationById,
  updateLocation,
  fetchAllZones,
  ZoneOption,
} from '@/services/locationService';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

export default function EditLocationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [locationName, setLocationName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (id) {
      loadLocationData();
      loadZones();
    }
  }, [id]);

  const loadLocationData = async () => {
    setLoading(true);
    try {
      const locationData = await getLocationById(id as string);
      setLocationName(locationData?.location || '');
      // Ensure zoneId is stored as a number
      setSelectedZoneId(locationData?.zoneId ? Number(locationData.zoneId) : null);
    } catch (error) {
      console.error('Error loading location:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load location data',
      });
      router.push('/modules/locations' as any);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        location: locationName.trim(),
      };
      
      // Only include zoneId if it's selected and convert to number
      if (selectedZoneId) {
        payload.zoneId = Number(selectedZoneId);
      }
      
      await updateLocation(id as string, payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Location updated successfully',
      });
      router.push('/modules/locations' as any);
    } catch (error) {
      console.error('Error updating location:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update location',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const backgroundColor = useThemeColor({}, 'background');

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader title="Edit Location" backPath="/modules/locations" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading location data...
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Edit Location" backPath="/modules/locations" />

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
              Location Details
            </Text>

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
                placeholder="Enter location name"
                placeholderTextColor={colors.placeholder}
                value={locationName}
                onChangeText={(text) => {
                  setLocationName(text);
                  if (nameError) setNameError('');
                }}
                editable={!submitting}
                autoCapitalize="words"
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Region (Optional)
              </Text>
              {loadingZones ? (
                <View style={[styles.zonesLoadingContainer, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.zonesLoadingText, { color: colors.text }]}>
                    Loading regions...
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <Picker
                    selectedValue={selectedZoneId}
                    onValueChange={(value) => setSelectedZoneId(value)}
                    style={[styles.picker, { color: colors.text }]}
                    enabled={!submitting}
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
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => router.push('/modules/locations' as any)}
                disabled={submitting}
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
                    opacity: submitting ? 0.7 : 1,
                  },
                ]}
                onPress={handleUpdate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Location</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  zonesLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  zonesLoadingText: {
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
