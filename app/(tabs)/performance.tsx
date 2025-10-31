import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  performanceDashboardService,
  type ChapterInfo,
  type PerformanceData,
} from "@/services/performanceDashboardService";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PerformanceDashboard() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { roleInfo, loading: roleLoading, refreshRoleInfo } = usePerformance();
  const insets = useSafeAreaInsets();

  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [selectedZoneChapters, setSelectedZoneChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapterInZone, setSelectedChapterInZone] = useState<number | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "business" | "references" | "meetings">("name");

  // Get current chapter ID
  const currentScope = roleInfo?.accessScope[currentChapterIndex];
  const isZoneSelected = currentScope?.accessType === "zone" && selectedChapterInZone === null;
  const currentChapterId = isZoneSelected
    ? null
    : selectedChapterInZone || roleInfo?.accessScope[currentChapterIndex]?.chapterId;

  // Load initial data when roleInfo becomes available
  useEffect(() => {
    if (roleInfo) {
      loadData();
    }
  }, [roleInfo]);

  // Load performance data when chapter selection changes
  useEffect(() => {
    if (roleInfo && currentChapterId) {
      loadPerformanceData();
    }
  }, [currentChapterId, roleInfo]);

  const loadData = async () => {
    if (!roleInfo) {
      // Refresh role info if not available
      await refreshRoleInfo();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // If first scope is zone, load chapters
      if (roleInfo.accessScope[0]?.accessType === "zone") {
        await handleZoneSelection(roleInfo.accessScope[0].zoneName!, 0);
      } else if (roleInfo.accessScope[0]?.chapterId) {
        // Load initial performance data for first chapter
        await loadPerformanceDataForChapter(roleInfo.accessScope[0].chapterId);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      
      // Handle authentication errors
      if (error?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [{ text: "OK", onPress: () => signOut() }]
        );
        return;
      }
      
      const errorMessage = error?.status === 404 
        ? "Performance Dashboard API is not yet available. Please contact your administrator."
        : "Failed to load performance data. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceDataForChapter = async (chapterId: number) => {
    try {
      const data = await performanceDashboardService.getPerformanceData({
        chapterId,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });
      setPerformanceData(data);
    } catch (error: any) {
      console.error("Error loading performance data:", error);
      
      // Handle authentication errors
      if (error?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [{ text: "OK", onPress: () => signOut() }]
        );
        return;
      }
      
      Alert.alert("Error", "Failed to load performance data");
    }
  };

  const loadPerformanceData = async () => {
    if (!currentChapterId) return;
    await loadPerformanceDataForChapter(currentChapterId);
  };

  const handleZoneSelection = async (zoneName: string, index: number) => {
    try {
      const chapters = await performanceDashboardService.getChaptersInZone(zoneName);
      setSelectedZoneChapters(chapters);
      setSelectedChapterInZone(null);
      setCurrentChapterIndex(index);
    } catch (error) {
      console.error("Error loading zone chapters:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRoleInfo();
    if (currentChapterId) {
      await loadPerformanceData();
    }
    setRefreshing(false);
  };

  const currentChapter = performanceData?.chapters?.[0];
  const showPerformanceData = !isZoneSelected && currentChapter;

  // Filter and sort members
  const filteredAndSortedMembers = React.useMemo(() => {
    if (!currentChapter?.members) return [];

    let members = [...currentChapter.members];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      members = members.filter(
        (member) =>
          member.memberName.toLowerCase().includes(query) ||
          member.organizationName.toLowerCase().includes(query) ||
          member.category.toLowerCase().includes(query)
      );
    }

    // Sort members
    members.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.memberName.localeCompare(b.memberName);
        case "business":
          return (
            b.businessGenerated.amount + b.businessReceived.amount -
            (a.businessGenerated.amount + a.businessReceived.amount)
          );
        case "references":
          return (
            b.referencesGiven + b.referencesReceived -
            (a.referencesGiven + a.referencesReceived)
          );
        case "meetings":
          return b.oneToOneMeetings - a.oneToOneMeetings;
        default:
          return 0;
      }
    });

    return members;
  }, [currentChapter?.members, searchQuery, sortBy]);

  if (loading || roleLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading performance data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Performance Dashboard</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.warning} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Service Unavailable
          </Text>
          <Text style={[styles.errorMessage, { color: colors.placeholder }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadData}
          >
            <IconSymbol name="arrow.clockwise" size={20} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!roleInfo) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Unable to load role information
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Performance</Text>
            <Text style={styles.headerSubtitle}>
              {roleInfo?.memberName} • {roleInfo?.inferredRole?.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
            accessibilityLabel="Open date filter"
            accessibilityRole="button"
          >
            <IconSymbol name="slider.horizontal.3" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "ios" ? 100 : 80 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Chapter/Zone Selection */}
        {roleInfo.accessScope.length > 1 && (
          <View style={styles.selectionSection}>
            <Text style={[styles.selectionLabel, { color: colors.placeholder }]}>
              {roleInfo.accessScope.some((scope) => scope.accessType === "zone")
                ? "SELECT ZONE OR CHAPTER"
                : "SELECT CHAPTER"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {roleInfo.accessScope.map((scope, index) => (
                <TouchableOpacity
                  key={scope.chapterId}
                  onPress={() => {
                    if (scope.accessType === "zone") {
                      handleZoneSelection(scope.zoneName!, index);
                    } else {
                      setSelectedZoneChapters([]);
                      setSelectedChapterInZone(null);
                      setCurrentChapterIndex(index);
                    }
                  }}
                  style={[
                    styles.selectionChip,
                    { borderColor: colors.border },
                    currentChapterIndex === index && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      { color: colors.text },
                      currentChapterIndex === index && { color: "white", fontWeight: "700" },
                    ]}
                    numberOfLines={1}
                  >
                    {scope.accessType === "zone" ? scope.zoneName : scope.chapterName}
                  </Text>
                  {scope.accessType === "zone" && (
                    <View style={[styles.chipBadge, { backgroundColor: currentChapterIndex === index ? "rgba(255,255,255,0.25)" : colors.primary + "15" }]}>
                      <Text style={[styles.chipBadgeText, { color: currentChapterIndex === index ? "white" : colors.primary }]}>
                        ZONE
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Zone Chapter Selection */}
        {currentScope?.accessType === "zone" && selectedZoneChapters.length > 0 && (
          <View style={styles.selectionSection}>
            <Text style={[styles.selectionLabel, { color: colors.success }]}>
              CHAPTERS IN {currentScope.zoneName?.toUpperCase()}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {selectedZoneChapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.chapterId}
                  onPress={() => setSelectedChapterInZone(chapter.chapterId)}
                  style={[
                    styles.selectionChip,
                    { borderColor: colors.success + "40" },
                    selectedChapterInZone === chapter.chapterId && {
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      { color: colors.text },
                      selectedChapterInZone === chapter.chapterId && { color: "white", fontWeight: "700" },
                    ]}
                    numberOfLines={1}
                  >
                    {chapter.chapterName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Zone Selection Message */}
        {isZoneSelected && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.info + "20" }]}>
              <IconSymbol name="info.circle" size={40} color={colors.info} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedZoneChapters.length === 0 ? "Loading..." : "Select a Chapter"}
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.placeholder }]}>
              {selectedZoneChapters.length === 0
                ? "Loading chapters in " + currentScope?.zoneName
                : "Choose a chapter from above to view performance data"}
            </Text>
          </View>
        )}

        {/* Current Chapter Header */}
        {showPerformanceData && (
          <View style={styles.chapterHeaderSection}>
            <Text style={[styles.chapterTitle, { color: colors.text }]}>
              {currentChapter.chapterName}
            </Text>
            {currentScope?.zoneName && (
              <Text style={[styles.chapterSubtitle, { color: colors.placeholder }]}>
                {currentScope.zoneName}
              </Text>
            )}
          </View>
        )}

        {/* Summary Statistics */}
        {showPerformanceData && (
          <View style={styles.statsGrid}>
            <StatCard
              title="Business Given"
              value={`₹${currentChapter.summary.totalBusinessGenerated.toLocaleString()}`}
              icon="arrow.up.circle.fill"
              color="#34C759"
              colors={colors}
            />
            <StatCard
              title="Business Received"
              value={`₹${currentChapter.summary.totalBusinessReceived.toLocaleString()}`}
              icon="arrow.down.circle.fill"
              color="#007AFF"
              colors={colors}
            />
            <StatCard
              title="One-to-Ones"
              value={currentChapter.summary.totalOneToOnes.toString()}
              icon="person.2.fill"
              color="#AF52DE"
              colors={colors}
            />
            <StatCard
              title="References"
              value={(
                currentChapter.summary.totalReferencesGiven +
                currentChapter.summary.totalReferencesReceived
              ).toString()}
              icon="hand.raised.fill"
              color="#FF9500"
              colors={colors}
            />
            <StatCard
              title="Visitors"
              value={currentChapter.summary.totalVisitorsInvited.toString()}
              icon="person.3.fill"
              color="#5AC8FA"
              colors={colors}
            />
          </View>
        )}

        {/* Member Performance */}
        {showPerformanceData && (
          <View style={styles.membersSection}>
            <View style={styles.membersSectionHeader}>
              <Text style={[styles.membersSectionTitle, { color: colors.text }]}>
                Team Performance
              </Text>
              <View style={[styles.membersCount, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.membersCountText, { color: colors.primary }]}>
                  {filteredAndSortedMembers.length}
                </Text>
              </View>
            </View>

            {/* Search and Sort Controls */}
            <View style={styles.controlsContainer}>
              <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconSymbol name="magnifyingglass" size={18} color={colors.placeholder} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search members..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel="Search team members"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityLabel="Clear search">
                    <IconSymbol name="xmark" size={16} color={colors.placeholder} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    { borderColor: colors.border },
                    sortBy === "name" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSortBy("name")}
                  accessibilityLabel="Sort by name"
                >
                  <Text style={[styles.sortChipText, { color: sortBy === "name" ? "white" : colors.text }]}>
                    Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    { borderColor: colors.border },
                    sortBy === "business" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSortBy("business")}
                  accessibilityLabel="Sort by business"
                >
                  <Text style={[styles.sortChipText, { color: sortBy === "business" ? "white" : colors.text }]}>
                    Business
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    { borderColor: colors.border },
                    sortBy === "references" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSortBy("references")}
                  accessibilityLabel="Sort by references"
                >
                  <Text style={[styles.sortChipText, { color: sortBy === "references" ? "white" : colors.text }]}>
                    References
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    { borderColor: colors.border },
                    sortBy === "meetings" && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSortBy("meetings")}
                  accessibilityLabel="Sort by meetings"
                >
                  <Text style={[styles.sortChipText, { color: sortBy === "meetings" ? "white" : colors.text }]}>
                    Meetings
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {filteredAndSortedMembers.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.placeholder + "20" }]}>
                  <IconSymbol name="magnifyingglass" size={40} color={colors.placeholder} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Members Found</Text>
                <Text style={[styles.emptyMessage, { color: colors.placeholder }]}>
                  {searchQuery ? `No results for "${searchQuery}"` : "No team members available"}
                </Text>
              </View>
            ) : (
              filteredAndSortedMembers.map((member, index) => (
                <TouchableOpacity
                  key={member.memberId}
                  style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  accessibilityLabel={`View details for ${member.memberName}`}
                  accessibilityRole="button"
                  accessibilityHint="Tap to view full performance details"
                >
                {/* Member Header */}
                <View style={styles.memberCardHeader}>
                  <View style={styles.memberMainInfo}>
                    <View style={styles.memberNameRow}>
                      <View style={[styles.memberRank, { backgroundColor: colors.primary }]}>
                        <Text style={styles.memberRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberNameText, { color: colors.text }]} numberOfLines={1}>
                          {member.memberName}
                        </Text>
                        <Text style={[styles.memberOrgText, { color: colors.placeholder }]} numberOfLines={1}>
                          {member.organizationName}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.categoryTag, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                      <Text style={[styles.categoryTagText, { color: colors.primary }]} numberOfLines={1}>
                        {member.category}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Business Stats */}
                <View style={styles.memberMetricsSection}>
                  <View style={styles.metricRow}>
                    <View style={[styles.metricCard, { backgroundColor: "#34C759" + "08" }]}>
                      <Text style={[styles.metricValue, { color: "#34C759" }]}>
                        ₹{member.businessGenerated.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                        Given • {member.businessGenerated.count}
                      </Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: "#007AFF" + "08" }]}>
                      <Text style={[styles.metricValue, { color: "#007AFF" }]}>
                        ₹{member.businessReceived.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                        Received • {member.businessReceived.count}
                      </Text>
                    </View>
                  </View>

                  {/* Activity Stats */}
                  <View style={styles.activityRow}>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: "#AF52DE" }]} />
                      <Text style={[styles.activityValue, { color: colors.text }]}>
                        {member.oneToOneMeetings}
                      </Text>
                      <Text style={[styles.activityLabel, { color: colors.placeholder }]}>
                        Meetings
                      </Text>
                    </View>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: "#FF9500" }]} />
                      <Text style={[styles.activityValue, { color: colors.text }]}>
                        {member.referencesGiven}
                      </Text>
                      <Text style={[styles.activityLabel, { color: colors.placeholder }]}>
                        Given
                      </Text>
                    </View>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: "#FF3B30" }]} />
                      <Text style={[styles.activityValue, { color: colors.text }]}>
                        {member.referencesReceived}
                      </Text>
                      <Text style={[styles.activityLabel, { color: colors.placeholder }]}>
                        Received
                      </Text>
                    </View>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: "#5AC8FA" }]} />
                      <Text style={[styles.activityValue, { color: colors.text }]}>
                        {member.visitorsInvited}
                      </Text>
                      <Text style={[styles.activityLabel, { color: colors.placeholder }]}>
                        Visitors
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Stat Card Component - 2-column grid design with press feedback
const StatCard = ({ title, value, icon, color, colors }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.statGridCard,
      { backgroundColor: colors.card, borderColor: colors.border },
      pressed && styles.statGridCardPressed,
    ]}
    android_ripple={{ color: color + "22" }}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${value}`}
  >
    <LinearGradient
      colors={[color + "33", color + "14"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGridIcon}
    >
      <IconSymbol name={icon} size={20} color={color} />
    </LinearGradient>
    <Text style={[styles.statGridValue, { color: colors.text }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={[styles.statGridLabel, { color: colors.placeholder }]} numberOfLines={2}>
      {title}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  // Base
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Loading & Error States
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 140,
    justifyContent: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "white",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  // Selection Section
  selectionSection: {
    marginVertical: 16,
  },
  selectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chipsRow: {
    paddingVertical: 4,
  },
  selectionChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
  },
  selectionChipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  chipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  
  // Empty State
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    marginVertical: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Chapter Header
  chapterHeaderSection: {
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  chapterSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Stats Grid (2-column)
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 8,
    
      },
  statGridCard: {
    width: "48%", // 2 columns with even spacing
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 124,
    marginBottom: 15,
    justifyContent: "center",
  },
  statGridIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statGridValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  statGridLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statGridCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  
  // Members Section
  membersSection: {
    marginVertical: 12,
  },
  membersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  membersSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  membersCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  membersCountText: {
    fontSize: 15,
    fontWeight: "800",
  },
  
  // Search & Sort Controls
  controlsContainer: {
    marginBottom: 16,
    paddingVertical: 6,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  sortContainer: {
    flexDirection: "row",
    paddingVertical: 6,
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Member Card
  memberCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  memberCardHeader: {
    marginBottom: 16,
  },
  memberMainInfo: {
    gap: 12,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  memberRankText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  memberDetails: {
    flex: 1,
  },
  memberNameText: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  memberOrgText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Member Metrics
  memberMetricsSection: {
    gap: 12,
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    minHeight: 70,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Activity Row
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activityItem: {
    alignItems: "center",
    gap: 6,
    minWidth: 60,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
