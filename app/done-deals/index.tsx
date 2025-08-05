import { NavigationHeader } from "@/components/NavigationHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { apiService } from "@/services/apiService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface DoneDeal {
  id: string;
  date: string;
  amount: string;
  toWhom: string;
  narration: string;
  testimony?: string;
  chapter?: {
    name: string;
  };
  fromMember?: {
    memberName: string;
  };
}

type TabType = 'given' | 'received';

export default function DoneDealsIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [givenDeals, setGivenDeals] = useState<DoneDeal[]>([]);
  const [receivedDeals, setReceivedDeals] = useState<DoneDeal[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('given');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "surface");

  const loadGivenDeals = async () => {
    try {
      const data = await apiService.get<any>("/api/thankyou-slips?limit=100");

      if (data && Array.isArray(data.data?.thankYouSlips)) {
        setGivenDeals(data.data?.thankYouSlips);
      } else {
        setGivenDeals([]);
      }
    } catch (error) {
      console.error("Error loading given deals:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load given deals",
      });
    }
  };

  const loadReceivedDeals = async () => {
    try {
      const data = await apiService.get<any>("/api/thankyou-slips/received?page=1&limit=100");

      if (data && Array.isArray(data.data?.thankYouSlips)) {
        setReceivedDeals(data.data?.thankYouSlips);
      } else {
        setReceivedDeals([]);
      }
    } catch (error) {
      console.error("Error loading received deals:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load received deals",
      });
    }
  };

  const loadDoneDeals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([loadGivenDeals(), loadReceivedDeals()]);
    } catch (error) {
      console.error("Error loading done deals:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDoneDeals();
  }, []);

  // Removed useFocusEffect to prevent infinite API calls
  // Data will be loaded on component mount and can be refreshed manually

  const onRefresh = () => {
    loadDoneDeals(true);
  };

  const currentDeals = activeTab === 'given' ? givenDeals : receivedDeals;
  
  const filteredDoneDeals = currentDeals.filter(
    (deal) => {
      const query = searchQuery.toLowerCase();
      return (
        deal.toWhom.toLowerCase().includes(query) ||
        deal.narration.toLowerCase().includes(query) ||
        deal.amount.toLowerCase().includes(query) ||
        (deal.chapter?.name.toLowerCase().includes(query)) ||
        (deal.fromMember?.memberName.toLowerCase().includes(query))
      );
    }
  );

  const renderDoneDeal = ({ item }: { item: DoneDeal }) => {
    const isGiven = activeTab === 'given';
    const personLabel = isGiven ? 'To' : 'Chapter';
    
    // For received deals, show chapter name instead of member name
    const displayName = isGiven ? item.toWhom : (item.chapter?.name || 'Unknown Chapter');
    
    return (
      <TouchableOpacity
        style={[
          styles.dealCard,
          { backgroundColor: cardColor, borderColor: colors.border },
        ]}
        onPress={() => router.push(`/done-deals/detail?id=${item.id}`)}
      >
        <View style={styles.dealHeader}>
          <View style={styles.dealTitleContainer}>
            <ThemedText style={styles.dealLabel}>
              {personLabel}: 
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.dealTitle}>
              {displayName}
            </ThemedText>
          </View>
          <View style={[
            styles.amountBadge, 
            { backgroundColor: isGiven ? colors.success : '#FF6B6B' }
          ]}>
            <ThemedText style={[styles.amountText, { color: "white" }]}>
              {item.amount}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.dealNarration} numberOfLines={2}>
          {item.narration || "No description"}
        </ThemedText>
        <ThemedText style={styles.dealDate}>
          Date: {new Date(item.date).toLocaleDateString()}
        </ThemedText>
        {/* Show member info for received deals, chapter info for given deals */}
        {isGiven && item.chapter && (
          <ThemedText style={styles.dealChapter}>
            Chapter: {item.chapter.name}
          </ThemedText>
        )}
        {!isGiven && item.fromMember && (
          <ThemedText style={styles.dealChapter}>
            From Member: {item.fromMember.memberName}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Done Deals" />

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: cardColor, borderColor: colors.border },
        ]}
      >
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search done deals..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: cardColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'given' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            { borderColor: colors.border },
          ]}
          onPress={() => setActiveTab('given')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'given' && { color: 'white' },
            ]}
          >
            Given ({givenDeals.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            { borderColor: colors.border },
          ]}
          onPress={() => setActiveTab('received')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'received' && { color: 'white' },
            ]}
          >
            Received ({receivedDeals.length})
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Done Deals List */}
      <FlatList
        data={filteredDoneDeals}
        keyExtractor={(item) => item.id}
        renderItem={renderDoneDeal}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <>
                <IconSymbol
                  name="arrow.clockwise"
                  size={50}
                  color={colors.icon}
                />
                <ThemedText style={styles.emptyText}>
                  Loading done deals...
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>Please wait</ThemedText>
              </>
            ) : (
              <>
                <IconSymbol
                  name="dollarsign.circle"
                  size={50}
                  color={colors.icon}
                />
                <ThemedText style={styles.emptyText}>
                  No done deals found
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Add your first done deal"}
                </ThemedText>
              </>
            )}
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/done-deals/add")}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    // subtle elevation + shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 4,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 6,
    // glassy feel
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  dealCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    // card elevation
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  dealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dealLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    marginRight: 6,
  },
  dealTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 16,
  },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 72,
    alignItems: "center",
  },
  amountText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dealNarration: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.9,
    lineHeight: 20,
  },
  dealDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  dealChapter: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
});
