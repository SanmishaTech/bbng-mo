import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createPackage, fetchAllChapters, ChapterOption } from '@/services/packageService';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function AddPackageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [packageName, setPackageName] = useState('');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [isVenueFee, setIsVenueFee] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [basicFees, setBasicFees] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [active, setActive] = useState(true);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [nameError, setNameError] = useState('');
  const [feesError, setFeesError] = useState('');
  const [gstError, setGstError] = useState('');

  // Calculated values
  const [gstAmount, setGstAmount] = useState(0);
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    loadChapters();
  }, []);

  // Calculate GST and total whenever basicFees or gstRate changes
  useEffect(() => {
    const basic = parseFloat(basicFees) || 0;
    const rate = parseFloat(gstRate) || 0;
    
    const calculatedGst = (basic * rate) / 100;
    const calculatedTotal = basic + calculatedGst;
    
    setGstAmount(calculatedGst);
    setTotalFees(calculatedTotal);
  }, [basicFees, gstRate]);

  const loadChapters = async () => {
    try {
      const chaptersData = await fetchAllChapters();
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load chapters',
      });
    } finally {
      setLoadingChapters(false);
    }
  };

  const validate = () => {
    let isValid = true;

    if (!packageName.trim()) {
      setNameError('Package name is required');
      isValid = false;
    } else if (packageName.trim().length < 2) {
      setNameError('Package name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!basicFees || parseFloat(basicFees) <= 0) {
      setFeesError('Basic fees must be greater than 0');
      isValid = false;
    } else {
      setFeesError('');
    }

    if (!gstRate || parseFloat(gstRate) < 0) {
      setGstError('GST rate cannot be negative');
      isValid = false;
    } else {
      setGstError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        packageName: packageName.trim(),
        periodMonths: Number(periodMonths),
        isVenueFee,
        chapterId: isVenueFee && selectedChapterId ? Number(selectedChapterId) : null,
        basicFees: parseFloat(basicFees),
        gstRate: parseFloat(gstRate),
        active,
      };
      
      console.log('Creating package with payload:', payload);
      await createPackage(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Package created successfully',
      });
      router.push('/modules/packages' as any);
    } catch (error) {
      console.error('Error creating package:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create package',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Package" backPath="/modules/packages" />

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
              Package Details
            </Text>

            {/* Package Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Package Name <Text style={styles.required}>*</Text>
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
                placeholder="Enter package name"
                placeholderTextColor={colors.placeholder}
                value={packageName}
                onChangeText={(text) => {
                  setPackageName(text);
                  if (nameError) setNameError('');
                }}
                editable={!loading}
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            {/* Period */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Period (Months) <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={periodMonths}
                  onValueChange={(value) => setPeriodMonths(value)}
                  style={[styles.picker, { color: colors.text }]}
                  enabled={!loading}
                >
                  <Picker.Item label="1 month" value={1} />
                  <Picker.Item label="3 months" value={3} />
                  <Picker.Item label="6 months" value={6} />
                  <Picker.Item label="12 months" value={12} />
                </Picker>
              </View>
            </View>

            {/* Is Venue Fee Toggle */}
            <View style={[styles.switchField, { borderColor: colors.border }]}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Is Venue Fee
                </Text>
                <Text style={[styles.switchSubtext, { color: colors.placeholder }]}>
                  Enable if this package is for venue fees
                </Text>
              </View>
              <Switch
                value={isVenueFee}
                onValueChange={(value) => {
                  setIsVenueFee(value);
                  if (!value) {
                    setSelectedChapterId(null);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isVenueFee ? colors.primary : '#f4f3f4'}
                disabled={loading}
              />
            </View>

            {/* Chapter Selection (only if isVenueFee) */}
            {isVenueFee && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Chapter
                </Text>
                {loadingChapters ? (
                  <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                      Loading chapters...
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                    <Picker
                      selectedValue={selectedChapterId}
                      onValueChange={(value) => setSelectedChapterId(value)}
                      style={[styles.picker, { color: colors.text }]}
                      enabled={!loading}
                    >
                      <Picker.Item label="-- Select a Chapter (Optional) --" value={null} />
                      {chapters.map((chapter) => (
                        <Picker.Item
                          key={chapter.id}
                          label={chapter.name}
                          value={chapter.id}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>
            )}

            {/* Basic Fees */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Basic Fees <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: feesError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter basic fees"
                placeholderTextColor={colors.placeholder}
                value={basicFees}
                onChangeText={(text) => {
                  setBasicFees(text);
                  if (feesError) setFeesError('');
                }}
                keyboardType="decimal-pad"
                editable={!loading}
              />
              {feesError && (
                <Text style={styles.errorText}>{feesError}</Text>
              )}
            </View>

            {/* GST Rate */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                GST Rate (%) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: gstError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter GST rate"
                placeholderTextColor={colors.placeholder}
                value={gstRate}
                onChangeText={(text) => {
                  setGstRate(text);
                  if (gstError) setGstError('');
                }}
                keyboardType="decimal-pad"
                editable={!loading}
              />
              {gstError && (
                <Text style={styles.errorText}>{gstError}</Text>
              )}
            </View>

            {/* Preview Calculation */}
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Preview
              </Text>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.placeholder }]}>
                  Basic Fees:
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {formatCurrency(parseFloat(basicFees) || 0)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.placeholder }]}>
                  GST ({gstRate || 0}%):
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {formatCurrency(gstAmount)}
                </Text>
              </View>
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <View style={styles.previewRow}>
                <Text style={[styles.previewTotalLabel, { color: colors.text }]}>
                  Total:
                </Text>
                <Text style={[styles.previewTotalValue, { color: colors.primary }]}>
                  {formatCurrency(totalFees)}
                </Text>
              </View>
            </View>

            {/* Active Status Toggle */}
            <View style={[styles.switchField, { borderColor: colors.border }]}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Active
                </Text>
                <Text style={[styles.switchSubtext, { color: colors.placeholder }]}>
                  Enable to make this package available
                </Text>
              </View>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={active ? colors.primary : '#f4f3f4'}
                disabled={loading}
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => router.push('/modules/packages' as any)}
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
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewDivider: {
    height: 1,
    marginVertical: 12,
  },
  previewTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewTotalValue: {
    fontSize: 18,
    fontWeight: '800',
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
