import { get, post, del, apiService } from './apiService';
import { API_CONFIG } from '@/config/api';

export interface Message {
  id: number;
  heading: string;
  powerteam: string;
  message: string;
  attachment: string | null; // JSON string with originalname and size
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  messages: Message[];
  page: number;
  totalPages: number;
  totalMessages: number;
}

export interface MessageFormData {
  heading: string;
  powerteam: string;
  message: string;
  attachment?: any; // File object for upload
}

/**
 * Fetch messages with pagination, sorting, and search
 */
export const getMessages = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'createdAt',
  sortOrder: string = 'desc',
  powerteamFilter: string = ''
): Promise<MessageResponse> => {
  let url = `/api/messages?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  if (powerteamFilter) {
    url += `&powerteam=${encodeURIComponent(powerteamFilter)}`;
  }
  
  const response = await get<{ success: boolean; data: MessageResponse }>(url);
  return response.data;
};

/**
 * Fetch a single message by ID
 */
export const getMessageById = async (id: number): Promise<Message> => {
  const response = await get<{ success: boolean; data: Message }>(`/api/messages/${id}`);
  return response.data;
};

/**
 * Create a new message with optional file attachment
 */
export const createMessage = async (data: MessageFormData): Promise<Message> => {
  // If there's an attachment, use FormData
  if (data.attachment) {
    const formData = new FormData();
    formData.append('heading', data.heading);
    formData.append('powerteam', data.powerteam);
    formData.append('message', data.message);
    formData.append('attachment', data.attachment);
    
    const response = await apiService.postFormData<{ success: boolean; data: Message }>('/api/messages', formData);
    return response.data;
  } else {
    // No attachment, use regular JSON
    const response = await post<{ success: boolean; data: Message }>('/api/messages', {
      heading: data.heading,
      powerteam: data.powerteam,
      message: data.message,
    });
    return response.data;
  }
};

/**
 * Update an existing message
 */
export const updateMessage = async (id: number, data: MessageFormData): Promise<Message> => {
  // If there's an attachment, use FormData
  if (data.attachment) {
    const formData = new FormData();
    formData.append('heading', data.heading);
    formData.append('powerteam', data.powerteam);
    formData.append('message', data.message);
    formData.append('attachment', data.attachment);
    
    const response = await apiService.putFormData<{ success: boolean; data: Message }>(`/api/messages/${id}`, formData);
    return response.data;
  } else {
    // No attachment, use regular JSON
    const response = await apiService.put<{ success: boolean; data: Message }>(`/api/messages/${id}`, {
      heading: data.heading,
      powerteam: data.powerteam,
      message: data.message,
    });
    return response.data;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (id: number): Promise<void> => {
  await del(`/api/messages/${id}`);
};

/**
 * Get attachment download URL
 */
export const getAttachmentUrl = (messageId: string): string => {
  return `${API_CONFIG.BASE_URL}/api/messages/${messageId}/attachment`;
};

/**
 * Parse attachment JSON
 */
export const parseAttachment = (attachmentJson: string | null): { originalname: string; size: number } | null => {
  if (!attachmentJson) return null;
  
  try {
    return JSON.parse(attachmentJson);
  } catch (e) {
    console.error('Error parsing attachment JSON:', e);
    return null;
  }
};
