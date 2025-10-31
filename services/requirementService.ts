import { apiService } from './apiService';

export interface Requirement {
  id: number;
  heading: string;
  requirement: string;
  createdAt: string;
  member?: {
    id: number;
    memberName: string;
  };
}

export interface RequirementListResponse {
  success: boolean;
  data: Requirement[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class RequirementService {
  /**
   * Get all requirements with optional pagination and search
   */
  async getAllRequirements(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Requirement[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const endpoint = `/api/requirements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiService.get<RequirementListResponse>(endpoint);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  }

  /**
   * Get a single requirement by ID
   */
  async getRequirementById(id: number): Promise<Requirement | null> {
    try {
      const response = await apiService.get<{ success: boolean; data: Requirement }>(
        `/api/requirements/${id}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching requirement:', error);
      throw error;
    }
  }

  /**
   * Create a new requirement
   */
  async createRequirement(data: {
    memberId: number;
    heading: string;
    requirement: string;
  }): Promise<Requirement> {
    try {
      const response = await apiService.post<{ success: boolean; data: Requirement }>(
        '/api/requirements',
        data
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to create requirement');
    } catch (error) {
      console.error('Error creating requirement:', error);
      throw error;
    }
  }
}

export const requirementService = new RequirementService();
export const getAllRequirements = () => requirementService.getAllRequirements();
export const createRequirement = (data: { memberId: number; heading: string; requirement: string }) => 
  requirementService.createRequirement(data);
