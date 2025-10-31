import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { createMembership } from '@/services/membershipService';
import { getMembers, getMemberById } from '@/services/memberService';
import { getPackages } from '@/services/packageService';
import { Picker } from '@/components/Picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const MAHARASHTRA_KEYWORDS = ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik'];

const isMemberFromMaharashtra = (memberData: any): boolean => {
  if (!memberData) return false;

  // Check GST number - if it starts with 27, it's Maharashtra
  if (memberData.gstNo) {
    const gstNumber = memberData.gstNo.trim();
    if (gstNumber.length >= 2) {
      const stateCode = gstNumber.substring(0, 2);
      return stateCode === '27';
    }
  }

  // Check stateName field
  if (memberData.stateName) {
    const state = memberData.stateName.toLowerCase();
    return state.includes('maharashtra') || MAHARASHTRA_KEYWORDS.some(keyword => state.includes(keyword));
  }

  return false;
};

export default function AddMembershipScreen() {
  const router = useRouter();
  const { memberId: queryMemberId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = useThemeColor({}, 'background');

  // Form state
  const [memberId, setMemberId] = useState<number | null>(queryMemberId ? Number(queryMemberId) : null);
  const [memberData, setMemberData] = useState<any>(null);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [basicFees, setBasicFees] = useState<number>(0);
  const [cgstRate, setCgstRate] = useState<number | null>(null);
  const [sgstRate, setSgstRate] = useState<number | null>(null);
  const [igstRate, setIgstRate] = useState<number | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [packageStartDate, setPackageStartDate] = useState(new Date());
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentMode, setPaymentMode] = useState('cash');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState<Date | null>(null);
  const [bankName, setBankName] = useState('');
  const [neftNumber, setNeftNumber] = useState('');
  const [utrNumber, setUtrNumber] = useState('');

  // UI state
  const [members, setMembers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [showChequeDatePicker, setShowChequeDatePicker] = useState(false);

  // Load members and packages
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load members
      const membersResponse = await getMembers(1, 100, '', 'memberName', 'asc', 'true');
      const membersList = membersResponse.data.members || [];
      setMembers(membersList);

      // Load packages
      const packagesResponse = await getPackages(1, 100, '', 'packageName', 'asc');
      const packagesList = packagesResponse.data.packages || [];
      setPackages(packagesList);

      // If memberId from query params, load member data
      if (queryMemberId) {
        await loadMemberData(Number(queryMemberId));
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load form data',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadMemberData = async (id: number) => {
    try {
      const data = await getMemberById(id);
      setMemberData(data);

      // Set GST rates based on member location
      const isFromMaha = isMemberFromMaharashtra(data);
      if (isFromMaha) {
        setCgstRate(9);
        setSgstRate(9);
        setIgstRate(null);
      } else {
        setCgstRate(null);
        setSgstRate(null);
        setIgstRate(18);
      }
    } catch (error) {
      console.error('Error loading member:', error);
    }
  };

  // Handle member selection
  const handleMemberChange = async (selectedMemberId: number) => {
    setMemberId(selectedMemberId);
    setPackageId(null);
    setBasicFees(0);
    await loadMemberData(selectedMemberId);
  };

  // Filter packages based on member's chapter and active memberships
  useEffect(() => {
    if (!memberData || packages.length === 0) {
      setAvailablePackages(packages);
      return;
    }

    const now = new Date();
    const hasActiveVenue = memberData.venueExpiryDate && new Date(memberData.venueExpiryDate) > now;
    const hasActiveHO = memberData.hoExpiryDate && new Date(memberData.hoExpiryDate) > now;

    let filtered = packages;

    // Filter by chapter
    if (memberData.chapterId) {
      filtered = packages.filter(pkg => 
        pkg.chapterId === null || pkg.chapterId === memberData.chapterId
      );
    }

    // Filter by membership type
    if (hasActiveVenue && hasActiveHO) {
      // Show all
      setAvailablePackages(filtered);
    } else {
      filtered = filtered.filter(pkg => {
        if (pkg.isVenueFee && hasActiveVenue) return false;
        if (!pkg.isVenueFee && hasActiveHO) return false;
        return true;
      });
      setAvailablePackages(filtered);
    }
  }, [memberData, packages]);

  // Handle package selection and auto-fill start date
  const handlePackageChange = (selectedPackageId: number) => {
    setPackageId(selectedPackageId);
    
    const selectedPackage = availablePackages.find(p => p.id === selectedPackageId);
    if (selectedPackage) {
      setBasicFees(selectedPackage.basicFees);

      // Auto-fill package start date from relevant expiry date
      if (memberData) {
        let expiryDate: Date | null = null;
        
        if (selectedPackage.isVenueFee === false && memberData.hoExpiryDate) {
          // HO package - use HO expiry
          expiryDate = new Date(memberData.hoExpiryDate);
        } else if (selectedPackage.isVenueFee === true && memberData.venueExpiryDate) {
          // Venue package - use Venue expiry
          expiryDate = new Date(memberData.venueExpiryDate);
        }

        if (expiryDate && !isNaN(expiryDate.getTime())) {
          setPackageStartDate(expiryDate);
        }
      }
    }
  };

  // Calculate tax amounts
  const taxCalculations = useMemo(() => {
    const fees = Number(basicFees) || 0;
    const cgst = cgstRate !== null && cgstRate !== undefined && fees ? (fees * Number(cgstRate)) / 100 : 0;
    const sgst = sgstRate !== null && sgstRate !== undefined && fees ? (fees * Number(sgstRate)) / 100 : 0;
    const igst = igstRate !== null && igstRate !== undefined && fees ? (fees * Number(igstRate)) / 100 : 0;
    const totalTax = cgst + sgst + igst;
    const totalAmount = fees + totalTax;

    return { cgst, sgst, igst, totalTax, totalAmount };
  }, [basicFees, cgstRate, sgstRate, igstRate]);

  // Form validation
  const validateForm = (): string | null => {
    if (!memberId) return 'Please select a member';
    if (!packageId) return 'Please select a package';
    if (!basicFees || basicFees <= 0) return 'Basic fees must be greater than 0';
    if (!paymentMode) return 'Please select a payment mode';

    if (paymentMode === 'cheque') {
      if (!chequeNumber || chequeNumber.trim().length === 0) return 'Cheque number is required';
      if (!/^\d{6,12}$/.test(chequeNumber.trim())) return 'Cheque number must be 6-12 digits';
      if (!chequeDate) return 'Cheque date is required';
      if (!bankName || bankName.trim().length < 3) return 'Bank name must be at least 3 characters';
    } else if (paymentMode === 'netbanking') {
      if (!neftNumber || neftNumber.trim().length === 0) return 'NEFT/IMPS number is required';
      if (!/^[A-Za-z0-9]{11,18}$/.test(neftNumber.trim())) return 'NEFT/IMPS number must be 11-18 alphanumeric characters';
    } else if (paymentMode === 'upi') {
      if (!utrNumber || utrNumber.trim().length === 0) return 'UTR number is required';
      if (!/^[A-Za-z0-9]{16,22}$/.test(utrNumber.trim())) return 'UTR number must be 16-22 characters';
    }

    return null;
  };

  // Handle submit
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error,
      });
      return;
    }

    try {
      setLoading(true);

      const formData = {
        memberId: memberId!,
        packageId: packageId!,
        invoiceDate,
        packageStartDate,
        basicFees,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount: taxCalculations.cgst,
        sgstAmount: taxCalculations.sgst,
        igstAmount: taxCalculations.igst,
        totalTax: taxCalculations.totalTax,
        totalAmount: taxCalculations.totalAmount,
        paymentDate,
        paymentMode,
        chequeNumber: paymentMode === 'cheque' ? chequeNumber : null,
        chequeDate: paymentMode === 'cheque' ? chequeDate : null,
        bankName: paymentMode === 'cheque' ? bankName : null,
        neftNumber: paymentMode === 'netbanking' ? neftNumber : null,
        utrNumber: paymentMode === 'upi' ? utrNumber : null,
        active: true,
      };

      await createMembership(formData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Membership created successfully',
      });

      router.back();
    } catch (error: any) {
      console.error('Error creating membership:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to create membership',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loadingData) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader title="Add Membership" backPath="/modules/members" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Membership" backPath="/modules/members" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Member Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Member</Text>
          <Picker
            selectedValue={memberId}
            onValueChange={handleMemberChange}
            items={members.map(m => ({
              label: `${m.memberName} ${m.organizationName ? `- ${m.organizationName}` : ''}`,
              value: m.id,
            }))}
            placeholder="Select member..."
            enabled={!queryMemberId}
          />
        </View>

        {/* Member Info */}
        {memberData && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Member Information</Text>
            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={styles.infoLabel}>Name: </Text>
                {memberData.memberName}
              </Text>
              {memberData.organizationName && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={styles.infoLabel}>Business: </Text>
                  {memberData.organizationName}
                </Text>
              )}
              {memberData.gstNo && (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  <Text style={styles.infoLabel}>GST: </Text>
                  {memberData.gstNo}
                </Text>
              )}
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={styles.infoLabel}>GST Type: </Text>
                {cgstRate && sgstRate
                  ? 'Maharashtra (CGST + SGST)'
                  : igstRate
                  ? 'Outside Maharashtra (IGST)'
                  : 'Not determined'}
              </Text>
            </View>
          </View>
        )}

        {/* Package & Invoice */}
        {memberId && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice & Package Details</Text>
            
            {/* Invoice Date */}
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowInvoiceDatePicker(true)}
            >
              <Text style={[styles.dateLabel, { color: colors.text }]}>Invoice Date</Text>
              <Text style={[styles.dateValue, { color: colors.primary }]}>
                {invoiceDate.toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>

            {showInvoiceDatePicker && (
              <DateTimePicker
                value={invoiceDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowInvoiceDatePicker(false);
                  if (date) setInvoiceDate(date);
                }}
              />
            )}

            {/* Package Start Date */}
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateLabel, { color: colors.text }]}>Package Start Date</Text>
              <Text style={[styles.dateValue, { color: colors.primary }]}>
                {packageStartDate.toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>

            {showStartDatePicker && (
              <DateTimePicker
                value={packageStartDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setPackageStartDate(date);
                }}
              />
            )}

            {/* Package Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Package</Text>
              <Picker
                selectedValue={packageId}
                onValueChange={handlePackageChange}
                items={availablePackages.map(p => ({
                  label: `${p.packageName} (${p.periodMonths} months)`,
                  value: p.id,
                }))}
                placeholder="Select package..."
              />
            </View>

            {/* Basic Fees (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Basic Fees</Text>
              <View style={[styles.readOnlyInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {formatCurrency(basicFees)}
                </Text>
              </View>
            </View>

            {/* Preview */}
            {basicFees > 0 && (
              <View style={[styles.preview, { backgroundColor: colors.background }]}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.text }]}>Basic Fees:</Text>
                  <Text style={[styles.previewValue, { color: colors.text }]}>{formatCurrency(basicFees)}</Text>
                </View>
                {cgstRate !== null && cgstRate > 0 && (
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.text }]}>CGST ({cgstRate}%):</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{formatCurrency(taxCalculations.cgst)}</Text>
                  </View>
                )}
                {sgstRate !== null && sgstRate > 0 && (
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.text }]}>SGST ({sgstRate}%):</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{formatCurrency(taxCalculations.sgst)}</Text>
                  </View>
                )}
                {igstRate !== null && igstRate > 0 && (
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.text }]}>IGST ({igstRate}%):</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{formatCurrency(taxCalculations.igst)}</Text>
                  </View>
                )}
                <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                <View style={styles.previewRow}>
                  <Text style={[styles.previewTotal, { color: colors.text }]}>Total:</Text>
                  <Text style={[styles.previewTotalValue, { color: colors.primary }]}>
                    {formatCurrency(taxCalculations.totalAmount)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Details */}
        {packageId && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
            
            {/* Payment Mode */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Payment Mode</Text>
              <Picker
                selectedValue={paymentMode}
                onValueChange={setPaymentMode}
                items={[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Net Banking', value: 'netbanking' },
                  { label: 'UPI', value: 'upi' },
                  { label: 'Cheque', value: 'cheque' },
                ]}
              />
            </View>

            {/* Payment Date */}
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowPaymentDatePicker(true)}
            >
              <Text style={[styles.dateLabel, { color: colors.text }]}>Payment Date</Text>
              <Text style={[styles.dateValue, { color: colors.primary }]}>
                {paymentDate.toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>

            {showPaymentDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowPaymentDatePicker(false);
                  if (date) setPaymentDate(date);
                }}
              />
            )}

            {/* Conditional Payment Fields */}
            {paymentMode === 'cheque' && (
              <View style={[styles.paymentDetails, { borderColor: colors.border }]}>
                <Text style={[styles.paymentDetailsTitle, { color: colors.text }]}>Cheque Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Cheque Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter 6-12 digit number"
                    placeholderTextColor={colors.placeholder}
                    value={chequeNumber}
                    onChangeText={setChequeNumber}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.border }]}
                  onPress={() => setShowChequeDatePicker(true)}
                >
                  <Text style={[styles.dateLabel, { color: colors.text }]}>Cheque Date *</Text>
                  <Text style={[styles.dateValue, { color: chequeDate ? colors.primary : colors.placeholder }]}>
                    {chequeDate ? chequeDate.toLocaleDateString('en-IN') : 'Select date'}
                  </Text>
                </TouchableOpacity>

                {showChequeDatePicker && (
                  <DateTimePicker
                    value={chequeDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowChequeDatePicker(false);
                      if (date) setChequeDate(date);
                    }}
                  />
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Bank Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter bank name (min 3 characters)"
                    placeholderTextColor={colors.placeholder}
                    value={bankName}
                    onChangeText={setBankName}
                  />
                </View>
              </View>
            )}

            {paymentMode === 'netbanking' && (
              <View style={[styles.paymentDetails, { borderColor: colors.border }]}>
                <Text style={[styles.paymentDetailsTitle, { color: colors.text }]}>Bank Transfer Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>NEFT/IMPS Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter 11-18 alphanumeric characters"
                    placeholderTextColor={colors.placeholder}
                    value={neftNumber}
                    onChangeText={setNeftNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {paymentMode === 'upi' && (
              <View style={[styles.paymentDetails, { borderColor: colors.border }]}>
                <Text style={[styles.paymentDetailsTitle, { color: colors.text }]}>UPI Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>UTR Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter 16-22 alphanumeric characters"
                    placeholderTextColor={colors.placeholder}
                    value={utrNumber}
                    onChangeText={setUtrNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Submit Button */}
        {packageId && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Create Membership</Text>
            )}
          </TouchableOpacity>
        )}
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
    paddingBottom: 32,
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
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 14,
  },
  preview: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewDivider: {
    height: 1,
    marginVertical: 8,
  },
  previewTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentDetails: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  paymentDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
});
