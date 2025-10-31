import { apiService } from './apiService';

export interface Membership {
  id: number;
  memberId: number;
  packageId: number;
  invoiceNumber?: string;
  invoiceDate: string;
  packageStartDate: string;
  packageEndDate: string;
  basicFees: number;
  cgstRate?: number | null;
  sgstRate?: number | null;
  igstRate?: number | null;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  totalFees: number;
  paymentDate: string;
  paymentMode: string;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  bankName?: string | null;
  neftNumber?: string | null;
  utrNumber?: string | null;
  active: boolean;
  package: {
    id: number;
    packageName: string;
    isVenueFee: boolean;
    amount?: number;
  };
  member?: {
    id: number;
    memberName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MembershipFormData {
  memberId: number;
  packageId: number;
  invoiceDate: Date;
  packageStartDate: Date;
  basicFees: number;
  cgstRate?: number | null;
  sgstRate?: number | null;
  igstRate?: number | null;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  totalAmount?: number;
  paymentDate: Date;
  paymentMode: string;
  chequeNumber?: string | null;
  chequeDate?: Date | null;
  bankName?: string | null;
  neftNumber?: string | null;
  utrNumber?: string | null;
  active: boolean;
}

// Get memberships for a specific member
export const getMembershipsByMember = async (memberId: number): Promise<Membership[]> => {
  const response = await apiService.get<{ success: boolean; data: Membership[] }>(`/api/memberships/member/${memberId}`);
  return response.data;
};

// Get a single membership by ID
export const getMembershipById = async (id: string | number): Promise<Membership> => {
  const response = await apiService.get<{ success: boolean; data: Membership }>(`/api/memberships/${id}`);
  return response.data;
};

// Create a new membership
export const createMembership = async (data: MembershipFormData): Promise<Membership> => {
  const response = await apiService.post<{ success: boolean; data: Membership }>('/api/memberships', data);
  return response.data;
};

// Update an existing membership
export const updateMembership = async (id: string | number, data: MembershipFormData): Promise<Membership> => {
  const response = await apiService.put<{ success: boolean; data: Membership }>(`/api/memberships/${id}`, data);
  return response.data;
};

// Delete a membership
export const deleteMembership = async (id: number): Promise<void> => {
  await apiService.delete(`/api/memberships/${id}`);
};
