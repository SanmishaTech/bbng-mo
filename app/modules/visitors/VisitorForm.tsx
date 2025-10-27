import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { apiService } from "@/services/apiService";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  Modal,
  FlatList,
} from "react-native";
// Removed Tamagui imports that were causing issues
import Toast from "react-native-toast-message";
import { z } from "zod";
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

// Define Zod schema for form validation
const visitorSchema = z.object({
  name: z.string().min(1, "Visitor name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  mobile1: z.string().min(10, "Mobile number must be at least 10 digits"),
  mobile2: z.string().optional().or(z.literal("")),
  isCrossChapter: z.boolean(),
  meetingId: z.number().min(1, "Please select a meeting"),
  chapterId: z.number().optional(),
  invitedById: z.number().optional(),
  category: z.string().optional().or(z.literal("")),
  businessDetails: z.string().optional().or(z.literal("")),
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  status: z.string().optional(),
});

// Infer the type from the schema
type FormData = z.infer<typeof visitorSchema>;

interface Meeting {
  id: number;
  meetingTitle: string;
  date: string;
}

interface Member {
  id: number;
  name: string;
}

const VisitorForm = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [meetingPickerVisible, setMeetingPickerVisible] = useState(false);
  const [invitedByPickerVisible, setInvitedByPickerVisible] = useState(false);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "",
      dateOfBirth: null,
      mobile1: "",
      mobile2: "",
      isCrossChapter: false,
      meetingId: 0,
      chapterId: user?.member?.chapterId || 0,
      invitedById: user?.member?.id || 0,
      category: "",
      businessDetails: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      pincode: "",
      status: "Invited",
    },
  });

  // Watch chapter selection to load members
  const watchedChapterId = watch("chapterId");

  // Store current user data
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Debug function to check AsyncStorage
  const checkAsyncStorage = async () => {
    try {
      console.log("=== CHECKING ASYNC STORAGE ===");

      // Get all keys in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All AsyncStorage keys:", allKeys);

      // Check specific auth keys
      const userData = await AsyncStorage.getItem("user_data");
      const authToken = await AsyncStorage.getItem("auth_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      console.log("User Data (raw):", userData);
      console.log("Auth Token (raw):", authToken);
      console.log("Refresh Token (raw):", refreshToken);

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log("Parsed User Data:", JSON.stringify(parsedUser, null, 2));
          console.log("User has member property:", !!parsedUser.member);
          if (parsedUser.member) {
            console.log(
              "Member data:",
              JSON.stringify(parsedUser.member, null, 2)
            );
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
        }
      }

      // Check other possible keys that might contain user data
      const possibleKeys = [
        "user",
        "currentUser",
        "userData",
        "auth_user",
        "logged_user",
      ];
      for (const key of possibleKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data && data !== "{}") {
          console.log(`Data found in key '${key}':`, data);
        }
      }

      console.log("=== END ASYNC STORAGE CHECK ===");
    } catch (error) {
      console.error("Error checking AsyncStorage:", error);
    }
  };

  // Debug currentUser state changes
  useEffect(() => {
    console.log("🔄 currentUser state changed:", {
      exists: !!currentUser,
      hasKeys: currentUser ? Object.keys(currentUser).length : 0,
      hasMember: !!currentUser?.member,
      memberName: currentUser?.member?.memberName || "N/A",
    });
  }, [currentUser]);

  // Load current user from AsyncStorage
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        console.log("=== LOADING USER DATA ===");

        // Check all possible keys in AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        console.log("All AsyncStorage keys:", allKeys);

        // Try different possible user keys, starting with the AuthContext key
        const possibleKeys = [
          "user_data",
          "user",
          "currentUser",
          "userData",
          "auth_user",
          "logged_user",
        ];
        let userData = {};

        for (const key of possibleKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data && data !== "{}") {
            console.log(`Found data in key '${key}':`, data);
            try {
              const parsed = JSON.parse(data);
              if (parsed && Object.keys(parsed).length > 0) {
                userData = parsed;
                console.log(`Using data from key '${key}':`, parsed);
                break;
              }
            } catch (e) {
              console.log(`Error parsing data from key '${key}':`, e);
            }
          }
        }

        console.log("Final userData:", userData);
        console.log(
          "Setting currentUser state with:",
          Object.keys(userData).length > 0 ? "valid data" : "empty object"
        );
        setCurrentUser(userData);
        setCurrentMemberId((userData as any)?.member?.id || null);
        console.log("=== END LOADING USER DATA ===");
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };
    loadCurrentUser();
  }, []);


  // Chapter is automatically set from logged-in user, no need to fetch chapters

  const fetchMeetings = async (chapterId: number) => {
    if (chapterId <= 0) {
      setMeetings([]);
      return;
    }
    try {
      setMeetingsLoading(true);
      const data = await apiService.get<any>(
        `/api/chapter-meetings?chapterId=${chapterId}&limit=100`
      );

      let meetingsArray = [];
      if (data?.data?.meetings && Array.isArray(data.data.meetings)) {
        meetingsArray = data.data.meetings;
      } else if (data?.meetings && Array.isArray(data.meetings)) {
        meetingsArray = data.meetings;
      } else if (Array.isArray(data)) {
        meetingsArray = data;
      }

      const mappedMeetings = meetingsArray
        .map((meeting: any) => ({
          id: meeting.id,
          meetingTitle: meeting.meetingTitle || meeting.title || "Meeting",
          date: meeting.date,
        }))
        .filter((meeting: any) => meeting.id);

      setMeetings(mappedMeetings);
    } catch (error) {
      console.error("Error loading meetings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load meetings",
      });
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchMembers = async (chapterId: number) => {
    if (chapterId <= 0) {
      setMembers([]);
      return;
    }
    try {
      setMembersLoading(true);
      const data = await apiService.get<any>(
        `/api/members?chapterId=${chapterId}&limit=100`
      );
      console.log(
        "Members API Response (full):",
        JSON.stringify(data, null, 2)
      );

      // Handle different possible response structures for members
      let membersArray = [];
      if (
        data &&
        data.data &&
        data.data.members &&
        Array.isArray(data.data.members)
      ) {
        console.log("Found members in data.data.members");
        membersArray = data.data.members;
      } else if (data && data.members && Array.isArray(data.members)) {
        console.log("Found members in data.members");
        membersArray = data.members;
      } else if (Array.isArray(data)) {
        console.log("Members data is directly an array");
        membersArray = data;
      } else {
        console.log("Unexpected members response structure:", data);
        membersArray = [];
      }

      // Map the members to the expected structure
      const mappedMembers = membersArray
        .map((member: any) => ({
          id: member.id,
          name: member.memberName || member.name,
        }))
        .filter((member: any) => member.id && member.name);

      console.log("Mapped members:", mappedMembers);
      console.log("Members count:", mappedMembers.length);
      setMembers(mappedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load members",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  // Watch for chapter changes to load meetings and members
  useEffect(() => {
    if (watchedChapterId && watchedChapterId > 0) {
      fetchMeetings(watchedChapterId);
      fetchMembers(watchedChapterId);
    }
  }, [watchedChapterId]);

  // Load meetings and members for user's chapter on mount
  useEffect(() => {
    if (user?.member?.chapterId) {
      fetchMeetings(user.member.chapterId);
      fetchMembers(user.member.chapterId);
    }
  }, [user]);

  useEffect(() => {
    if (isEditMode && id) {
      const loadVisitor = async () => {
        setLoading(true);
        try {
          console.log("Loading visitor for edit mode, ID:", id);

          const apiResponse = await apiService.get(`/api/visitors/${id}`);
          console.log("API response:", JSON.stringify(apiResponse, null, 2));

          let visitor = null;
          if ((apiResponse as any)?.data) {
            visitor = (apiResponse as any).data;
          } else {
            visitor = apiResponse;
          }

          if (!visitor) {
            throw new Error("Visitor data not found");
          }

          const formData = {
            name: visitor.name || "",
            email: visitor.email || "",
            gender: visitor.gender || "",
            dateOfBirth: visitor.dateOfBirth ? new Date(visitor.dateOfBirth) : null,
            mobile1: visitor.mobile1 || "",
            mobile2: visitor.mobile2 || "",
            isCrossChapter: visitor.isCrossChapter || false,
            meetingId: visitor.meetingId || 0,
            chapterId: user?.member?.chapterId || 0, // Always use logged-in user's chapter
            invitedById: visitor.invitedById || 0,
            category: visitor.category || "",
            businessDetails: visitor.businessDetails || "",
            addressLine1: visitor.addressLine1 || "",
            addressLine2: visitor.addressLine2 || "",
            city: visitor.city || "",
            pincode: visitor.pincode || "",
            status: visitor.status || "Invited",
          };

          console.log("Form data to be populated:", JSON.stringify(formData, null, 2));

          reset(formData);

          if (formData.chapterId > 0) {
            await fetchMeetings(formData.chapterId);
            await fetchMembers(formData.chapterId);

            setTimeout(() => {
              if (formData.meetingId > 0) {
                setValue("meetingId", formData.meetingId);
              }
              if (formData.invitedById > 0) {
                setValue("invitedById", formData.invitedById);
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error loading visitor:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load visitor data",
          });
          router.push('/modules/visitors' as any);
        } finally {
          setLoading(false);
        }
      };

      loadVisitor();
    }
  }, [isEditMode, id, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formattedData = {
        name: data.name,
        email: data.email || undefined,
        gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth?.toISOString() || undefined,
        mobile1: data.mobile1,
        mobile2: data.mobile2 || undefined,
        isCrossChapter: data.isCrossChapter,
        meetingId: data.meetingId,
        chapterId: user?.member?.chapterId || data.chapterId,
        invitedById: data.invitedById || user?.member?.id || currentMemberId || undefined,
        category: data.category || undefined,
        businessDetails: data.businessDetails || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        pincode: data.pincode || undefined,
        status: data.status || "Invited",
      };

      console.log("Submitting visitor data:", formattedData);

      if (isEditMode) {
        await apiService.put(`/api/visitors/${id}`, formattedData);
      } else {
        await apiService.post("/api/visitors", formattedData);
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Visitor ${isEditMode ? "updated" : "created"} successfully`,
      });

      setTimeout(() => {
        router.push("/modules/visitors");
      }, 1500);
    } catch (error) {
      console.error("Error saving visitor:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save visitor",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (
    label: string,
    children: React.ReactNode,
    error?: string
  ) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    items: { label: string; value: any }[],
    onSelect: (value: any) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item, index) => `picker-item-${index}-${item.value || 'empty'}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/modules/visitors' as any)} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Visitor" : "Add Visitor"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>

          {/* Debug Button to Check AsyncStorage */}
          {/* <TouchableOpacity
          onPress={checkAsyncStorage}
          style={styles.debugButton}
        >
          <Text style={styles.debugButtonText}>🔍 Check AsyncStorage</Text>
        </TouchableOpacity> */}

          {/* Visitor Name */}
          {renderFormField(
            "Visitor Name *",
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter visitor name"
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor="#999"
                />
              )}
            />,
            errors.name?.message
          )}

          {/* Primary Mobile */}
          {renderFormField(
            "Primary Mobile *",
            <Controller
              control={control}
              name="mobile1"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter primary mobile"
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              )}
            />,
            errors.mobile1?.message
          )}

          {/* Secondary Mobile */}
          {renderFormField(
            "Secondary Mobile",
            <Controller
              control={control}
              name="mobile2"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter secondary mobile"
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              )}
            />
          )}

          {/* Email */}
          {renderFormField(
            "Email",
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter email address"
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              )}
            />,
            errors.email?.message
          )}

          {/* Gender */}
          {renderFormField(
            "Gender",
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => {
                const genderOptions = [
                  { label: "Select Gender", value: "" },
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ];
                const selectedGender = genderOptions.find((g) => g.value === value);
                return (
                  <>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setGenderPickerVisible(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {selectedGender?.label || "Select Gender"}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                    {renderPickerModal(
                      genderPickerVisible,
                      () => setGenderPickerVisible(false),
                      genderOptions,
                      onChange,
                      "Select Gender"
                    )}
                  </>
                );
              }}
            />
          )}

          {/* Date of Birth */}
          {renderFormField(
            "Date of Birth",
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    onPress={() => setDobPickerVisible(true)}
                    style={styles.dateInput}
                  >
                    <Text style={styles.dateText}>
                      {value ? value.toLocaleDateString() : "Select Date of Birth"}
                    </Text>
                    <Text style={styles.pickerArrow}>📅</Text>
                  </TouchableOpacity>
                  {dobPickerVisible && (
                    <DateTimePicker
                      testID="dobPicker"
                      value={value || new Date()}
                      mode="date"
                      is24Hour={true}
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setDobPickerVisible(false);
                        if (event.type === "set" && selectedDate) {
                          onChange(selectedDate);
                        }
                      }}
                    />
                  )}
                </>
              )}
            />
          )}

          {/* Chapter is automatically set from logged-in user */}

          {/* Meeting Field */}
          {renderFormField(
            "Meeting *",
            <Controller
              control={control}
              name="meetingId"
              render={({ field: { onChange, value } }) => {
                const selectedMeeting = meetings.find((m) => m.id === value);
                return (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        (!meetings.length || meetingsLoading) && styles.disabledPicker,
                      ]}
                      onPress={() =>
                        !meetingsLoading && meetings.length > 0 && setMeetingPickerVisible(true)
                      }
                      disabled={!meetings.length || meetingsLoading}
                    >
                      <Text style={styles.pickerButtonText}>
                        {meetingsLoading
                          ? "Loading..."
                          : selectedMeeting
                          ? `${selectedMeeting.meetingTitle} (${new Date(
                              selectedMeeting.date
                            ).toLocaleDateString()})`
                          : "Select Meeting"}
                      </Text>
                      {meetingsLoading ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Text style={styles.pickerArrow}>▼</Text>
                      )}
                    </TouchableOpacity>
                    {renderPickerModal(
                      meetingPickerVisible,
                      () => setMeetingPickerVisible(false),
                      [
                        { label: "Select Meeting", value: 0 },
                        ...meetings.map((meeting) => ({
                          label: `${meeting.meetingTitle} (${new Date(
                            meeting.date
                          ).toLocaleDateString()})`,
                          value: meeting.id,
                        })),
                      ],
                      onChange,
                      "Select Meeting"
                    )}
                  </>
                );
              }}
            />,
            errors.meetingId?.message
          )}

          {/* Invited By */}
          {renderFormField(
            "Invited By",
            <Controller
              control={control}
              name="invitedById"
              render={({ field: { onChange, value } }) => {
                const selectedMember = members.find((m) => m.id === value);
                return (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        (!members.length || membersLoading) && styles.disabledPicker,
                      ]}
                      onPress={() =>
                        !membersLoading && members.length > 0 && setInvitedByPickerVisible(true)
                      }
                      disabled={!members.length || membersLoading}
                    >
                      <Text style={styles.pickerButtonText}>
                        {membersLoading
                          ? "Loading..."
                          : selectedMember
                          ? selectedMember.name
                          : "Select Member"}
                      </Text>
                      {membersLoading ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Text style={styles.pickerArrow}>▼</Text>
                      )}
                    </TouchableOpacity>
                    {renderPickerModal(
                      invitedByPickerVisible,
                      () => setInvitedByPickerVisible(false),
                      [
                        { label: "Select Member", value: 0 },
                        ...members.map((member) => ({
                          label: member.name,
                          value: member.id,
                        })),
                      ],
                      onChange,
                      "Select Member"
                    )}
                  </>
                );
              }}
            />
          )}

          {/* Category */}
          {renderFormField(
            "Category",
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter category"
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor="#999"
                />
              )}
            />
          )}

          {/* Business Details */}
          {renderFormField(
            "Business Details",
            <Controller
              control={control}
              name="businessDetails"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter business details"
                  style={[styles.input, styles.textArea]}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              )}
            />
          )}

          {/* Status */}
          {renderFormField(
            "Status",
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => {
                const statusOptions = [
                  { label: "Invited", value: "Invited" },
                  { label: "Attended", value: "Attended" },
                  { label: "Cancelled", value: "Cancelled" },
                ];
                const selectedStatus = statusOptions.find((s) => s.value === value);
                return (
                  <>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setStatusPickerVisible(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {selectedStatus?.label || "Select Status"}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                    {renderPickerModal(
                      statusPickerVisible,
                      () => setStatusPickerVisible(false),
                      statusOptions,
                      onChange,
                      "Select Status"
                    )}
                  </>
                );
              }}
            />
          )}

          {/* Cross Chapter Checkbox */}
          {renderFormField(
            "",
            <Controller
              control={control}
              name="isCrossChapter"
              render={({ field: { onChange, value } }) => (
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    value={value}
                    onValueChange={onChange}
                    style={styles.checkbox}
                  />
                  <ThemedText style={styles.checkboxLabel}>Cross Chapter Visitor</ThemedText>
                </View>
              )}
            />
          )}

          {/* Address Line 1 */}
          {renderFormField(
            "Address Line 1",
            <Controller
              control={control}
              name="addressLine1"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter address line 1"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          )}

          {/* Address Line 2 */}
          {renderFormField(
            "Address Line 2",
            <Controller
              control={control}
              name="addressLine2"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter address line 2"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          )}

          {/* City */}
          {renderFormField(
            "City",
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter city"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          )}

          {/* Pincode */}
          {renderFormField(
            "Pincode",
            <Controller
              control={control}
              name="pincode"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter pincode"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                />
              )}
            />
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={[styles.saveButton, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? "Update Visitor" : "Save Visitor"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/modules/visitors' as any)}
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  input: {
    height: 54,
    borderColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "white",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 18,
    paddingBottom: 18,
  },
  dateInput: {
    height: 54,
    borderColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: "#1a1a1a",
    flex: 1,
    fontWeight: "500",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
  },
  datePickerButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  datePickerButtonText: {
    color: "white",
    fontWeight: "600",
  },
  pickerContainer: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "white",
    position: "relative",
  },
  picker: {
    height: 50,
  },
  memberLoader: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: "rgba(0, 123, 255, 0.08)",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 0,
  },
  cancelButtonText: {
    color: "#007bff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
  pickerButton: {
    height: 54,
    borderColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledPicker: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#1a1a1a",
    flex: 1,
    fontWeight: "500",
  },
  pickerArrow: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "600",
  },
  modalItem: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "white",
  },
  modalItemText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  debugButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: "center",
  },
  debugButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default VisitorForm;
