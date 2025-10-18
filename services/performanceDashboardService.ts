import { httpClient } from './httpClient';

// Types for Performance Dashboard
export interface RoleInfo {
  inferredRole: string;
  accessScope: AccessScope[];
  roleDetails: {
    chapterRoles?: ChapterRole[];
    zoneRoles?: ZoneRole[];
  };
  memberId: number;
  memberName: string;
}

export interface ChapterRole {
  roleType: string;
  chapterName: string;
  chapterId: number;
}

export interface ZoneRole {
  roleType: string;
  zoneName: string;
  zoneId?: number;
}

export interface AccessScope {
  chapterId: number;
  chapterName: string;
  zoneName?: string;
  accessType: 'zone' | 'chapter_guardian' | 'development_coordinator' | 'office_bearer' | 'chapter';
  roles?: string[];
}

export interface MemberPerformance {
  memberId: number;
  memberName: string;
  organizationName: string;
  category: string;
  businessGenerated: {
    amount: number;
    count: number;
  };
  businessReceived: {
    amount: number;
    count: number;
  };
  oneToOneMeetings: number;
  referencesGiven: number;
  referencesReceived: number;
  visitorsInvited: number;
}

export interface ChapterSummary {
  totalBusinessGenerated: number;
  totalBusinessReceived: number;
  totalOneToOnes: number;
  totalReferencesGiven: number;
  totalReferencesReceived: number;
  totalVisitorsInvited: number;
}

export interface ChapterPerformance {
  chapterId: number;
  chapterName: string;
  zoneName?: string;
  summary: ChapterSummary;
  members: MemberPerformance[];
}

export interface PerformanceSummary {
  totalChapters: number;
  totalMembers: number;
  totalBusinessGenerated: number;
  totalBusinessReceived: number;
  totalOneToOnes: number;
  totalReferencesGiven: number;
  totalReferencesReceived: number;
  totalVisitorsInvited: number;
}

export interface PerformanceData {
  roleInfo: RoleInfo;
  chapters: ChapterPerformance[];
  summary: PerformanceSummary;
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}

export interface ChapterInfo {
  chapterId: number;
  chapterName: string;
}

export interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
  chapterId?: number | null;
}

class PerformanceDashboardService {
  /**
   * Get user's role and access information
   */
  async getUserRoleInfo(): Promise<RoleInfo> {
    try {
      const response = await httpClient.get<{ success: boolean; data: RoleInfo }>(
        '/api/performance-dashboard/user-role-info',
        true
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching role info:', error);
      throw error;
    }
  }

  /**
   * Get performance data for chapters
   */
  async getPerformanceData(filters: PerformanceFilters): Promise<PerformanceData> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.chapterId) queryParams.append('chapterId', filters.chapterId.toString());

      const endpoint = `/api/performance-dashboard/performance-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await httpClient.get<{ success: boolean; data: PerformanceData }>(
        endpoint,
        true
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  }

  /**
   * Get chapters in a specific zone
   */
  async getChaptersInZone(zoneName: string): Promise<ChapterInfo[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: ChapterInfo[] }>(
        `/api/performance-dashboard/chapters-in-zone?zoneName=${encodeURIComponent(zoneName)}`,
        true
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching chapters in zone:', error);
      throw error;
    }
  }
}

export const performanceDashboardService = new PerformanceDashboardService();
