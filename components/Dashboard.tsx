"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/contexts/UserRoleContext"
import { useColorScheme } from "@/hooks/useColorScheme"
import { dashboardService } from "@/services/dashboardService"
import type { ChapterMeeting, Message, Training, UpcomingBirthday } from "@/types/dashboard"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { hasChapterAccess } = useUserRole()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const insets = useSafeAreaInsets()

  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))

  // State variables matching the original React code
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [businessTotal, setBusinessTotal] = useState(0)
  const [referencesCount, setReferencesCount] = useState(0)
  const [totalVisitorsCount, setTotalVisitorsCount] = useState(0)
  const [oneToOneCount, setOneToOneCount] = useState(0)
  const [memberGivenReferencesCount, setMemberGivenReferencesCount] = useState(0)
  const [memberReceivedReferencesCount, setMemberReceivedReferencesCount] = useState(0)
  const [memberBusinessGiven, setMemberBusinessGiven] = useState(0)
  const [memberBusinessReceived, setMemberBusinessReceived] = useState(0)
  const [chapterBusinessGenerated, setChapterBusinessGenerated] = useState(0)
  const [chapterReferencesCount, setChapterReferencesCount] = useState(0)
  const [chapterVisitorsCount, setChapterVisitorsCount] = useState(0)
  const [chapterOneToOneCount, setChapterOneToOneCount] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [meetings, setMeetings] = useState<ChapterMeeting[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([])

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading])

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log("Dashboard: Current user data:", user)
      console.log("Dashboard: Member ID:", user?.member?.id)
      console.log("Dashboard: Chapter ID:", user?.member?.chapterId)

      const data = await dashboardService.getDashboardData(user)
      console.log("Dashboard: Received data:", data)
      console.log("Dashboard: Business Total:", data.businessTotal)
      console.log("Dashboard: References Count:", data.referencesCount)
      console.log("Dashboard: Messages:", data.messages)
      console.log("Dashboard: Meetings:", data.meetings)

      setBusinessTotal(data.businessTotal)
      setReferencesCount(data.referencesCount)
      setTotalVisitorsCount(data.totalVisitorsCount)
      setOneToOneCount(data.oneToOneCount)
      setMemberGivenReferencesCount(data.memberGivenReferencesCount)
      setMemberReceivedReferencesCount(data.memberReceivedReferencesCount)
      setMemberBusinessGiven(data.memberBusinessGiven)
      setMemberBusinessReceived(data.memberBusinessReceived)
      setChapterBusinessGenerated(data.chapterBusinessGenerated)
      setChapterReferencesCount(data.chapterReferencesCount)
      setChapterVisitorsCount(data.chapterVisitorsCount)
      setChapterOneToOneCount(data.chapterOneToOneCount)
      setMessages(data.messages)
      setMeetings(data.meetings)
      setTrainings(data.trainings)
      setUpcomingBirthdays(data.upcomingBirthdays)

      console.log("Dashboard: State updated successfully")
      console.log("Dashboard: Final state - Business Total:", data.businessTotal)
      console.log("Dashboard: Final state - Messages count:", data.messages.length)
    } catch (error: any) {
      console.error("Error loading dashboard data:", error)

      if (error?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.", [
          {
            text: "OK",
            onPress: () => signOut(),
          },
        ])
      } else {
        Alert.alert("Error", "Failed to load dashboard data. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const onRefresh = () => {
    loadDashboardData(true)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "give-reference":
        router.push("/references")
        break
      case "done-deal":
        router.push("/done-deals")
        break
      case "one-to-one":
        router.push("/modules/onetoone")
        break
      case "visitors":
        router.push("/modules/visitors" as any)
        break
      case "meetings":
        router.push("/modules/meetings" as any)
        break
      case "performance":
        router.push("/(tabs)/performance")
        break
      default:
        console.log(`${action} pressed`)
    }
  }

  const handleAttachmentPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open attachment")
    })
  }

  // Define all quick actions
  const allQuickActions = [
    {
      id: "give-reference",
      title: "Give Reference",
      subtitle: "Provide a reference",
      icon: "person.badge.plus",
      color: colors.primary,
      onPress: () => handleQuickAction("give-reference"),
      requiresChapter: false, // Common action for all users
    },
    {
      id: "done-deal",
      title: "Mark Done Deal",
      subtitle: "Mark as completed",
      icon: "checkmark.circle",
      color: colors.success,
      onPress: () => handleQuickAction("done-deal"),
      requiresChapter: false, // Common action for all users
    },
    {
      id: "one-to-one",
      title: "One To One Request",
      subtitle: "Schedule meeting",
      icon: "person.2",
      color: colors.warning,
      onPress: () => handleQuickAction("one-to-one"),
      requiresChapter: false, // Common action for all users
    },
    {
      id: "visitors",
      title: "Visitors",
      subtitle: "View visitors list",
      icon: "person.3",
      color: colors.info,
      onPress: () => handleQuickAction("visitors"),
      requiresChapter: true, // Only for users with chapter
    },
    {
      id: "meetings",
      title: "Chapter Meetings",
      subtitle: "Manage meetings",
      icon: "calendar",
      color: "#FF9500",
      onPress: () => handleQuickAction("meetings"),
      requiresChapter: true, // Only for users with chapter
    },
    {
      id: "performance",
      title: "Performance Dashboard",
      subtitle: "View analytics",
      icon: "chart.bar.fill",
      color: "#AF52DE",
      onPress: () => handleQuickAction("performance"),
      requiresChapter: true, // Only for users with chapter
    },
  ]

  // Filter quick actions based on user's chapter association
  const quickActions = allQuickActions.filter(action => {
    // Show common actions to everyone
    if (!action.requiresChapter) return true
    // Show chapter-specific actions only to users with a chapter
    return hasChapterAccess
  })

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
      </View>
    )
  }

  return (
    <Animated.ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "ios" ? 100 : 80 + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Modern Header Section */}
      <View style={[styles.modernHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.placeholder }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.background }]} 
            onPress={handleSignOut} 
            activeOpacity={0.7}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.dateText, { color: colors.placeholder }]}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Quick Actions Section - Only show for non-admin users */}
        {user?.role !== "admin" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.grid}>
              {quickActions.map((action, index) => (
                <QuickActionCard key={action.id} action={action} colors={colors} index={index} />
              ))}
            </View>
          </>
        )}

        {/* Overall Network Statistics */}
        <View style={styles.modernSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.modernSectionTitle, { color: colors.text }]}>Network Overview</Text>
            <View style={[styles.modernBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.modernBadgeText, { color: colors.primary }]}>BBNG</Text>
            </View>
          </View>
          <View style={styles.modernStatsGrid}>
            <ModernStatCard
              title="References"
              value={referencesCount}
              icon="person.2"
              color={colors.primary}
              colors={colors}
              index={0}
            />
            <ModernStatCard
              title="Business"
              value={`₹${businessTotal.toLocaleString()}`}
              icon="dollarsign.circle"
              color={colors.success}
              colors={colors}
              index={1}
            />
            <ModernStatCard
              title="One-to-One"
              value={oneToOneCount}
              icon="person.2.fill"
              color={colors.warning}
              colors={colors}
              index={2}
            />
            <ModernStatCard
              title="Visitors"
              value={totalVisitorsCount}
              icon="person.3"
              color={colors.info}
              colors={colors}
              index={3}
            />
          </View>
        </View>

        {/* CHAPTER Statistics Section - Only show for non-admin users */}
        {user?.role !== "admin" && (
          <>
            <View style={styles.modernSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.modernSectionTitle, { color: colors.text }]}>
                  {user?.member?.chapter?.name || "Chapter"} Stats
                </Text>
                <View style={[styles.modernBadge, { backgroundColor: "#34C759" + "15" }]}>
                  <Text style={[styles.modernBadgeText, { color: "#34C759" }]}>CHAPTER</Text>
                </View>
              </View>
              <View style={styles.modernStatsGrid}>
                <ModernStatCard
                  title="References"
                  value={chapterReferencesCount}
                  icon="person.2"
                  color={colors.primary}
                  colors={colors}
                  index={0}
                />
                <ModernStatCard
                  title="Business"
                  value={`₹${chapterBusinessGenerated.toLocaleString()}`}
                  icon="dollarsign.circle"
                  color={colors.success}
                  colors={colors}
                  index={1}
                />
                <ModernStatCard
                  title="One-to-One"
                  value={chapterOneToOneCount}
                  icon="person.2.fill"
                  color={colors.warning}
                  colors={colors}
                  index={2}
                />
                <ModernStatCard
                  title="Visitors"
                  value={chapterVisitorsCount}
                  icon="person.3"
                  color={colors.info}
                  colors={colors}
                  index={3}
                  onPress={() => router.push("/modules/visitors" as any)}
                />
              </View>
            </View>

            {/* Personal Statistics Section */}
            <View style={styles.modernSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.modernSectionTitle, { color: colors.text }]}>Your Performance</Text>
                <View style={[styles.modernBadge, { backgroundColor: "#FF9500" + "15" }]}>
                  <Text style={[styles.modernBadgeText, { color: "#FF9500" }]}>PERSONAL</Text>
                </View>
              </View>
              <View style={styles.modernStatsGrid}>
                <ModernStatCard
                  title="Received"
                  value={`₹${memberBusinessReceived.toLocaleString()}`}
                  icon="arrow.down.circle"
                  color={colors.success}
                  colors={colors}
                  index={0}
                />
                <ModernStatCard
                  title="Given"
                  value={`₹${memberBusinessGiven.toLocaleString()}`}
                  icon="arrow.up.circle"
                  color={colors.warning}
                  colors={colors}
                  index={1}
                />
                <ModernStatCard
                  title="Refs In"
                  value={memberReceivedReferencesCount}
                  icon="arrow.down"
                  color={colors.info}
                  colors={colors}
                  index={2}
                />
                <ModernStatCard
                  title="Refs Out"
                  value={memberGivenReferencesCount}
                  icon="arrow.up"
                  color={colors.primary}
                  colors={colors}
                  index={3}
                />
              </View>
            </View>
          </>
        )}

        {/* Messages and Meetings Section */}
        <View style={styles.twoColumnSection}>
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardHeader, { color: colors.text }]}>Messages</Text>
            <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    colors={colors}
                    index={index}
                    onAttachmentPress={handleAttachmentPress}
                  />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>No messages to display</Text>
              )}
            </ScrollView>
          </View>

          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardHeader, { color: colors.text }]}>My Meetings</Text>
            <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
              {meetings.length > 0 ? (
                meetings.map((meeting, index) => (
                  <MeetingItem key={meeting.id} meeting={meeting} colors={colors} index={index} />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>No meetings to display</Text>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Training and Birthdays Section */}
        <View style={styles.twoColumnSection}>
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardHeader, { color: colors.text }]}>Training</Text>
            <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
              {trainings.length > 0 ? (
                trainings.map((training, index) => (
                  <TrainingItem key={training.id} training={training} colors={colors} index={index} />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>No upcoming trainings</Text>
              )}
            </ScrollView>
          </View>

          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardHeader, { color: colors.text }]}>Upcoming Birthdays</Text>
            <ScrollView style={styles.scrollableContent} showsVerticalScrollIndicator={false}>
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.map((birthday, index) => (
                  <BirthdayItem key={birthday.id} birthday={birthday} colors={colors} index={index} />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>No upcoming birthdays</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  )
}

const QuickActionCard = ({ action, colors, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.actionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={action.onPress}
        activeOpacity={0.6}
      >
        <View style={[styles.iconContainer, { backgroundColor: action.color + "20" }]}>
          <IconSymbol name={action.icon as any} size={24} color={action.color} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{action.title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.placeholder }]}>{action.subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Modern Stat Card - Compact and clean design
const ModernStatCard = ({ title, value, icon, color, colors, onPress, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.9))

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, minWidth: "48%", maxWidth: "48%" }}>
      <Pressable
        style={({ pressed }) => [
          styles.modernStatCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.modernStatIconContainer, { backgroundColor: color + "15" }]}>
          <IconSymbol name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.modernStatValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.modernStatLabel, { color: colors.placeholder }]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const StatCard = ({ title, value, icon, color, colors, onPress, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        width: "48%",
      }}
    >
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
          <Text style={[styles.statLabel, { color: colors.placeholder }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const MessageItem = ({ message, colors, index, onAttachmentPress }: any) => {
  const [slideAnim] = useState(new Animated.Value(50))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={[styles.messageItem, { borderColor: colors.border }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>{message.heading}</Text>
          <Text style={[styles.messageDate, { color: colors.placeholder }]}>
            {new Date(message.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.messagePowerteam, { color: colors.placeholder }]}>{message.powerteam}</Text>
        <Text style={[styles.messageContent, { color: colors.text }]}>{message.message}</Text>
        {message.attachment && (
          <TouchableOpacity onPress={() => onAttachmentPress(message.attachment!)}>
            <Text style={[styles.attachmentLink, { color: colors.primary }]}>View Attachment</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

const MeetingItem = ({ meeting, colors, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(50))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={[styles.messageItem, { borderColor: colors.border }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>{meeting.meetingTitle}</Text>
          <Text style={[styles.messageDate, { color: colors.placeholder }]}>
            {new Date(meeting.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.messagePowerteam, { color: colors.placeholder }]}>{meeting.meetingVenue}</Text>
        <Text style={[styles.messageContent, { color: colors.text }]}>{meeting.meetingTime}</Text>
      </View>
    </Animated.View>
  )
}

const TrainingItem = ({ training, colors, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(50))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={[styles.messageItem, { borderColor: colors.border }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>{training.title}</Text>
          <Text style={[styles.messageDate, { color: colors.placeholder }]}>
            {new Date(training.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.messagePowerteam, { color: colors.placeholder }]}>{training.venue}</Text>
        <Text style={[styles.messageContent, { color: colors.text }]}>{training.time}</Text>
      </View>
    </Animated.View>
  )
}

const BirthdayItem = ({ birthday, colors, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(50))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={[styles.messageItem, { borderColor: colors.border }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>{birthday.memberName}</Text>
          <Text style={[styles.messageDate, { color: colors.placeholder }]}>
            {birthday.daysUntilBirthday === 0
              ? "Today!"
              : birthday.daysUntilBirthday === 1
                ? "Tomorrow"
                : `In ${birthday.daysUntilBirthday} days`}
          </Text>
        </View>
        <Text style={[styles.messagePowerteam, { color: colors.placeholder }]}>{birthday.organizationName}</Text>
        <Text style={[styles.messageContent, { color: colors.text }]}>{birthday.chapter?.name || "No Chapter"}</Text>
      </View>
    </Animated.View>
  )
}

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
  // Modern Header Styles
  modernHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
  },
  // Old header styles (kept for compatibility)
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
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "400",
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
  // Modern Section Styles
  modernSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modernBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modernBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modernStatCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modernStatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modernStatValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  // Old Section Styles
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
    flexDirection: "column",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statInfo: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
})
