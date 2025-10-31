import { apiService } from './apiService';

export interface Member {
  id: number;
  memberName: string;
  email: string;
  mobile1: string;
  mobile2?: string;
  organizationName?: string;
  active: boolean; // API field
  isActive: boolean; // Computed field from API
  hoExpiryDate?: string;
  venueExpiryDate?: string;
  expiryDate?: string; // Computed field
  expiryType?: string; // Computed field
  daysUntilExpiry?: number; // Computed field
  isExpired?: boolean; // Computed field
  createdAt?: string;
  updatedAt?: string;
  // Profile pictures
  picture1?: string;
  picture2?: string;
  picture3?: string;
  coverPhoto?: string;
}

export interface MembersResponse {
  success: boolean;
  data: {
    members: Member[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  status?: number;
}

export interface MemberFormData {
  memberName: string;
  email: string;
  mobile1: string;
  mobile2?: string;
  organizationName?: string;
  active?: boolean;
}

// Get all members with pagination, search, and sorting
export const getMembers = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'memberName',
  sortOrder: 'asc' | 'desc' = 'asc',
  active: string = 'all'
): Promise<MembersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
    active,
  });

  const response = await apiService.get<MembersResponse>(`/api/members?${params.toString()}`);
  console.log('Members API Response:', response);
  return response;
};

// Get a single member by ID
export const getMemberById = async (id: string | number): Promise<Member> => {
  const response = await apiService.get<{ success: boolean; data: Member }>(`/api/members/${id}`);
  return response.data;
};

// Create a new member
export const createMember = async (data: MemberFormData): Promise<Member> => {
  const response = await apiService.post<{ success: boolean; data: Member }>('/api/members', data);
  return response.data;
};

// Update an existing member
export const updateMember = async (id: string | number, data: MemberFormData): Promise<Member> => {
  const response = await apiService.put<{ success: boolean; data: Member }>(`/api/members/${id}`, data);
  return response.data;
};

// Delete a member
export const deleteMember = async (id: number): Promise<void> => {
  await apiService.delete(`/api/members/${id}`);
};

// Toggle member user status (active/inactive)
export const toggleMemberStatus = async (id: number): Promise<Member> => {
  const response = await apiService.patch<{ success: boolean; data: Member }>(`/api/members/${id}/user-status`, {});
  return response.data;
};

// Get member profile with extended details (for social view)
export const getMemberProfile = async (id: string | number): Promise<any> => {
  const response = await apiService.get<any>(`/api/members/${id}`);
  // Handle both wrapped and direct responses
  return response.data || response;
};

// Get member testimonials (received)
export const getMemberTestimonials = async (id: string | number): Promise<any[]> => {
  const response = await apiService.get<any>(`/api/members/${id}/received-testimonials`);
  // Handle wrapped response with data array
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  return Array.isArray(response) ? response : [];
};

// Get member activity summary (stats, visitors, references, etc.)
export const getMemberActivitySummary = async (id: string | number): Promise<any> => {
  try {
    const response = await apiService.get<any>(`/api/members/${id}/activity-summary`);
    return response.data || response;
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    // Return default stats if endpoint fails
    return {
      totalVisitors: 0,
      totalReferences: 0,
      givenReferences: 0,
      receivedReferences: 0,
      totalTestimonials: 0,
      totalDoneDeals: 0,
      meetingAttendance: 0,
      totalMeetings: 0,
      attendedMeetings: 0,
      recentActivity: [],
    };
  }
};
