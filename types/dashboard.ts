// Dashboard data interfaces
export interface Message {
  id: number;
  heading: string;
  powerteam: string;
  message: string;
  attachment: string | null;
  createdAt: string;
  updatedAt: string;
  chapterId: number | null;
}

export interface ChapterMeeting {
  id: number;
  date: string;
  meetingTime: string;
  meetingTitle: string;
  meetingVenue: string;
  chapterId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: number;
  date: string;
  time: string;
  title: string;
  venue: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingBirthday {
  id: number;
  memberName: string;
  dateOfBirth: string;
  chapterId: number | null;
  organizationName: string;
  businessCategory: string;
  chapter: {
    name: string | null;
  } | null;
  daysUntilBirthday: number;
  upcomingBirthday: string;
}

export interface StatisticsResponse {
  total: number;
}

export interface MemberActivitySummary {
  businessGiven: number;
  businessReceived: number;
  referencesGiven: number;
  referencesReceived: number;
}

export interface DashboardData {
  // BBNG Statistics
  businessTotal: number;
  referencesCount: number;
  totalVisitorsCount: number;
  oneToOneCount: number;

  // Chapter Statistics
  chapterBusinessGenerated: number;
  chapterReferencesCount: number;
  chapterVisitorsCount: number;
  chapterOneToOneCount: number;

  // Member Statistics
  memberBusinessGiven: number;
  memberBusinessReceived: number;
  memberGivenReferencesCount: number;
  memberReceivedReferencesCount: number;

  // Content
  messages: Message[];
  meetings: ChapterMeeting[];
  trainings: Training[];
  upcomingBirthdays: UpcomingBirthday[];
}
