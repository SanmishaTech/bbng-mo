import { NavigationHeader } from "@/components/NavigationHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { apiService } from "@/services/apiService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface DoneDeal {
  id: number;
  date: string;
  amount: string;
  toWhom: string;
  narration: string;
  testimony?: string;
  fromMemberId: number;
  toWhomId: number;
  chapterId: number;
  chapter: {
    id: number;
    name: string;
  };
  fromMember: {
    id: number;
    memberName: string;
  };
  toWhomMember: {
    id: number;
    memberName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DoneDealsDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [doneDeal, setDoneDeal] = useState<DoneDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "surface");

  useEffect(() => {
    const fetchDoneDealDetail = async () => {
      try {
        if (!id) return;

        setLoading(true);
        const data = await apiService.get<any>(`/api/thankyou-slips/${id}`);

        if (data) {
          setDoneDeal(data.data || data);
        }
      } catch (error) {
        console.error("Failed to fetch done deal detail", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch done deal detail",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoneDealDetail();
    }
  }, [id]);


  const handleDelete = () => {
    Alert.alert(
      "Delete Done Deal",
      "Are you sure you want to delete this done deal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.delete(`/api/thankyou-slips/${id}`);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Done deal deleted successfully",
              });
              router.push('/done-deals' as any);
            } catch (error) {
              console.error("Failed to delete done deal", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete done deal",
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView
        style={[styles.container, styles.centered, { backgroundColor }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading done deal...</ThemedText>
      </ThemedView>
    );
  }

  if (!doneDeal) {
    return (
      <ThemedView
        style={[styles.container, styles.centered, { backgroundColor }]}
      >
        <IconSymbol
          name="exclamationmark.triangle"
          size={50}
          color={colors.icon}
        />
        <ThemedText style={styles.errorText}>Done deal not found</ThemedText>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/done-deals' as any)}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderField = (
    label: string,
    value: string | undefined,
    icon?: string
  ) => {
    if (!value) return null;

    return (
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: cardColor, borderColor: colors.border },
        ]}
      >
        <View style={styles.fieldHeader}>
          {icon && (
            <IconSymbol name={icon as any} size={16} color={colors.icon} />
          )}
          <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        </View>
        <ThemedText style={styles.fieldValue}>{value}</ThemedText>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="Done Deal Detail"
        backPath="/done-deals"
        rightComponent={
          <TouchableOpacity
            style={[
              styles.headerButton,
              { backgroundColor: colors.destructive },
            ]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash" size={16} color="white" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {/* <View
          style={[
            styles.header,
            { backgroundColor: cardColor, borderColor: colors.border },
          ]}
        >
          <ThemedText style={styles.title}>
            {doneDeal.toWhom || "Done Deal Detail"}
          </ThemedText>
          <View
            style={[styles.amountBadge, { backgroundColor: colors.success }]}
          >
            <ThemedText style={[styles.amountText, { color: "white" }]}>
              {doneDeal.amount}
            </ThemedText>
          </View>
        </View> */}

        {doneDeal.fromMember && (
          <View style={styles.sectionContainer}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              From
            </ThemedText>
            <View
              style={[
                styles.participantCard,
                { backgroundColor: cardColor, borderColor: colors.border },
              ]}
            >
              <View style={styles.participantHeader}>
                <IconSymbol
                  name="person.badge.minus"
                  size={20}
                  color="#FF6B6B"
                />
                <ThemedText
                  style={[styles.participantRole, { color: "#FF6B6B" }]}
                >
                  Giver
                </ThemedText>
              </View>
              <ThemedText style={styles.participantName}>
                {doneDeal.fromMember.memberName}
              </ThemedText>
            </View>
          </View>
        )}

        {/* To Member Information */}
        {doneDeal.toWhomMember && (
          <View style={styles.sectionContainer}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              To
            </ThemedText>
            <View
              style={[
                styles.participantCard,
                { backgroundColor: cardColor, borderColor: colors.border },
              ]}
            >
              <View style={styles.participantHeader}>
                <IconSymbol
                  name="person.badge.plus"
                  size={20}
                  color={colors.success}
                />
                <ThemedText
                  style={[styles.participantRole, { color: colors.success }]}
                >
                  Receiver
                </ThemedText>
              </View>
              <ThemedText style={styles.participantName}>
                {doneDeal.toWhomMember.memberName}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Done Deal Details */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Transaction Details
          </ThemedText>
          <View style={styles.detailsContainer}>
            {renderField("Date", formatDate(doneDeal.date), "calendar")}
            {renderField("Amount", `₹${doneDeal.amount}`, "dollarsign.circle")}
            {renderField(
              "Narration",
              doneDeal.narration || "No narration provided",
              "doc.text"
            )}
            {renderField(
              "Testimony",
              doneDeal.testimony || "No testimony provided",
              "hand.wave"
            )}
            {doneDeal.chapter &&
              renderField("Chapter", doneDeal.chapter.name, "building.2")}
          </View>
        </View>

        {/* From Member Information */}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  amountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  fieldContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  participantCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  participantRole: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  participantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  participantOrg: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  participantId: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
