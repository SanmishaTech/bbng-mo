import { get, post, del, apiService } from './apiService';

export interface SiteSetting {
  id: number;
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettingFormData {
  key: string;
  value: string;
}

/**
 * Fetch all site settings
 */
export const getSiteSettings = async (): Promise<SiteSetting[]> => {
  const response = await get<{ success: boolean; data: SiteSetting[] }>('/api/sites');
  return response.data || [];
};

/**
 * Fetch a single site setting by key
 */
export const getSiteSettingByKey = async (key: string): Promise<SiteSetting> => {
  const response = await get<{ success: boolean; data: SiteSetting }>(`/api/sites/${key}`);
  return response.data;
};

/**
 * Create a new site setting
 */
export const createSiteSetting = async (data: SiteSettingFormData): Promise<SiteSetting> => {
  const response = await post<{ success: boolean; data: SiteSetting }>('/api/sites', data);
  return response.data;
};

/**
 * Update an existing site setting (uses ID, not key)
 */
export const updateSiteSetting = async (id: number, data: SiteSettingFormData): Promise<SiteSetting> => {
  const response = await apiService.put<{ success: boolean; data: SiteSetting }>(`/api/sites/${id}`, data);
  return response.data;
};

/**
 * Delete a site setting
 */
export const deleteSiteSetting = async (id: number): Promise<void> => {
  await del(`/api/sites/${id}`);
};
