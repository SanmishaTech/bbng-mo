import { NavigationHeader } from "@/components/NavigationHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { del, get, patch } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

interface MemberRef {
  id: number;
  memberName: string;
  email: string;
  organizationName: string;
}

interface ChapterRef {
  id: number;
  name: string;
}

interface OneToOne {
  id: number;
  date: string;
  status: string;
  remarks?: string;
  requester?: MemberRef;
  requested?: MemberRef;
  chapter?: ChapterRef;
}

export default function OneToOneListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [scheduledMeetings, setScheduledMeetings] = useState<OneToOne[]>([]);
  const [receivedMeetings, setReceivedMeetings] = useState<OneToOne[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"scheduled" | "received">(
    "scheduled"
  );

  const pageSize = 10;

  const loadOneToOnes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get member ID from local storage
      const userData = await AsyncStorage.getItem("user_data");
      if (!userData) {
        throw new Error("User data not found in local storage");
      }
      const parsedUserData = JSON.parse(userData);
      const memberId = parsedUserData?.memberId;
      if (!memberId) {
        throw new Error("Member ID not found in user data");
      }

      // Load scheduled meetings (ones I requested)
      const scheduledResponse = await get(
        `/api/one-to-ones/requested?memberId=${memberId}&page=1&limit=50`
      );
      const scheduledData = scheduledResponse?.data?.oneToOnes || [];

      // Load received meetings (ones requested of me)
      const receivedResponse = await get(
        `/api/one-to-ones/received?memberId=${memberId}&page=1&limit=50`
      );
      const receivedData = receivedResponse?.data?.oneToOnes || [];

      setScheduledMeetings(scheduledData);
      setReceivedMeetings(receivedData);
      setCurrentUserId(memberId);
    } catch (err) {
      console.error("Error loading one-to-one meetings:", err);
      setError("Failed to load one-to-one meetings");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load one-to-one meetings",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOneToOnes();
  }, [loadOneToOnes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOneToOnes();
  }, [loadOneToOnes]);

  const handleAcceptReject = async (
    id: number,
    action: "accepted" | "cancelled"
  ) => {
    try {
      await patch(`/api/one-to-ones/${id}/status`, {
        status: action,
      });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Meeting ${action} successfully`,
      });
      // Reload data
      loadOneToOnes();
    } catch (error) {
      console.error("Error updating meeting status:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update meeting status",
      });
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Meeting",
      "Are you sure you want to delete this meeting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await del(`/api/one-to-ones/${id}`);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Meeting deleted successfully",
              });
              // Reload data
              loadOneToOnes();
            } catch (error) {
              console.error("Error deleting meeting:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete meeting",
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusMap = useMemo(
    () => ({
      accepted: { bg: "#E8F5E9", text: "#2E7D32", icon: "✓" },
      pending: { bg: "#FFF3E0", text: "#EF6C00", icon: "⏳" },
      rejected: { bg: "#FDECEA", text: "#C62828", icon: "✕" },
      cancelled: { bg: "#FDECEA", text: "#C62828", icon: "✕" },
      default: { bg: colors.card, text: colors.text, icon: "•" },
    }),
    [colors.card, colors.text]
  );

  const getStatusStyle = (status: string) => {
    const key = (status || "").toLowerCase() as keyof typeof statusMap;
    return statusMap[key] ?? statusMap.default;
  };

  const SkeletonCard = () => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.skelRow}>
        <View
          style={[
            styles.skelBox,
            { width: 140, backgroundColor: colors.border },
          ]}
        />
        <View style={[styles.skelPill, { backgroundColor: colors.border }]} />
      </View>
      <View
        style={[
          styles.skelBox,
          {
            height: 12,
            marginTop: 12,
            width: "60%",
            backgroundColor: colors.border,
          },
        ]}
      />
      <View
        style={[
          styles.skelBox,
          {
            height: 10,
            marginTop: 8,
            width: "40%",
            backgroundColor: colors.border,
          },
        ]}
      />
      <View
        style={[
          styles.skelBox,
          {
            height: 12,
            marginTop: 12,
            width: "70%",
            backgroundColor: colors.border,
          },
        ]}
      />
      <View
        style={[
          styles.skelBox,
          {
            height: 10,
            marginTop: 8,
            width: "50%",
            backgroundColor: colors.border,
          },
        ]}
      />
      <View
        style={[
          styles.skelBox,
          {
            height: 12,
            marginTop: 12,
            width: "50%",
            backgroundColor: colors.border,
          },
        ]}
      />
      <View style={[styles.skelActions]}>
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
        <View
          style={[styles.skelActionBtn, { backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No One-to-One Meetings
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        You don’t have any one-to-one meetings yet. Schedule one to get started.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/modules/one-to-ones/create")}
      >
        <Text style={styles.createButtonText}>Schedule Meeting</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
        We couldn’t load your meetings. Please try again.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => loadOneToOnes()}
      >
        <Text style={styles.createButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  function renderItem({ item }: { item: OneToOne }) {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Meeting #{item.id}
          </Text>
          <View
            style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
              {statusStyle.icon} {item.status?.toUpperCase() || "UNKNOWN"}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          {activeTab === "scheduled" ? (
            /* For meetings I scheduled, show "To Whom" */
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.placeholder }]}>
                To Whom
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {item.requested?.memberName || "Unknown"}
              </Text>
              <Text style={[styles.subtle, { color: colors.placeholder }]}>
                {item.requested?.organizationName || "No Organization"}
              </Text>
            </View>
          ) : (
            /* For meetings with me, show "From Whom" */
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.placeholder }]}>
                From Whom
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {item.requester?.memberName || "Unknown"}
              </Text>
              <Text style={[styles.subtle, { color: colors.placeholder }]}>
                {item.requester?.organizationName || "No Organization"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
              Chapter
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {item.chapter?.name || "No Chapter"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.placeholder }]}>
              Date
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>

        {!!item.remarks && (
          <View style={styles.remarksBox}>
            <Text style={[styles.remarksLabel, { color: colors.placeholder }]}>
              Remarks
            </Text>
            <Text
              style={[styles.remarksText, { color: colors.text }]}
              numberOfLines={3}
            >
              {item.remarks}
            </Text>
          </View>
        )}

        {/* Show Accept/Reject buttons only for received meetings with pending status */}
        {activeTab === "received" && item.status === "pending" && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#4CAF50" }]}
              onPress={() => handleAcceptReject(item.id, "accepted")}
            >
              <Text style={styles.primaryBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostDangerBtn, { borderColor: "#F44336" }]}
              onPress={() => handleAcceptReject(item.id, "cancelled")}
            >
              <Text style={styles.ghostDangerText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const currentData =
    activeTab === "scheduled" ? scheduledMeetings : receivedMeetings;

  const handleTabSwitch = (tab: "scheduled" | "received") => {
    setActiveTab(tab);
    // Data is already loaded for both tabs, no need to refresh
  };

  const TabButton = ({
    tab,
    title,
  }: {
    tab: "scheduled" | "received";
    title: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        { backgroundColor: activeTab === tab ? colors.primary : "transparent" },
      ]}
      onPress={() => handleTabSwitch(tab)}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === tab ? "white" : colors.text },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const content = () => {
    if (loading) {
      return (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (error) {
      return <ErrorState />;
    }

    return (
      <>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TabButton
            tab="scheduled"
            title={`Meetings I Scheduled (${scheduledMeetings.length})`}
          />
          <TabButton
            tab="received"
            title={`Meetings with Me (${receivedMeetings.length})`}
          />
        </View>

        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContainer,
            currentData.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "surface");

  const rightComponent = (
    <TouchableOpacity
      onPress={() => router.push("/modules/onetoone/create")}
      style={[styles.addButton, { backgroundColor: colors.primary }]}
    >
      <ThemedText style={styles.addButtonText}>Add</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader
        title="One-to-One Meetings"
        rightComponent={rightComponent}
      />

      <View style={[styles.contentContainer, { backgroundColor }]}>
        {content()}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  primaryCTA: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryCTAText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  list: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  row: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtle: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
  },

  remarksBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  remarksText: {
    fontSize: 14,
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  ghostDangerBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 0,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  ghostDangerText: {
    color: "#F44336",
    fontWeight: "700",
    fontSize: 14,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
    opacity: 0.7,
    lineHeight: 22,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  pagination: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ECECEC",
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontWeight: "700",
  },
  pageIndicator: {
    fontWeight: "700",
  },

  // Skeleton styles
  skelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skelBox: {
    height: 16,
    borderRadius: 6,
  },
  skelPill: {
    height: 22,
    width: 100,
    borderRadius: 999,
  },
  skelActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  skelActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },

  // Tab styles
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
