import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Removed Tamagui imports due to dependency issues
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import * as z from "zod";

// Form schema validation
const formSchema = z.object({
  date: z.date(),
  chapterId: z.number(),
  toWhom: z.string().optional(),
  toWhomId: z.number().optional(),
  amount: z.string().min(1, "Amount is required"),
  narration: z.string().optional(),
  testimony: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Chapter {
  id: number;
  name: string;
}

interface Member {
  id: number;
  memberName: string;
  organizationName?: string;
}

const DoneDealForm = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [chapterPickerVisible, setChapterPickerVisible] = useState(false);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);

  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      chapterId: 0,
      toWhom: "",
      toWhomId: undefined,
      amount: "",
      narration: "",
      testimony: "",
    },
  });

  useEffect(() => {
    const loadDoneDeal = async () => {
      if (isEditMode && id) {
        try {
          const response = await apiService.get(
            `/api/thankyou-slips/${id}`
          );
          if (response && response.data) {
            const data = response.data;
            form.setValue("date", new Date(data.date));
            form.setValue("chapterId", data.chapterId);
            await loadMembersForChapter(data.chapterId);
            form.setValue("toWhom", data.toWhom);
            form.setValue("toWhomId", data.toWhomId);
            form.setValue("amount", data.amount);
            form.setValue("narration", data.narration || "");
            form.setValue("testimony", data.testimony || "");
            
            // Load members for the chapter after setting chapter ID
            setTimeout(() => {
              loadMembersForChapter(data.chapterId);
            }, 100);
          }
        } catch (error) {
          console.error("Failed to load deal for editing", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load deal for editing",
          });
        }
      }
    };

    const loadChapters = async () => {
      try {
        setLoading(true);
        const response = await apiService.get("/api/thankyou-slips/chapters");

        if (response && response.data?.chapters) {
          setChapters(response.data?.chapters);
          if (response.data?.chapters.length > 0) {
            form.setValue("chapterId", response.data?.chapters[0].id);
            loadMembersForChapter(response.data?.chapters[0].id);
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load chapter data",
          });
        }
      } catch (error: any) {
        console.error("Error loading done deal data:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message || "Failed to load data",
        });
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await loadChapters();
      if (isEditMode && id) {
        await loadDoneDeal();
      }
    };
    
    init();
  }, [id, isEditMode]);

  const loadMembersForChapter = async (chapterId: number) => {
    try {
      setLoadingMembers(true);
      const response = await apiService.get(
        `/api/thankyou-slips/members/chapter/${chapterId}`
      );

      if (response && Array.isArray(response.data?.members)) {
        let fetchedMembers = response.data?.members;
        // Exclude current logged-in user from the list
        const filteredMembers = fetchedMembers.filter(
          (member) => member.id !== user?.memberId
        );
        setMembers(filteredMembers);
      } else {
        setMembers([]);
        console.warn("No members found for this chapter");
      }
    } catch (error: any) {
      console.error("Error loading members:", error);
      setMembers([]);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load members",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChapterChange = (chapterId: string) => {
    const id = parseInt(chapterId);
    form.setValue("chapterId", id);
    form.setValue("toWhom", "");
    form.setValue("toWhomId", undefined);
    loadMembersForChapter(id);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const submissionData = {
        ...data,
      };

      let response;
      if (isEditMode && id) {
        response = await apiService.put(
          `/api/thankyou-slips/${id}`,
          submissionData
        );
      } else {
        response = await apiService.post(
          "/api/thankyou-slips",
          submissionData
        );
      }

      if (response && (response.thankYouSlip || response.success)) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: isEditMode 
            ? "Done deal updated successfully" 
            : "Done deal submitted successfully",
        });
        router.push("/done-deals");
      } else {
        throw new Error(isEditMode ? "Failed to update done deal" : "Failed to submit done deal");
      }
    } catch (error: any) {
      console.error("Error submitting done deal:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || (isEditMode ? "Update failed" : "Submission failed"),
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText>Loading chapters...</ThemedText>
      </ThemedView>
    );
  }

  const selectedChapter = chapters.find(
    (c) => c.id === form.watch("chapterId")
  );
  const selectedDate = form.watch("date");

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {chapters.length === 0 ? (
          <ThemedText>No chapters available</ThemedText>
        ) : (
          <View>
            {/* Date Field */}
            <ThemedText style={styles.label}>Date *</ThemedText>
            <TouchableOpacity
              onPress={() => setDatePickerVisible(true)}
              style={styles.dateInput}
            >
              <Text style={styles.dateText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : "Select Date"}
              </Text>
              <Text style={styles.pickerArrow}>📅</Text>
            </TouchableOpacity>
            {datePickerVisible && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate || new Date()}
                mode="date"
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  setDatePickerVisible(false);
                  if (event.type === "set" && selectedDate) {
                    form.setValue("date", selectedDate);
                  }
                }}
              />
            )}

            {/* Chapter Field */}
            <ThemedText style={styles.label}>Chapter *</ThemedText>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setChapterPickerVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedChapter ? selectedChapter.name : "Select Chapter"}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            {/* Member Field */}
            <ThemedText style={styles.label}>Send To *</ThemedText>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                (!members.length || loadingMembers) && styles.disabledPicker,
              ]}
              onPress={() =>
                !loadingMembers &&
                members.length > 0 &&
                setMemberPickerVisible(true)
              }
              disabled={!members.length || loadingMembers}
            >
              <Text style={styles.pickerButtonText}>
                {loadingMembers
                  ? "Loading members..."
                  : (form.watch("toWhomId") &&
                      members.find((m) => m.id === form.watch("toWhomId"))
                        ?.memberName) ||
                    "Select Member"}
              </Text>
              {loadingMembers ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.pickerArrow}>▼</Text>
              )}
            </TouchableOpacity>

            <ThemedText style={styles.label}>Amount *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={form.watch("amount")}
              onChangeText={(text) => form.setValue("amount", text)}
              keyboardType="numeric"
            />

            <ThemedText style={styles.label}>Narration (Optional)</ThemedText>
            <TextInput
              style={styles.textArea}
              placeholder="Enter narration"
              value={form.watch("narration")}
              onChangeText={(text) => form.setValue("narration", text)}
              multiline
              numberOfLines={3}
            />

            <ThemedText style={styles.label}>Testimony (Optional)</ThemedText>
            <TextInput
              style={styles.textArea}
              placeholder="Enter testimony"
              value={form.watch("testimony")}
              onChangeText={(text) => form.setValue("testimony", text)}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={form.handleSubmit(onSubmit)}
            >
              <Text style={styles.submitButtonText}>
                {isEditMode ? "Update Done Deal" : "Submit Done Deal"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Chapter Picker Modal */}
      <Modal visible={chapterPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Chapter</ThemedText>
              <TouchableOpacity
                onPress={() => setChapterPickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={chapters}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    form.setValue("chapterId", item.id);
                    form.setValue("toWhom", "");
                    form.setValue("toWhomId", undefined);
                    loadMembersForChapter(item.id);
                    setChapterPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Member Picker Modal */}
      <Modal visible={memberPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Member</ThemedText>
              <TouchableOpacity
                onPress={() => setMemberPickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={members}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    form.setValue("toWhomId", item.id);
                    form.setValue("toWhom", item.memberName);
                    setMemberPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.memberName}</Text>
                  {item.organizationName && (
                    <Text style={styles.modalItemSubText}>
                      {item.organizationName}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: 54,
  },
  textArea: {
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 120,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 32,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
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
  modalItemSubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  disabledPicker: {
    backgroundColor: "#f0f0f0",
    opacity: 0.7,
  },
});

export default DoneDealForm;
