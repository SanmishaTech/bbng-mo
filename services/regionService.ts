import { apiService } from './apiService';

export interface Region {
  id: number;
  name: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegionsResponse {
  success: boolean;
  data: {
    zones: Region[];
    page: number;
    totalPages: number;
    totalZones: number;
  };
  status: number;
}

export interface RegionFormData {
  name: string;
}

export interface ZoneRoleAssignment {
  assignmentId: number;
  roleType: string;
  memberId: number;
  memberName: string;
  organizationName?: string;
  assignedAt: string;
}

export interface RegionDetailsWithRoles {
  id: number;
  name: string;
  zoneName: string;
  active: boolean;
  roles: ZoneRoleAssignment[];
}

export interface ChapterOption {
  id: number;
  name: string;
}

export interface MemberSearchResult {
  id: number;
  memberName: string;
  organizationName?: string;
  email?: string;
}

// Get all regions with pagination, search, and sorting
export const getRegions = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  active: string = 'all'
): Promise<RegionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
    active,
  });

  return apiService.get<RegionsResponse>(`/api/zones?${params.toString()}`);
};

// Get a single region by ID
export const getRegionById = async (id: string | number): Promise<Region> => {
  const response = await apiService.get<{ success: boolean; data: Region }>(`/api/zones/${id}`);
  return response.data;
};

// Create a new region
export const createRegion = async (data: RegionFormData): Promise<Region> => {
  const response = await apiService.post<{ success: boolean; data: Region }>('/api/zones', data);
  return response.data;
};

// Update an existing region
export const updateRegion = async (id: string | number, data: RegionFormData): Promise<Region> => {
  const response = await apiService.put<{ success: boolean; data: Region }>(`/api/zones/${id}`, data);
  return response.data;
};

// Delete a region
export const deleteRegion = async (id: number): Promise<void> => {
  await apiService.delete(`/api/zones/${id}`);
};

// Get region details with roles
export const getRegionRoles = async (id: number): Promise<RegionDetailsWithRoles> => {
  const response = await apiService.get<{ success: boolean; data: RegionDetailsWithRoles }>(`/api/zones/${id}/roles`);
  return response.data;
};

// Get all chapters
export const fetchAllChapters = async (): Promise<ChapterOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { chapters: ChapterOption[] } }>('/api/chapters');
  return response.data.chapters;
};

// Search members for zone assignment
export const searchMembersForZoneAssignment = async (
  search: string,
  chapterId?: number
): Promise<MemberSearchResult[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (chapterId) params.append('chapterId', chapterId.toString());
  
  const response = await apiService.get<{ success: boolean; data: { members: MemberSearchResult[] } }>(
    `/api/members/search?${params.toString()}`
  );
  return response.data.members;
};

// Assign zone role
export const assignZoneRole = async (
  zoneId: number,
  memberId: number,
  roleType: string
): Promise<void> => {
  await apiService.post(`/api/zones/${zoneId}/roles`, {
    memberId,
    roleType,
  });
};

// Remove zone role
export const removeZoneRole = async (assignmentId: number): Promise<void> => {
  await apiService.delete(`/api/zone-roles/${assignmentId}`);
};
