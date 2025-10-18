import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { dashboardService } from "@/services/dashboardService";
import {
  ChapterMeeting,
  Message,
  Training,
  UpcomingBirthday,
} from "@/types/dashboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // State variables matching the original React code
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessTotal, setBusinessTotal] = useState(0);
  const [referencesCount, setReferencesCount] = useState(0);
  const [totalVisitorsCount, setTotalVisitorsCount] = useState(0);
  const [oneToOneCount, setOneToOneCount] = useState(0);
  const [memberGivenReferencesCount, setMemberGivenReferencesCount] =
    useState(0);
  const [memberReceivedReferencesCount, setMemberReceivedReferencesCount] =
    useState(0);
  const [memberBusinessGiven, setMemberBusinessGiven] = useState(0);
  const [memberBusinessReceived, setMemberBusinessReceived] = useState(0);
  const [chapterBusinessGenerated, setChapterBusinessGenerated] = useState(0);
  const [chapterReferencesCount, setChapterReferencesCount] = useState(0);
  const [chapterVisitorsCount, setChapterVisitorsCount] = useState(0);
  const [chapterOneToOneCount, setChapterOneToOneCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<ChapterMeeting[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    UpcomingBirthday[]
  >([]);

  // Load all dashboard data
const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log("Dashboard: Current user data:", user);
      console.log("Dashboard: Member ID:", user?.member?.id);
      console.log("Dashboard: Chapter ID:", user?.member?.chapterId);

      // Use the dashboard service to fetch data
      const data = await dashboardService.getDashboardData(user);
      console.log("Dashboard: Received data:", data);
      console.log("Dashboard: Business Total:", data.businessTotal);
      console.log("Dashboard: References Count:", data.referencesCount);
      console.log("Dashboard: Messages:", data.messages);
      console.log("Dashboard: Meetings:", data.meetings);
      
      setBusinessTotal(data.businessTotal);
      setReferencesCount(data.referencesCount);
      setTotalVisitorsCount(data.totalVisitorsCount);
      setOneToOneCount(data.oneToOneCount);
      setMemberGivenReferencesCount(data.memberGivenReferencesCount);
      setMemberReceivedReferencesCount(data.memberReceivedReferencesCount);
      setMemberBusinessGiven(data.memberBusinessGiven);
      setMemberBusinessReceived(data.memberBusinessReceived);
      setChapterBusinessGenerated(data.chapterBusinessGenerated);
      setChapterReferencesCount(data.chapterReferencesCount);
      setChapterVisitorsCount(data.chapterVisitorsCount);
      setChapterOneToOneCount(data.chapterOneToOneCount);
      setMessages(data.messages);
      setMeetings(data.meetings);
      setTrainings(data.trainings);
      setUpcomingBirthdays(data.upcomingBirthdays);
      
      console.log("Dashboard: State updated successfully");
      console.log("Dashboard: Final state - Business Total:", data.businessTotal);
      console.log("Dashboard: Final state - Messages count:", data.messages.length);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      
      // Handle authentication errors
      if (error?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: () => signOut(),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = () => {
    loadDashboardData(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "give-reference":
        router.push("/references");
        break;
      case "done-deal":
        router.push("/done-deals");
        break;
      case "one-to-one":
        router.push("/modules/onetoone");
        break;
      case "visitors":
        router.push("/modules/visitors" as any);
        break;
      case "meetings":
        router.push("/modules/meetings" as any);
        break;
      case "performance":
        router.push("/(tabs)/performance");
        break;
      default:
        console.log(`${action} pressed`);
    }
  };

  const handleAttachmentPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open attachment");
    });
  };

  const quickActions = [
    {
      id: "give-reference",
      title: "Give Reference",
      subtitle: "Provide a reference",
      icon: "person.badge.plus",
      color: colors.primary,
      onPress: () => handleQuickAction("give-reference"),
    },
    {
      id: "done-deal",
      title: "Mark Done Deal",
      subtitle: "Mark as completed",
      icon: "checkmark.circle",
      color: colors.success,
      onPress: () => handleQuickAction("done-deal"),
    },
    {
      id: "one-to-one",
      title: "One To One Request",
      subtitle: "Schedule meeting",
      icon: "person.2",
      color: colors.warning,
      onPress: () => handleQuickAction("one-to-one"),
    },
    {
      id: "visitors",
      title: "Visitors",
      subtitle: "View visitors list",
      icon: "person.3",
      color: colors.info,
      onPress: () => handleQuickAction("visitors"),
    },
    {
      id: "meetings",
      title: "Chapter Meetings",
      subtitle: "Manage meetings",
      icon: "calendar",
      color: "#FF9500",
      onPress: () => handleQuickAction("meetings"),
    },
    {
      id: "performance",
      title: "Performance Dashboard",
      subtitle: "View analytics",
      icon: "chart.bar.fill",
      color: "#AF52DE",
      onPress: () => handleQuickAction("performance"),
    },
  ];

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || "User"}!</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Actions Section - Only show for non-admin users */}
        {user?.role !== "admin" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.grid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: action.color + "20" },
                    ]}
                  >
                    <IconSymbol
                      name={action.icon as any}
                      size={24}
                      color={action.color}
                    />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {action.title}
                  </Text>
                  <Text
                    style={[styles.cardSubtitle, { color: colors.placeholder }]}
                  >
                    {action.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* BBNG Statistics Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionBadge, styles.bbngBadge]}>BBNG</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Reference Shared"
            value={referencesCount}
            icon="person.2"
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            title="BBNG Business Generated"
            value={`₹${businessTotal.toLocaleString()}`}
            icon="dollarsign.circle"
            color={colors.success}
            colors={colors}
          />
          <StatCard
            title="One to One"
            value={oneToOneCount}
            icon="person.2.fill"
            color={colors.warning}
            colors={colors}
          />
          <StatCard
            title="Total Visitors"
            value={totalVisitorsCount}
            icon="person.3"
            color={colors.info}
            colors={colors}
            onPress={() => router.push('/modules/visitors' as any)}
          />
        </View>

        {/* CHAPTER Statistics Section - Only show for non-admin users */}
        {user?.role !== "admin" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionBadge, styles.chapterBadge]}>
                CHAPTER
              </Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title={`${user?.member?.chapter?.name || ""} References Shared`}
                value={chapterReferencesCount}
                icon="person.2"
                color={colors.primary}
                colors={colors}
              />
              <StatCard
                title={`${
                  user?.member?.chapter?.name || ""
                } Business Generated`}
                value={`₹${chapterBusinessGenerated.toLocaleString()}`}
                icon="dollarsign.circle"
                color={colors.success}
                colors={colors}
              />
              <StatCard
                title={`${user?.member?.chapter?.name || ""} One 2 One`}
                value={chapterOneToOneCount}
                icon="person.2.fill"
                color={colors.warning}
                colors={colors}
              />
              <StatCard
                title={`${user?.member?.chapter?.name || ""} Visitors`}
                value={chapterVisitorsCount}
                icon="person.3"
                color={colors.info}
                colors={colors}
                onPress={() => router.push('/modules/visitors' as any)}
              />
            </View>

            {/* SELF Statistics Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionBadge, styles.selfBadge]}>SELF</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Business Received"
                value={`₹${memberBusinessReceived.toLocaleString()}`}
                icon="arrow.down.circle"
                color={colors.success}
                colors={colors}
              />
              <StatCard
                title="Business Given"
                value={`₹${memberBusinessGiven.toLocaleString()}`}
                icon="arrow.up.circle"
                color={colors.warning}
                colors={colors}
              />
              <StatCard
                title="References Received"
                value={memberReceivedReferencesCount}
                icon="arrow.down"
                color={colors.info}
                colors={colors}
              />
              <StatCard
                title="Reference Given"
                value={memberGivenReferencesCount}
                icon="arrow.up"
                color={colors.primary}
                colors={colors}
              />
            </View>
          </>
        )}

        {/* Messages and Meetings Section */}
        <View style={styles.twoColumnSection}>
          <View
            style={[
              styles.messageCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeader, { color: colors.text }]}>
              Messages
            </Text>
            <ScrollView
              style={styles.scrollableContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length > 0 ? (
                messages.map((message) => (
                  <View
                    key={message.id}
                    style={[styles.messageItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.messageHeader}>
                      <Text
                        style={[styles.messageTitle, { color: colors.text }]}
                      >
                        {message.heading}
                      </Text>
                      <Text
                        style={[
                          styles.messageDate,
                          { color: colors.placeholder },
                        ]}
                      >
                        {new Date(message.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messagePowerteam,
                        { color: colors.placeholder },
                      ]}
                    >
                      {message.powerteam}
                    </Text>
                    <Text
                      style={[styles.messageContent, { color: colors.text }]}
                    >
                      {message.message}
                    </Text>
                    {message.attachment && (
                      <TouchableOpacity
                        onPress={() =>
                          handleAttachmentPress(message.attachment!)
                        }
                      >
                        <Text
                          style={[
                            styles.attachmentLink,
                            { color: colors.primary },
                          ]}
                        >
                          View Attachment
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  No messages to display
                </Text>
              )}
            </ScrollView>
          </View>

          <View
            style={[
              styles.messageCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeader, { color: colors.text }]}>
              My Meetings
            </Text>
            <ScrollView
              style={styles.scrollableContent}
              showsVerticalScrollIndicator={false}
            >
              {meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <View
                    key={meeting.id}
                    style={[styles.messageItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.messageHeader}>
                      <Text
                        style={[styles.messageTitle, { color: colors.text }]}
                      >
                        {meeting.meetingTitle}
                      </Text>
                      <Text
                        style={[
                          styles.messageDate,
                          { color: colors.placeholder },
                        ]}
                      >
                        {new Date(meeting.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messagePowerteam,
                        { color: colors.placeholder },
                      ]}
                    >
                      {meeting.meetingVenue}
                    </Text>
                    <Text
                      style={[styles.messageContent, { color: colors.text }]}
                    >
                      {meeting.meetingTime}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  No meetings to display
                </Text>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Training and Birthdays Section */}
        <View style={styles.twoColumnSection}>
          <View
            style={[
              styles.messageCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeader, { color: colors.text }]}>
              Training
            </Text>
            <ScrollView
              style={styles.scrollableContent}
              showsVerticalScrollIndicator={false}
            >
              {trainings.length > 0 ? (
                trainings.map((training) => (
                  <View
                    key={training.id}
                    style={[styles.messageItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.messageHeader}>
                      <Text
                        style={[styles.messageTitle, { color: colors.text }]}
                      >
                        {training.title}
                      </Text>
                      <Text
                        style={[
                          styles.messageDate,
                          { color: colors.placeholder },
                        ]}
                      >
                        {new Date(training.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messagePowerteam,
                        { color: colors.placeholder },
                      ]}
                    >
                      {training.venue}
                    </Text>
                    <Text
                      style={[styles.messageContent, { color: colors.text }]}
                    >
                      {training.time}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  No upcoming trainings
                </Text>
              )}
            </ScrollView>
          </View>

          <View
            style={[
              styles.messageCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeader, { color: colors.text }]}>
              Upcoming Birthdays
            </Text>
            <ScrollView
              style={styles.scrollableContent}
              showsVerticalScrollIndicator={false}
            >
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.map((birthday) => (
                  <View
                    key={birthday.id}
                    style={[styles.messageItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.messageHeader}>
                      <Text
                        style={[styles.messageTitle, { color: colors.text }]}
                      >
                        {birthday.memberName}
                      </Text>
                      <Text
                        style={[
                          styles.messageDate,
                          { color: colors.placeholder },
                        ]}
                      >
                        {birthday.daysUntilBirthday === 0
                          ? "Today!"
                          : birthday.daysUntilBirthday === 1
                          ? "Tomorrow"
                          : `In ${birthday.daysUntilBirthday} days`}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messagePowerteam,
                        { color: colors.placeholder },
                      ]}
                    >
                      {birthday.organizationName}
                    </Text>
                    <Text
                      style={[styles.messageContent, { color: colors.text }]}
                    >
                      {birthday.chapter?.name || "No Chapter"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  No upcoming birthdays
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// StatCard Component
const StatCard = ({ title, value, icon, color, colors, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.statCard,
      { backgroundColor: colors.card, borderColor: colors.border },
      pressed && styles.statCardPressed,
    ]}
    android_ripple={{ color: color + "22" }}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${value}`}
    onPress={onPress}
    disabled={!onPress}
  >
    <LinearGradient
      colors={[color + "33", color + "14"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statIconContainer}
    >
      <IconSymbol name={icon} size={24} color={color} />
    </LinearGradient>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text
        style={[styles.statLabel, { color: colors.placeholder }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 6,
    fontWeight: "500",
  },
  userName: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "400",
  },
  signOutButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 28,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: "flex-start",
    color: "white",
    letterSpacing: 1,
  },
  bbngBadge: {
    backgroundColor: "#007AFF",
  },
  chapterBadge: {
    backgroundColor: "#34C759",
  },
  selfBadge: {
    backgroundColor: "#FF9500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    marginHorizontal: -6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 0,
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: '48%', // 2 columns
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    minHeight: 128,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  twoColumnSection: {
    flexDirection: "column",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  messageCard: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 0,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  scrollableContent: {
    flex: 1,
  },
  messageItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  messageDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  messagePowerteam: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  messageContent: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  attachmentLink: {
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});
