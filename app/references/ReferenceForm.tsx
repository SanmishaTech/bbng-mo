import { NavigationHeader } from "@/components/NavigationHeader";
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

// Define Zod schema for form validation
const referenceSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  chapterId: z
    .number({
      required_error: "Chapter is required",
    })
    .min(1, "Please select a chapter"),
  memberId: z
    .number({
      required_error: "Member is required",
    })
    .min(1, "Please select a member"),
  urgency: z.string().optional(),
  self: z.boolean(),
  nameOfReferral: z
    .string({
      required_error: "Name of referral is required",
    })
    .min(1, "Name of referral is required"),
  mobile1: z
    .string({
      required_error: "Primary mobile number is required",
    })
    .min(10, "Mobile number must be at least 10 digits"),
  mobile2: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  remarks: z.string().optional(),
  addressLine1: z.string().optional(),
  location: z.string().optional(),
  addressLine2: z.string().optional(),
  pincode: z.string().optional(),
});

// Infer the type from the schema
type FormData = z.infer<typeof referenceSchema>;

interface Chapter {
  id: number;
  name: string;
}

interface Member {
  id: number;
  name: string;
}

const ReferenceForm = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [chapterPickerVisible, setChapterPickerVisible] = useState(false);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [urgencyPickerVisible, setUrgencyPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      date: new Date(),
      chapterId: 0,
      memberId: 0,
      urgency: "",
      self: false,
      nameOfReferral: "",
      mobile1: "",
      mobile2: "",
      email: "",
      remarks: "",
      addressLine1: "",
      location: "",
      addressLine2: "",
      pincode: "",
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
        setCurrentMemberId(userData?.member?.id || null);
        console.log("=== END LOADING USER DATA ===");
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  const fetchChapters = async () => {
    try {
      const data = await apiService.get<any>("/api/chapters?limit=100");
      console.log(
        "Chapters API Response (full):",
        JSON.stringify(data, null, 2)
      );

      // Handle different possible response structures
      let chaptersArray = [];
      if (
        data &&
        data.data &&
        data.data.chapters &&
        Array.isArray(data.data.chapters)
      ) {
        console.log("Found chapters in data.data.chapters");
        chaptersArray = data.data.chapters;
      } else if (data && data.chapters && Array.isArray(data.chapters)) {
        console.log("Found chapters in data.chapters");
        chaptersArray = data.chapters;
      } else if (Array.isArray(data)) {
        console.log("Data is directly an array");
        chaptersArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        console.log("Found chapters in data.data");
        chaptersArray = data.data;
      } else if (data && data.results && Array.isArray(data.results)) {
        console.log("Found chapters in data.results");
        chaptersArray = data.results;
      } else {
        console.log("Unexpected chapters response structure:", data);
        console.log("Data type:", typeof data);
        console.log("Data keys:", data ? Object.keys(data) : "null/undefined");
        chaptersArray = []; // Ensure it's always an array
      }

      console.log("Chapters array before filtering:", chaptersArray);
      console.log("Chapters array length:", chaptersArray.length);

      // Ensure each chapter has the required properties
      const validChapters = chaptersArray.filter(
        (chapter) =>
          chapter && typeof chapter.id !== "undefined" && chapter.name
      );

      console.log("Valid chapters after filtering:", validChapters);
      console.log("Valid chapters count:", validChapters.length);
      setChapters(validChapters);
    } catch (error) {
      console.error("Error loading chapters:", error);
      setChapters([]); // Ensure chapters is always an array even on error
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load chapters",
      });
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

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
        .map((member) => ({
          id: member.id,
          name: member.memberName || member.name,
        }))
        .filter((member) => member.id && member.name);

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

  // Watch for chapter changes to load members
  useEffect(() => {
    if (watchedChapterId > 0) {
      fetchMembers(watchedChapterId);
    }
  }, [watchedChapterId]);

  useEffect(() => {
    if (isEditMode && id) {
      const loadReference = async () => {
        setLoading(true);
        try {
          console.log("Loading reference for edit mode, ID:", id);

          let reference = null;

          // Try to fetch from API first
          try {
            const apiResponse = await apiService.get(`/api/references/${id}`);
            console.log(
              "API response (full):",
              JSON.stringify(apiResponse, null, 2)
            );

            // Handle nested response structure
            if (apiResponse && apiResponse.data) {
              reference = apiResponse.data;
            } else {
              reference = apiResponse;
            }
            console.log(
              "Extracted reference data:",
              JSON.stringify(reference, null, 2)
            );
          } catch (apiError) {
            console.log(
              "API fetch failed, trying AsyncStorage fallback...",
              apiError
            );

            // Fallback to cached data or legacy AsyncStorage data
            // Try API cache first (contains original API data structure)
            const apiCachedData = await AsyncStorage.getItem(
              "references_api_cache"
            );
            const cachedData = await AsyncStorage.getItem("references_cache");
            const legacyData = await AsyncStorage.getItem("references");

            let allReferences = [];
            if (apiCachedData) {
              allReferences = JSON.parse(apiCachedData);
            } else if (cachedData) {
              allReferences = JSON.parse(cachedData);
            } else if (legacyData) {
              allReferences = JSON.parse(legacyData);
            }

            reference = allReferences.find((ref: any) => ref.id === id);

            if (!reference) {
              throw new Error("Reference not found in cached data");
            }

            console.log(
              "Using cached reference data:",
              JSON.stringify(reference, null, 2)
            );
          }

          if (!reference) {
            throw new Error("Reference data not found");
          }

          // Handle both API format and legacy format
          const formData = {
            date: new Date(reference.date || reference.dateAdded || new Date()),
            chapterId: reference.chapterId || 0,
            memberId: reference.receiverId || reference.memberId || 0,
            urgency: reference.urgency || "",
            self: reference.self || false,
            nameOfReferral:
              reference.nameOfReferral ||
              reference.contact ||
              reference.title ||
              "",
            mobile1: reference.mobile1 || reference.phone || "",
            mobile2: reference.mobile2 || "",
            email: reference.email || "",
            remarks: reference.remarks || reference.notes || "",
            addressLine1: reference.addressLine1 || "",
            location: reference.location || "",
            addressLine2: reference.addressLine2 || "",
            pincode: reference.pincode || "",
          };

          console.log(
            "Form data to be populated:",
            JSON.stringify(formData, null, 2)
          );

          // Reset the form with the data
          reset(formData);

          // If we have chapter ID, ensure members are loaded
          if (formData.chapterId > 0) {
            console.log("Loading members for chapter:", formData.chapterId);
            await fetchMembers(formData.chapterId);

            // After members are loaded, set the member ID again to ensure it's selected
            setTimeout(() => {
              if (formData.memberId > 0) {
                console.log(
                  "Setting member ID after loading members:",
                  formData.memberId
                );
                setValue("memberId", formData.memberId);
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error loading reference:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load reference data",
          });
        } finally {
          setLoading(false);
        }
      };

      loadReference();
    }
  }, [isEditMode, id, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const formattedData = {
        date:
          data.date instanceof Date
            ? data.date.toISOString()
            : new Date().toISOString(),
        chapterId: data.chapterId,
        memberId: data.memberId,
        urgency: data.urgency || undefined,
        self: data.self,
        nameOfReferral: data.nameOfReferral,
        mobile1: data.mobile1,
        mobile2: data.mobile2 || undefined,
        email: data.email || undefined,
        remarks: data.remarks || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        location: data.location || undefined,
        pincode: data.pincode || undefined,
      };

      if (isEditMode) {
        await apiService.put(`/api/references/${id}`, formattedData);
      } else {
        await apiService.post("/api/references", formattedData);
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Reference ${isEditMode ? "updated" : "created"} successfully`,
      });

      // Navigate after a short delay to let the user see the success message
      setTimeout(() => {
        router.push("/references");
      }, 1500);
    } catch (error) {
      console.error("Error saving reference:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save reference",
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
      <NavigationHeader
        title={isEditMode ? "Edit Reference" : "Add Reference"}
        rightComponent={
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={[
              {
                backgroundColor: "#007bff",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                {isEditMode ? "Update" : "Save"}
              </Text>
            )}
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ThemedText style={styles.title}>
            {isEditMode ? "Edit Reference" : "New Reference"}
          </ThemedText>

          {/* Debug Button to Check AsyncStorage */}
          {/* <TouchableOpacity
          onPress={checkAsyncStorage}
          style={styles.debugButton}
        >
          <Text style={styles.debugButtonText}>🔍 Check AsyncStorage</Text>
        </TouchableOpacity> */}

          {/* Date Field */}
          {renderFormField(
            "Date *",
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    onPress={() => setDatePickerVisible(true)}
                    style={styles.dateInput}
                  >
                    <Text style={styles.dateText}>
                      {value ? value.toLocaleDateString() : "Select Date"}
                    </Text>
                    <Text style={styles.pickerArrow}>📅</Text>
                  </TouchableOpacity>
                  {datePickerVisible && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={value || new Date()}
                      mode="date"
                      is24Hour={true}
                      onChange={(event, selectedDate) => {
                        setDatePickerVisible(false);
                        if (event.type === "set" && selectedDate) {
                          onChange(selectedDate);
                        }
                      }}
                    />
                  )}
                </>
              )}
            />,
            errors.date?.message
          )}

          {/* Chapter Field */}
          {renderFormField(
            "Chapter *",
            <Controller
              control={control}
              name="chapterId"
              render={({ field: { onChange, value } }) => {
                const selectedChapter = Array.isArray(chapters)
                  ? chapters.find((c) => c && c.id === value)
                  : null;

                const chapterOptions = Array.isArray(chapters)
                  ? chapters.filter(
                      (chapter) => chapter && chapter.id && chapter.name
                    )
                  : [];

                return (
                  <>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setChapterPickerVisible(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {selectedChapter && selectedChapter.name
                          ? selectedChapter.name
                          : "Select Chapter"}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                    {renderPickerModal(
                      chapterPickerVisible,
                      () => setChapterPickerVisible(false),
                      [
                        { label: "Select Chapter", value: 0, _key: 'chapter-select-0' },
                        ...chapterOptions.map((chapter, index) => ({
                          label: chapter.name || "Unknown",
                          value: chapter.id,
                          _key: `chapter-${chapter.id}-${index}`,
                        })),
                      ],
                      onChange,
                      "Select Chapter"
                    )}
                  </>
                );
              }}
            />,
            errors.chapterId?.message
          )}

          {/* Member Field */}
          {renderFormField(
            "Member *",
            <Controller
              control={control}
              name="memberId"
              render={({ field: { onChange, value } }) => {
                const selectedMember = members.find((m) => m.id === value);
                return (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        (!members.length || membersLoading) &&
                          styles.disabledPicker,
                      ]}
                      onPress={() =>
                        !membersLoading &&
                        members.length > 0 &&
                        setMemberPickerVisible(true)
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
                      memberPickerVisible,
                      () => setMemberPickerVisible(false),
                      [
                        { label: "Select Member", value: 0, _key: 'member-select-0' },
                        ...members.map((member, index) => ({
                          label: member.name,
                          value: member.id,
                          _key: `member-${member.id}-${index}`,
                        })),
                      ],
                      onChange,
                      "Select Member"
                    )}
                  </>
                );
              }}
            />,
            errors.memberId?.message
          )}
          {/* Urgency */}
          {renderFormField(
            "Urgency",
            <Controller
              control={control}
              name="urgency"
              render={({ field: { onChange, value } }) => {
                const urgencyOptions = [
                  { label: "Select Urgency", value: "" },
                  { label: "Within 1 Month", value: "within_1_month" },
                  { label: "After 1 Month", value: "after_1_month" },
                ];
                const selectedUrgency = urgencyOptions.find(
                  (u) => u.value === value
                );
                return (
                  <>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setUrgencyPickerVisible(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {selectedUrgency
                          ? selectedUrgency.label
                          : "Select Urgency"}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                    {renderPickerModal(
                      urgencyPickerVisible,
                      () => setUrgencyPickerVisible(false),
                      urgencyOptions,
                      onChange,
                      "Select Urgency"
                    )}
                  </>
                );
              }}
            />
          )}

          {/* Self Checkbox */}
          {renderFormField(
            "",
            <Controller
              control={control}
              name="self"
              render={({ field: { onChange, value } }) => (
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    value={value}
                    onValueChange={(isChecked) => {
                      console.log("=== SELF CHECKBOX CLICKED ===");
                      console.log("Checked state:", isChecked);
                      console.log("Current user exists:", !!currentUser);
                      console.log(
                        "Current user full data:",
                        JSON.stringify(currentUser, null, 2)
                      );

                      onChange(isChecked);

                      if (
                        isChecked &&
                        currentUser &&
                        Object.keys(currentUser).length > 0
                      ) {
                        console.log("Processing auto-fill...");
                        const member = currentUser.member;
                        console.log(
                          "Member data:",
                          JSON.stringify(member, null, 2)
                        );

                        if (member) {
                          console.log("Setting form values...");

                          const nameValue =
                            member.memberName || currentUser.name || "";
                          const mobile1Value = member.mobile1 || "";
                          const emailValue =
                            member.email || currentUser.email || "";

                          console.log("Values to set:");
                          console.log("- nameOfReferral:", nameValue);
                          console.log("- mobile1:", mobile1Value);
                          console.log("- email:", emailValue);
                          console.log("- chapterId:", member.chapterId);
                          console.log("- memberId:", member.id);

                          setValue("nameOfReferral", nameValue);
                          setValue("mobile1", mobile1Value);
                          setValue("mobile2", member.mobile2 || "");
                          setValue("email", emailValue);
                          setValue("addressLine1", member.addressLine1 || "");
                          setValue("addressLine2", member.addressLine2 || "");
                          setValue("location", member.location || "");
                          setValue("pincode", member.pincode || "");

                          // Auto-select chapter and member if available
                          if (member.chapterId) {
                            console.log(
                              "Setting chapter ID:",
                              member.chapterId
                            );
                            setValue("chapterId", member.chapterId);

                            // Wait a bit for chapter to be set, then set member
                            setTimeout(() => {
                              if (member.id) {
                                console.log("Setting member ID:", member.id);
                                setValue("memberId", member.id);
                              }
                            }, 100);
                          }

                          console.log(
                            "Auto-filled form with user data - COMPLETE"
                          );
                        } else {
                          console.log("No member data found in currentUser");

                          // Try to use basic user data if member data is not available
                          if (currentUser.name || currentUser.email) {
                            console.log("Using basic user data as fallback...");
                            setValue("nameOfReferral", currentUser.name || "");
                            setValue("email", currentUser.email || "");
                            console.log("Set basic user data");
                          }
                        }
                      } else if (!isChecked) {
                        console.log("Clearing form fields...");
                        // Clear fields when unchecked (except chapter and member)
                        setValue("nameOfReferral", "");
                        setValue("mobile1", "");
                        setValue("mobile2", "");
                        setValue("email", "");
                        setValue("addressLine1", "");
                        setValue("addressLine2", "");
                        setValue("location", "");
                        setValue("pincode", "");

                        console.log("Cleared form fields - COMPLETE");
                      } else {
                        console.log(
                          "No action taken - currentUser is empty or null"
                        );
                      }
                      console.log("=== END SELF CHECKBOX ===");
                    }}
                    style={styles.checkbox}
                  />
                  <ThemedText style={styles.checkboxLabel}>Self</ThemedText>
                </View>
              )}
            />
          )}

          {/* Name of Referral */}
          {renderFormField(
            "Name of Referral *",
            <Controller
              control={control}
              name="nameOfReferral"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter name of referral"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />,
            errors.nameOfReferral?.message
          )}

          {/* Primary Mobile */}
          {renderFormField(
            "Primary Mobile *",
            <Controller
              control={control}
              name="mobile1"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter primary mobile number"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
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
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter secondary mobile number"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
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
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter email address"
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />,
            errors.email?.message
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

          {/* Location */}
          {renderFormField(
            "Location",
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter location"
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

          {/* Remarks */}
          {renderFormField(
            "Remarks",
            <Controller
              control={control}
              name="remarks"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter remarks"
                  style={[styles.input, styles.textArea]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
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
                  {isEditMode ? "Update Reference" : "Save Reference"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
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
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  dateInput: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
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
    paddingVertical: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007bff",
  },
  cancelButtonText: {
    color: "#007bff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 5,
  },
  pickerButton: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledPicker: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 18,
    color: "#666",
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
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

export default ReferenceForm;
