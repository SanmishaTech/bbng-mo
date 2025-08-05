import {
  ChapterMeeting,
  DashboardData,
  MemberActivitySummary,
  Message,
  StatisticsResponse,
  Training,
  UpcomingBirthday,
} from "@/types/dashboard";
import { get } from "./apiService";

class DashboardService {
  // BBNG Statistics
  async getBusinessTotal(): Promise<number> {
    try {
      console.log("DashboardService: Fetching business total...");
      const data = await get<StatisticsResponse>(
        "/api/statistics/business-generated"
      );
      console.log("DashboardService: Business total response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching business data:", error);
      return 0;
    }
  }

  async getReferencesCount(): Promise<number> {
    try {
      console.log("DashboardService: Fetching references count...");
      const data = await get<StatisticsResponse>(
        "/api/statistics/references-count"
      );
      console.log("DashboardService: References count response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching references count:", error);
      return 0;
    }
  }

  async getTotalVisitorsCount(): Promise<number> {
    try {
      console.log("DashboardService: Fetching total visitors count...");
      const data = await get<StatisticsResponse>("/api/statistics/total-visitors");
      console.log("DashboardService: Total visitors response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching total visitors count:", error);
      return 0;
    }
  }

  async getOneToOneCount(): Promise<number> {
    try {
      const data = await get<StatisticsResponse>("/api/statistics/one-to-one");
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching one-to-one count:", error);
      return 0;
    }
  }

  // Member Statistics
  async getMemberGivenReferences(memberId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching member given references for ID:", memberId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/member-given-references/${memberId}`
      );
      console.log("DashboardService: Member given references response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching member given references count:", error);
      return 0;
    }
  }

  async getMemberReceivedReferences(memberId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching member received references for ID:", memberId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/member-received-references/${memberId}`
      );
      console.log("DashboardService: Member received references response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching member received references count:", error);
      return 0;
    }
  }

  async getMemberActivitySummary(
    memberId: number
  ): Promise<MemberActivitySummary> {
    try {
      console.log("DashboardService: Fetching member activity summary for ID:", memberId);
      const data = await get<any>(
        `/api/members/${memberId}/activity-summary`
      );
      console.log("DashboardService: Member activity summary response:", data);
      
      const activityData = data.data || data;
      return {
        businessGiven: activityData.businessGiven || 0,
        businessReceived: activityData.businessReceived || 0,
        referencesGiven: activityData.referencesGiven || 0,
        referencesReceived: activityData.referencesReceived || 0,
      };
    } catch (error) {
      console.error("Error fetching member activity summary:", error);
      return {
        businessGiven: 0,
        businessReceived: 0,
        referencesGiven: 0,
        referencesReceived: 0,
      };
    }
  }

  // Chapter Statistics
  async getChapterBusinessGenerated(chapterId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching chapter business generated for ID:", chapterId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/chapter-business-generated/${chapterId}`
      );
      console.log("DashboardService: Chapter business generated response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching chapter business generated data:", error);
      return 0;
    }
  }

  async getChapterReferencesCount(chapterId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching chapter references count for ID:", chapterId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/chapter-references-count/${chapterId}`
      );
      console.log("DashboardService: Chapter references count response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching chapter references count:", error);
      return 0;
    }
  }

  async getChapterVisitorsCount(chapterId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching chapter visitors count for ID:", chapterId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/chapter-visitors-count/${chapterId}`
      );
      console.log("DashboardService: Chapter visitors count response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching chapter visitors count:", error);
      return 0;
    }
  }

  async getChapterOneToOneCount(chapterId: number): Promise<number> {
    try {
      console.log("DashboardService: Fetching chapter one-to-one count for ID:", chapterId);
      const data = await get<StatisticsResponse>(
        `/api/statistics/chapter-one-to-one-count/${chapterId}`
      );
      console.log("DashboardService: Chapter one-to-one count response:", data);
      return data.data?.total || data.total || 0;
    } catch (error) {
      console.error("Error fetching chapter one-to-one count:", error);
      return 0;
    }
  }

  // Content Data
  async getMessages(memberId?: number): Promise<Message[]> {
    try {
      let endpoint = "/api/statistics/recent-messages";
      if (memberId) {
        endpoint = `/api/statistics/member-messages/${memberId}`;
      }
      console.log("DashboardService: Fetching messages from endpoint:", endpoint);
      const data = await get<{ messages: Message[] }>(endpoint);
      console.log("DashboardService: Messages response:", data);
      return data.data?.messages || data.messages || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async getChapterMeetings(
    memberId?: number,
    chapterId?: number
  ): Promise<ChapterMeeting[]> {
    try {
      let endpoint = "/api/statistics/chapter-meetings";
      if (memberId) {
        endpoint = `/api/statistics/member-chapter-meetings/${memberId}`;
      } else if (chapterId) {
        endpoint = `/api/statistics/chapter-meetings/${chapterId}`;
      }
      console.log("DashboardService: Fetching meetings from endpoint:", endpoint);
      const data = await get<{ meetings: ChapterMeeting[] }>(endpoint);
      console.log("DashboardService: Meetings response:", data);
      return data.data?.meetings || data.meetings || [];
    } catch (error) {
      console.error("Error fetching chapter meetings:", error);
      return [];
    }
  }

  async getTrainings(): Promise<Training[]> {
    try {
      console.log("DashboardService: Fetching trainings...");
      const data = await get<{ trainings: Training[] }>(
        "/api/statistics/trainings"
      );
      console.log("DashboardService: Trainings response:", data);
      return data.data?.trainings || data.trainings || [];
    } catch (error) {
      console.error("Error fetching trainings:", error);
      return [];
    }
  }

  async getUpcomingBirthdays(): Promise<UpcomingBirthday[]> {
    try {
      console.log("DashboardService: Fetching upcoming birthdays...");
      const data = await get<{ birthdays: UpcomingBirthday[] }>(
        "/api/statistics/upcoming-birthdays"
      );
      console.log("DashboardService: Upcoming birthdays response:", data);
      return data.data?.birthdays || data.birthdays || [];
    } catch (error) {
      console.error("Error fetching upcoming birthdays:", error);
      return [];
    }
  }

  // Comprehensive dashboard data fetch
  async getDashboardData(user: any): Promise<DashboardData> {
    console.log("DashboardService: Processing user data:", user);
    
    // Handle different user data structures
    const memberId = user?.member?.id || user?.memberId || user?.id;
    const chapterId = user?.member?.chapterId || user?.member?.chapter_id || user?.chapterId || user?.chapter_id;
    
    console.log("DashboardService: Extracted memberId:", memberId);
    console.log("DashboardService: Extracted chapterId:", chapterId);
    console.log("DashboardService: User role:", user?.role);

    const [
      // BBNG Stats
      businessTotal,
      referencesCount,
      totalVisitorsCount,
      oneToOneCount,

      // Member Stats
      memberActivitySummary,

      // Chapter Stats
      chapterBusinessGenerated,
      chapterReferencesCount,
      chapterVisitorsCount,
      chapterOneToOneCount,

      // Content
      messages,
      meetings,
      trainings,
      upcomingBirthdays,
    ] = await Promise.all([
      // BBNG Stats
      this.getBusinessTotal(),
      this.getReferencesCount(),
      this.getTotalVisitorsCount(),
      this.getOneToOneCount(),

      // Member Stats
      memberId
        ? this.getMemberActivitySummary(memberId)
        : Promise.resolve({
            businessGiven: 0,
            businessReceived: 0,
            referencesGiven: 0,
            referencesReceived: 0,
          }),

      // Chapter Stats
      chapterId
        ? this.getChapterBusinessGenerated(chapterId)
        : Promise.resolve(0),
      chapterId
        ? this.getChapterReferencesCount(chapterId)
        : Promise.resolve(0),
      chapterId ? this.getChapterVisitorsCount(chapterId) : Promise.resolve(0),
      chapterId ? this.getChapterOneToOneCount(chapterId) : Promise.resolve(0),

      // Content
      this.getMessages(memberId),
      this.getChapterMeetings(memberId, chapterId),
      this.getTrainings(),
      this.getUpcomingBirthdays(),
    ]);

    return {
      // BBNG Statistics
      businessTotal,
      referencesCount,
      totalVisitorsCount,
      oneToOneCount,

      // Chapter Statistics
      chapterBusinessGenerated,
      chapterReferencesCount,
      chapterVisitorsCount,
      chapterOneToOneCount,

      // Member Statistics
      memberBusinessGiven: memberActivitySummary.businessGiven,
      memberBusinessReceived: memberActivitySummary.businessReceived,
      memberGivenReferencesCount: memberActivitySummary.referencesGiven,
      memberReceivedReferencesCount: memberActivitySummary.referencesReceived,

      // Content
      messages,
      meetings,
      trainings,
      upcomingBirthdays,
    };
  }
}

export const dashboardService = new DashboardService();
