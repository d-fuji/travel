import axios from 'axios';
import {
  InvitationLink,
  InvitationDetails,
  CreateInvitationLinkRequest,
  JoinInvitationRequest,
  InvitationUsage,
  InvitationSettings,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 招待API専用のaxiosインスタンス
const invitationApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor to add auth token
invitationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  console.log('Invitation API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling and date conversion
invitationApi.interceptors.response.use(
  (response) => {
    // Convert date strings to Date objects
    if (response.data) {
      if (Array.isArray(response.data)) {
        response.data = response.data.map(convertDates);
      } else {
        response.data = convertDates(response.data);
      }
    }
    return response;
  },
  (error) => {
    console.error('Invitation API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Date conversion utility
function convertDates<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const dateFields = ['createdAt', 'updatedAt', 'usedAt', 'joinedAt', 'lastActiveAt'];
  const converted = { ...obj } as any;
  
  for (const [key, value] of Object.entries(converted)) {
    if (dateFields.includes(key) && typeof value === 'string') {
      converted[key] = new Date(value);
    } else if (value && typeof value === 'object') {
      converted[key] = convertDates(value);
    }
  }
  
  return converted;
}

// 招待リンク関連API
export const invitationLinkApi = {
  // 招待リンク作成
  create: async (groupId: string, data: CreateInvitationLinkRequest): Promise<InvitationLink> => {
    console.log('Creating invitation link for group:', groupId, data);
    const response = await invitationApi.post(`/api/groups/${groupId}/invitation-links`, data);
    return response.data;
  },

  // グループの招待リンク一覧取得
  getByGroup: async (groupId: string): Promise<InvitationLink[]> => {
    console.log('Fetching invitation links for group:', groupId);
    const response = await invitationApi.get(`/api/groups/${groupId}/invitation-links`);
    return response.data;
  },

  // 招待リンク詳細取得（参加前確認用）
  getDetails: async (token: string): Promise<InvitationDetails> => {
    console.log('Fetching invitation details for token:', token.substring(0, 8) + '...');
    const response = await invitationApi.get(`/api/invitation/${token}`);
    return response.data;
  },

  // 招待リンク経由での参加
  join: async (token: string, data: JoinInvitationRequest): Promise<{ success: boolean; userId?: string; message: string }> => {
    console.log('Joining via invitation link:', token.substring(0, 8) + '...', {
      hasUserId: !!data.userId,
      hasUserData: !!data.userData,
      hasGuestData: !!data.guestData,
    });
    const response = await invitationApi.post(`/api/invitation/${token}/join`, data);
    return response.data;
  },

  // 招待リンクの無効化
  deactivate: async (linkId: string): Promise<void> => {
    console.log('Deactivating invitation link:', linkId);
    await invitationApi.patch(`/api/invitation-links/${linkId}/deactivate`);
  },

  // 招待リンクの削除
  delete: async (linkId: string): Promise<void> => {
    console.log('Deleting invitation link:', linkId);
    await invitationApi.delete(`/api/invitation-links/${linkId}`);
  },

  // 招待リンクの使用履歴取得
  getUsageHistory: async (linkId: string): Promise<InvitationUsage[]> => {
    console.log('Fetching usage history for link:', linkId);
    const response = await invitationApi.get(`/api/invitation-links/${linkId}/usage`);
    return response.data;
  },
};

// 招待設定関連API
export const invitationSettingsApi = {
  // 招待設定の取得
  get: async (groupId: string): Promise<InvitationSettings> => {
    console.log('Fetching invitation settings for group:', groupId);
    const response = await invitationApi.get(`/api/groups/${groupId}/invitation-settings`);
    return response.data;
  },

  // 招待設定の更新
  update: async (groupId: string, settings: Partial<InvitationSettings>): Promise<InvitationSettings> => {
    console.log('Updating invitation settings for group:', groupId, settings);
    const response = await invitationApi.patch(`/api/groups/${groupId}/invitation-settings`, settings);
    return response.data;
  },
};

// ユーティリティ関数
export const invitationUtils = {
  // 招待リンクURLの生成
  generateInviteUrl: (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.travel.com';
    return `${baseUrl}/invite/${token}`;
  },

  // 招待リンクの有効性チェック
  isLinkValid: (link: InvitationLink): boolean => {
    return link.isActive;
  },
};