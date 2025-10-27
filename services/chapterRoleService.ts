import { apiService } from './apiService';

export type RoleType =
  | 'chapterHead'
  | 'secretary'
  | 'treasurer'
  | 'guardian'
  | 'developmentCoordinator'
  | 'businessDevelopmentCoordinator'
  | 'membershipCommitteeCoordinator'
  | 'referenceCommitteeCoordinator'
  | 'socialMediaCoordinator';

export const ROLE_TYPES: Record<RoleType, string> = {
  chapterHead: 'Chapter Head',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  guardian: 'Guardian',
  developmentCoordinator: 'Development Coordinator',
  businessDevelopmentCoordinator: 'Business Development Coordinator',
  membershipCommitteeCoordinator: 'Membership Committee Coordinator',
  referenceCommitteeCoordinator: 'Reference Committee Coordinator',
  socialMediaCoordinator: 'Social Media Coordinator',
};

export const ROLE_COLORS: Record<RoleType, string> = {
  chapterHead: 'bg-blue-100 text-blue-800',
  secretary: 'bg-green-100 text-green-800',
  treasurer: 'bg-purple-100 text-purple-800',
  guardian: 'bg-yellow-100 text-yellow-800',
  developmentCoordinator: 'bg-teal-100 text-teal-800',
  businessDevelopmentCoordinator: 'bg-orange-100 text-orange-800',
  membershipCommitteeCoordinator: 'bg-pink-100 text-pink-800',
  referenceCommitteeCoordinator: 'bg-indigo-100 text-indigo-800',
  socialMediaCoordinator: 'bg-cyan-100 text-cyan-800',
};

export interface Member {
  id: number;
  memberName: string;
  email: string;
  mobile1?: string;
}

export interface ChapterRole {
  id: number;
  chapterId: number;
  memberId: number;
  roleType: string;
  assignedAt: string;
  member: Member;
}

export interface ChapterRoleHistory {
  id: number;
  chapterId: number;
  memberId: number;
  roleType: string;
  action: string;
  startDate: string;
  endDate?: string;
  performedByName?: string;
  member: Member;
}

// Get chapter roles
export const getChapterRoles = async (chapterId: number): Promise<ChapterRole[]> => {
  const response = await apiService.get<{ success: boolean; data: ChapterRole[] }>(
    `/api/chapters/${chapterId}/roles`
  );
  return response.data;
};

// Get chapter role history
export const getChapterRoleHistory = async (chapterId: number): Promise<ChapterRoleHistory[]> => {
  const response = await apiService.get<{ success: boolean; data: ChapterRoleHistory[] }>(
    `/api/chapters/${chapterId}/roles/history`
  );
  return response.data;
};

// Assign chapter role
export const assignChapterRole = async (
  chapterId: number,
  memberId: number,
  roleType: string,
  fromChapterId?: number
): Promise<ChapterRole> => {
  const payload: any = {
    memberId,
    roleType,
  };
  
  if (fromChapterId) {
    payload.fromChapterId = fromChapterId;
  }
  
  const response = await apiService.post<{ success: boolean; data: ChapterRole }>(
    `/api/chapters/${chapterId}/roles`,
    payload
  );
  return response.data;
};

// Get members for search
export const getMembers = async (
  searchQuery: string,
  chapterId?: number
): Promise<Member[]> => {
  const params = new URLSearchParams({
    search: searchQuery,
  });
  
  if (chapterId) {
    params.append('chapterId', chapterId.toString());
  }
  
  const response = await apiService.get<{ success: boolean; data: { members: Member[] } }>(
    `/api/members?${params.toString()}`
  );
  return response.data.members;
};
