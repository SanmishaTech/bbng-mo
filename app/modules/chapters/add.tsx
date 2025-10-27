import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  createChapter,
  fetchAllZones,
  fetchAllLocations,
  ZoneOption,
  LocationOption,
} from '@/services/chapterService';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddChapterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [meetingday, setMeetingday] = useState('');
  const [status, setStatus] = useState(true);
  const [venue, setVenue] = useState('');
  const [bankopeningbalance, setBankopeningbalance] = useState('');
  const [cashopeningbalance, setCashopeningbalance] = useState('');

  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [nameError, setNameError] = useState('');
  const [zoneError, setZoneError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [dateError, setDateError] = useState('');
  const [meetingdayError, setMeetingdayError] = useState('');
  const [venueError, setVenueError] = useState('');

  useEffect(() => {
    loadZones();
    loadLocations();
  }, []);

  // Filter locations when zone changes
  const filteredLocations = useMemo(() => {
    if (!selectedZoneId) return [];
    // Convert to number to ensure proper comparison
    const zoneIdNum = typeof selectedZoneId === 'string' ? parseInt(selectedZoneId) : selectedZoneId;
    const filtered = locations.filter((loc) => loc.zoneId === zoneIdNum);
    console.log('Filtering locations for zone:', zoneIdNum, 'Found:', filtered.length);
    return filtered;
  }, [locations, selectedZoneId]);

  // Clear location when zone changes
  useEffect(() => {
    // Always clear location when zone changes
    if (selectedLocationId) {
      setSelectedLocationId(null);
    }
  }, [selectedZoneId]);

  const loadZones = async () => {
    try {
      const zonesData = await fetchAllZones();
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading zones:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load zones',
      });
    } finally {
      setLoadingZones(false);
    }
  };

  const loadLocations = async () => {
    try {
      const locationsData = await fetchAllLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load locations',
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const validate = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Chapter name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!selectedZoneId) {
      setZoneError('Zone is required');
      isValid = false;
    } else {
      setZoneError('');
    }

    if (!selectedLocationId) {
      setLocationError('Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }

    if (!date) {
      setDateError('Formation date is required');
      isValid = false;
    } else {
      setDateError('');
    }

    if (!meetingday) {
      setMeetingdayError('Meeting day is required');
      isValid = false;
    } else {
      setMeetingdayError('');
    }

    if (!venue.trim()) {
      setVenueError('Venue is required');
      isValid = false;
    } else {
      setVenueError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        zoneId: Number(selectedZoneId),
        locationId: Number(selectedLocationId),
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        meetingday,
        status,
        venue: venue.trim(),
        bankopeningbalance: bankopeningbalance ? parseFloat(bankopeningbalance) : null,
        bankclosingbalance: null,
        cashopeningbalance: cashopeningbalance ? parseFloat(cashopeningbalance) : null,
        cashclosingbalance: null,
      };

      console.log('Creating chapter with payload:', payload);
      await createChapter(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Chapter created successfully',
      });
      router.push('/modules/chapters' as any);
    } catch (error) {
      console.error('Error creating chapter:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create chapter',
      });
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Chapter" backPath="/modules/chapters" />

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
              Chapter Details
            </Text>

            {/* Chapter Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Chapter Name <Text style={styles.required}>*</Text>
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
                placeholder="Enter chapter name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError('');
                }}
                editable={!loading}
              />
              {nameError && <Text style={styles.errorText}>{nameError}</Text>}
            </View>

            {/* Zone */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Zone <Text style={styles.required}>*</Text>
              </Text>
              {loadingZones ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading zones...
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: zoneError ? '#F44336' : colors.border }]}>
                  <Picker
                    selectedValue={selectedZoneId?.toString() || ''}
                    onValueChange={(value) => {
                      const numValue = value ? parseInt(value) : null;
                      console.log('Zone selected:', value, 'converted to:', numValue);
                      setSelectedZoneId(numValue);
                      if (zoneError) setZoneError('');
                    }}
                    style={[styles.picker, { color: colors.text }]}
                    enabled={!loading}
                  >
                    <Picker.Item label="-- Select a Zone --" value="" />
                    {zones.map((zone) => (
                      <Picker.Item key={zone.id} label={zone.name} value={zone.id.toString()} />
                    ))}
                  </Picker>
                </View>
              )}
              {zoneError && <Text style={styles.errorText}>{zoneError}</Text>}
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              {loadingLocations ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading locations...
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: locationError ? '#F44336' : colors.border }]}>
                  <Picker
                    selectedValue={selectedLocationId?.toString() || ''}
                    onValueChange={(value) => {
                      const numValue = value ? parseInt(value) : null;
                      console.log('Location selected:', value, 'converted to:', numValue);
                      setSelectedLocationId(numValue);
                      if (locationError) setLocationError('');
                    }}
                    style={[styles.picker, { color: colors.text }]}
                    enabled={!loading && !!selectedZoneId}
                  >
                    <Picker.Item label="-- Select a Location --" value="" />
                    {filteredLocations.length === 0 && selectedZoneId ? (
                      <Picker.Item label="No locations available" value="" enabled={false} />
                    ) : (
                      filteredLocations.map((location) => (
                        <Picker.Item key={location.id} label={location.location} value={location.id.toString()} />
                      ))
                    )}
                  </Picker>
                </View>
              )}
              {locationError && <Text style={styles.errorText}>{locationError}</Text>}
              {!selectedZoneId && (
                <Text style={[styles.helpText, { color: colors.placeholder }]}>
                  Please select a zone first
                </Text>
              )}
            </View>

            {/* Formation Date */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Formation Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: dateError ? '#F44336' : colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  📅 {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                      if (dateError) setDateError('');
                    }
                  }}
                />
              )}
              {dateError && <Text style={styles.errorText}>{dateError}</Text>}
            </View>

            {/* Meeting Day */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Meeting Day <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.pickerContainer, { borderColor: meetingdayError ? '#F44336' : colors.border }]}>
                <Picker
                  selectedValue={meetingday}
                  onValueChange={(value) => {
                    setMeetingday(value);
                    if (meetingdayError) setMeetingdayError('');
                  }}
                  style={[styles.picker, { color: colors.text }]}
                  enabled={!loading}
                >
                  <Picker.Item label="-- Select a Day --" value="" />
                  {DAYS_OF_WEEK.map((day) => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
              </View>
              {meetingdayError && <Text style={styles.errorText}>{meetingdayError}</Text>}
            </View>

            {/* Venue */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Meeting Venue <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: venueError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter venue address"
                placeholderTextColor={colors.placeholder}
                value={venue}
                onChangeText={(text) => {
                  setVenue(text);
                  if (venueError) setVenueError('');
                }}
                editable={!loading}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {venueError && <Text style={styles.errorText}>{venueError}</Text>}
            </View>

            {/* Financial Section */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
              Financial Details (Optional)
            </Text>

            {/* Bank Opening Balance */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Bank Opening Balance
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
                placeholder="Enter bank opening balance"
                placeholderTextColor={colors.placeholder}
                value={bankopeningbalance}
                onChangeText={setBankopeningbalance}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            {/* Cash Opening Balance */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Cash Opening Balance
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
                placeholder="Enter cash opening balance"
                placeholderTextColor={colors.placeholder}
                value={cashopeningbalance}
                onChangeText={setCashopeningbalance}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            {/* Active Status Toggle */}
            <View style={[styles.switchField, { borderColor: colors.border }]}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Active</Text>
                <Text style={[styles.switchSubtext, { color: colors.placeholder }]}>
                  Enable to make this chapter active
                </Text>
              </View>
              <Switch
                value={status}
                onValueChange={setStatus}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={status ? colors.primary : '#f4f3f4'}
                disabled={loading}
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => router.push('/modules/chapters' as any)}
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
                  <Text style={styles.submitButtonText}>Create</Text>
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
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    paddingTop: 14,
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    color: '#F44336',
  },
  helpText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
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
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchSubtext: {
    fontSize: 12,
    marginTop: 2,
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
