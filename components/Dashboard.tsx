import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  ChapterMeeting,
  Message,
  Training,
  UpcomingBirthday,
} from "@/types/dashboard";
import { dashboardService } from "@/services/dashboardService";
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
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.");
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
const StatCard = ({ title, value, icon, color, colors }: any) => (
  <View
    style={[
      styles.statCard,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}
  >
    <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
      <IconSymbol name={icon} size={20} color={color} />
    </View>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text
        style={[styles.statLabel, { color: colors.placeholder }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  signOutButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 20,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    color: "white",
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
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    width: width * 0.42,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
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
    width: width * 0.42,
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  scrollableContent: {
    flex: 1,
  },
  messageItem: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  messageDate: {
    fontSize: 10,
  },
  messagePowerteam: {
    fontSize: 12,
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 12,
    lineHeight: 16,
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
