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
import { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle } from "react-native-svg"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 56) / 3

const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "#8B5CF6" }: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    animatedValue.addListener((v) => {
      setProgress(v.value)
    })

    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false, // Changed to false for web compatibility
    }).start()

    return () => animatedValue.removeAllListeners()
  }, [percentage])

  const strokeDashoffset = circumference - (circumference * progress) / 100

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { hasChapterAccess } = useUserRole()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const insets = useSafeAreaInsets()

  const [fadeAnim] = useState(new Animated.Value(0))
  const scrollY = useRef(new Animated.Value(0)).current

  // State variables
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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    }
  }, [loading])

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await dashboardService.getDashboardData(user)

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

  // Calculate percentages for circular progress
  const totalTargetBusiness = 500000 // Example target
  const businessPercentage = Math.min((businessTotal / totalTargetBusiness) * 100, 100)

  const categoryData = [
    {
      id: "references",
      title: "References",
      value: referencesCount,
      target: 50,
      color: "#8B5CF6",
      icon: "person.2.fill",
    },
    {
      id: "business",
      title: "Business",
      value: businessTotal,
      target: totalTargetBusiness,
      color: "#06B6D4",
      icon: "dollarsign.circle.fill",
      isAmount: true,
    },
    {
      id: "meetings",
      title: "Meetings",
      value: oneToOneCount,
      target: 20,
      color: "#10B981",
      icon: "person.2.fill",
    },
  ]

  const quickActions = [
    {
      id: "give-reference",
      title: "Give Reference",
      icon: "arrow.up.right.circle.fill",
      color: "#8B5CF6",
    },
    {
      id: "done-deal",
      title: "Done Deal",
      icon: "checkmark.circle.fill",
      color: "#10B981",
    },
    {
      id: "one-to-one",
      title: "Schedule 1:1",
      icon: "calendar.badge.plus",
      color: "#F59E0B",
    },
    {
      id: "visitors",
      title: "Visitors",
      icon: "person.3.fill",
      color: "#06B6D4",
      requiresChapter: true,
    },
  ]

  const filteredQuickActions = quickActions.filter((action) => {
    if (!action.requiresChapter) return true
    return hasChapterAccess
  })

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  return (
    <View style={styles.container}>
      {/* Floating Header - appears on scroll */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={["#1F2937", "#111827"]} style={styles.floatingHeaderGradient}>
          <Text style={styles.floatingHeaderTitle}>Dashboard</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "ios" ? 100 : 80 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      >
        {/* Header Section */}
        <LinearGradient colors={["#1F2937", "#111827"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
                </View>
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0] || "User"}</Text>
                <Text style={styles.subtitle}>Your Network</Text>
              </View>
            </View>
            <Pressable style={styles.transactionsButton} onPress={() => router.push("/(tabs)/performance")}>
              <Text style={styles.transactionsButtonText}>Performance</Text>
            </Pressable>
          </View>

          {/* Main Metric with Circular Progress */}
          <View style={styles.mainMetricContainer}>
            <Text style={styles.mainMetricLabel}>Total Business</Text>
            <View style={styles.mainMetricRow}>
              <Text style={styles.mainMetricValue}>₹{businessTotal.toLocaleString()}</Text>
              <CircularProgress percentage={businessPercentage} size={100} strokeWidth={8} color="#8B5CF6" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Category Cards */}
          <View style={styles.categoryGrid}>
            {categoryData.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </View>

          {/* Quick Actions - Horizontal Scroll */}
          {user?.role !== "admin" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>
              <FlatList
                horizontal
                data={filteredQuickActions}
                renderItem={({ item, index }) => (
                  <QuickActionButton action={item} onPress={() => handleQuickAction(item.id)} index={index} />
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsContainer}
              />
            </>
          )}

          {/* Chapter Stats - Only for non-admin */}
          {user?.role !== "admin" && hasChapterAccess && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{user?.member?.chapter?.name || "Chapter"} Performance</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>CHAPTER</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <StatCard
                  title="References"
                  value={chapterReferencesCount}
                  icon="person.2.fill"
                  color="#8B5CF6"
                  index={0}
                />
                <StatCard
                  title="Business"
                  value={`₹${chapterBusinessGenerated.toLocaleString()}`}
                  icon="dollarsign.circle.fill"
                  color="#10B981"
                  index={1}
                />
                <StatCard
                  title="One-to-One"
                  value={chapterOneToOneCount}
                  icon="person.2.fill"
                  color="#F59E0B"
                  index={2}
                />
                <StatCard
                  title="Visitors"
                  value={chapterVisitorsCount}
                  icon="person.3.fill"
                  color="#06B6D4"
                  index={3}
                  onPress={() => router.push("/modules/visitors" as any)}
                />
              </View>
            </>
          )}

          {/* Personal Performance - Only for non-admin */}
          {user?.role !== "admin" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Activity</Text>
                <View style={[styles.badge, { backgroundColor: "#F59E0B15" }]}>
                  <Text style={[styles.badgeText, { color: "#F59E0B" }]}>PERSONAL</Text>
                </View>
              </View>
              <View style={styles.activityList}>
                <ActivityItem
                  title="Business Received"
                  value={`₹${memberBusinessReceived.toLocaleString()}`}
                  icon="arrow.down.circle.fill"
                  color="#10B981"
                  date="This month"
                  index={0}
                />
                <ActivityItem
                  title="Business Given"
                  value={`₹${memberBusinessGiven.toLocaleString()}`}
                  icon="arrow.up.circle.fill"
                  color="#F59E0B"
                  date="This month"
                  index={1}
                />
                <ActivityItem
                  title="References Received"
                  value={memberReceivedReferencesCount}
                  icon="arrow.down"
                  color="#06B6D4"
                  date="This month"
                  index={2}
                />
                <ActivityItem
                  title="References Given"
                  value={memberGivenReferencesCount}
                  icon="arrow.up"
                  color="#8B5CF6"
                  date="This month"
                  index={3}
                />
              </View>
            </>
          )}

          {/* Meetings & Messages */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <View style={styles.twoColumnGrid}>
            <View style={styles.activityCard}>
              <View style={styles.activityCardHeader}>
                <Text style={styles.activityCardTitle}>Meetings</Text>
                <View style={[styles.countBadge, { backgroundColor: "#8B5CF615" }]}>
                  <Text style={[styles.countBadgeText, { color: "#8B5CF6" }]}>{meetings.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.activityCardContent} showsVerticalScrollIndicator={false}>
                {meetings.length > 0 ? (
                  meetings.map((meeting, index) => (
                    <MeetingItem key={meeting.id} meeting={meeting} index={index} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No upcoming meetings</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityCardHeader}>
                <Text style={styles.activityCardTitle}>Messages</Text>
                <View style={[styles.countBadge, { backgroundColor: "#10B98115" }]}>
                  <Text style={[styles.countBadgeText, { color: "#10B981" }]}>{messages.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.activityCardContent} showsVerticalScrollIndicator={false}>
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      index={index}
                      onAttachmentPress={handleAttachmentPress}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No messages</Text>
                )}
              </ScrollView>
            </View>
          </View>

          {/* Trainings & Birthdays */}
          <View style={styles.twoColumnGrid}>
            <View style={styles.activityCard}>
              <View style={styles.activityCardHeader}>
                <Text style={styles.activityCardTitle}>Training</Text>
                <View style={[styles.countBadge, { backgroundColor: "#F59E0B15" }]}>
                  <Text style={[styles.countBadgeText, { color: "#F59E0B" }]}>{trainings.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.activityCardContent} showsVerticalScrollIndicator={false}>
                {trainings.length > 0 ? (
                  trainings.map((training, index) => <TrainingItem key={training.id} training={training} index={index} />)
                ) : (
                  <Text style={styles.emptyText}>No upcoming trainings</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityCardHeader}>
                <Text style={styles.activityCardTitle}>Birthdays</Text>
                <View style={[styles.countBadge, { backgroundColor: "#EC489815" }]}>
                  <Text style={[styles.countBadgeText, { color: "#EC4899" }]}>{upcomingBirthdays.length}</Text>
                </View>
              </View>
              <ScrollView style={styles.activityCardContent} showsVerticalScrollIndicator={false}>
                {upcomingBirthdays.length > 0 ? (
                  upcomingBirthdays.map((birthday, index) => (
                    <BirthdayItem key={birthday.id} birthday={birthday} index={index} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No upcoming birthdays</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  )
}

// Category Card Component
const CategoryCard = ({ category, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const percentage = Math.min((category.value / category.target) * 100, 100)

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 100,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient colors={[category.color, category.color + "CC"]} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <IconSymbol name={category.icon} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryPercentage}>{Math.round(percentage)}%</Text>
        </View>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryValue}>
          {category.isAmount ? `₹${category.value.toLocaleString()}` : category.value}
        </Text>
      </LinearGradient>
    </Animated.View>
  )
}

// Quick Action Button Component
const QuickActionButton = ({ action, onPress, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.9))

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 80,
      friction: 8,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [styles.quickActionButton, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
        onPress={onPress}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: action.color + "20" }]}>
          <IconSymbol name={action.icon} size={24} color={action.color} />
        </View>
        <Text style={styles.quickActionText}>{action.title}</Text>
      </Pressable>
    </Animated.View>
  )
}

// Stat Card Component
const StatCard = ({ title, value, icon, color, onPress, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0.9))

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 8,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={[styles.statCardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.7 }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </Pressable>
    </Animated.View>
  )
}

// Activity Item Component
const ActivityItem = ({ title, value, icon, color, date, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(30))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.activityItemContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={[styles.activityIconContainer, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <View style={styles.activityItemContent}>
        <Text style={styles.activityItemTitle}>{title}</Text>
        <Text style={styles.activityItemDate}>{date}</Text>
      </View>
      <Text style={[styles.activityItemValue, { color: color }]}>{value}</Text>
    </Animated.View>
  )
}

// Meeting Item Component
const MeetingItem = ({ meeting, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(20))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.listItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.listItemIcon, { backgroundColor: "#8B5CF615" }]}>
        <IconSymbol name="calendar" size={16} color="#8B5CF6" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {meeting.meetingTitle}
        </Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {meeting.meetingVenue}
        </Text>
      </View>
      <Text style={styles.listItemDate}>{new Date(meeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
    </Animated.View>
  )
}

// Message Item Component
const MessageItem = ({ message, index, onAttachmentPress }: any) => {
  const [slideAnim] = useState(new Animated.Value(20))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.listItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.listItemIcon, { backgroundColor: "#10B98115" }]}>
        <IconSymbol name="envelope.fill" size={16} color="#10B981" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {message.heading}
        </Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {message.powerteam}
        </Text>
      </View>
      <Text style={styles.listItemDate}>{new Date(message.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
    </Animated.View>
  )
}

// Training Item Component
const TrainingItem = ({ training, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(20))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.listItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.listItemIcon, { backgroundColor: "#F59E0B15" }]}>
        <IconSymbol name="book.fill" size={16} color="#F59E0B" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {training.title}
        </Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {training.venue}
        </Text>
      </View>
      <Text style={styles.listItemDate}>{new Date(training.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
    </Animated.View>
  )
}

// Birthday Item Component
const BirthdayItem = ({ birthday, index }: any) => {
  const [slideAnim] = useState(new Animated.Value(20))
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const daysText =
    birthday.daysUntilBirthday === 0 ? "Today!" : birthday.daysUntilBirthday === 1 ? "Tomorrow" : `${birthday.daysUntilBirthday}d`

  return (
    <Animated.View
      style={[
        styles.listItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.listItemIcon, { backgroundColor: "#EC489815" }]}>
        <IconSymbol name="gift" size={16} color="#EC4899" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {birthday.memberName}
        </Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {birthday.organizationName}
        </Text>
      </View>
      <Text style={[styles.listItemDate, birthday.daysUntilBirthday === 0 && { color: "#EC4899", fontWeight: "700" }]}>
        {daysText}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94A3B8",
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingHeaderGradient: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  floatingHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#94A3B8",
  },
  transactionsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  transactionsButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mainMetricContainer: {
    marginTop: 8,
  },
  mainMetricLabel: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 8,
    fontWeight: "500",
  },
  mainMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainMetricValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  progressTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  categoryCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    minHeight: 140,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  categoryTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    fontWeight: "600",
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "#8B5CF615",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8B5CF6",
    letterSpacing: 0.5,
  },
  quickActionsContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    minWidth: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCardContainer: {
    flex: 1,
    minWidth: "48%",
    maxWidth: "48%",
  },
  statCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activityList: {
    marginBottom: 24,
  },
  activityItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityItemContent: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  activityItemDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  activityItemValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  twoColumnGrid: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    minHeight: 280,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  activityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  activityCardContent: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
  },
  listItemDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 32,
  },
})