import { ItineraryImage } from '@/types';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// axiosインスタンスの作成
const imageApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// リクエストインターセプター（認証トークン追加）
imageApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 画像アップロード用のAPI関数
export const imageApi = {
  // 画像ファイルのアップロード
  uploadImages: async (
    itineraryItemId: string,
    files: File[]
  ): Promise<ItineraryImage[]> => {
    const formData = new FormData();

    // 複数ファイルを追加
    files.forEach(file => {
      formData.append('images', file);
    });

    formData.append('itineraryItemId', itineraryItemId);

    const userId = localStorage.getItem('userId');
    if (userId) {
      formData.append('userId', userId);
    }

    try {
      const response = await imageApiClient.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.images || [];
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('画像のアップロードに失敗しました');
    }
  },

  // 画像の削除
  deleteImage: async (imageId: string): Promise<void> => {
    try {
      await imageApiClient.delete(`/images/${imageId}`);
    } catch (error) {
      console.error('Image delete failed:', error);
      throw new Error('画像の削除に失敗しました');
    }
  },

  // 旅程アイテムの画像一覧取得
  getImages: async (itineraryItemId: string): Promise<ItineraryImage[]> => {
    try {
      const response = await imageApiClient.get(`/itinerary/${itineraryItemId}/images`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch images:', error);
      return [];
    }
  },
};