// Extended member types for social media profile view

export interface MemberSocialProfile {
  id: string;
  name: string;
  profilePicture: string | null;
  coverPhoto: string | null;
  email: string;
  phone: string;
  designation: string; // Business category
  department: string; // Category
  joinDate: string;
  skills: string[]; // Specific give
  meetingsAttended: number;
  totalMeetings: number;
  projects: ProjectInfo[];
  achievements: string[]; // Specific ask
  lastActive: string;
  businessDetails: BusinessDetails;
  personalDetails: PersonalDetails;
  stats: MemberStats;
}

export interface BusinessDetails {
  gstNo: string;
  organizationName: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationLandline: string;
  organizationWebsite: string;
  organizationAddress: string;
  organizationDescription: string;
}

export interface PersonalDetails {
  gender: string;
  dob: string;
  address: string;
}

export interface ProjectInfo {
  name: string;
  role: string;
  status: string;
}

export interface MemberStats {
  totalVisitors: number;
  totalReferences: number;
  totalTestimonials: number;
  totalDoneDeals: number;
  meetingAttendance: string; // e.g., "85%"
}

export interface Testimonial {
  id: number;
  content: string;
  giverName: string;
  giverProfilePicture: string | null;
  giverOrganization: string;
  createdAt: string;
  rating?: number;
}
