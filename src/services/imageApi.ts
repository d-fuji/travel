import { ItineraryImage, ImageUploadOptions } from '@/types';
import { compressImage, validateImageFile, validateImageUrl } from '@/utils/imageUtils';

// 画像アップロード用のAPI関数（モック実装）
export const imageApi = {
  // 画像ファイルのアップロード
  uploadImages: async (
    itineraryItemId: string,
    files: File[],
    options: ImageUploadOptions = { quality: 'medium', enableCompression: true }
  ): Promise<ItineraryImage[]> => {
    console.log('Mock: Uploading images for item:', itineraryItemId);
    
    const uploadedImages: ItineraryImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // ファイル検証
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      try {
        // 画像圧縮（モック）
        const { file: compressedFile, thumbnail } = await compressImage(file, options);
        
        // 実際のAPIでは、ここでサーバーにアップロード
        const mockUploadedImage: ItineraryImage = {
          id: `img_${Date.now()}_${i}`,
          itineraryItemId,
          url: URL.createObjectURL(compressedFile), // 実際はサーバーのURL
          thumbnailUrl: URL.createObjectURL(thumbnail), // 実際はサーバーのURL
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: compressedFile.size,
          width: 800, // 実際は画像読み込み後に取得
          height: 600,
          order: i,
          isMain: i === 0 && uploadedImages.length === 0,
          uploadedBy: 'current-user-id', // 実際は認証されたユーザーID
          uploadedAt: new Date(),
        };

        uploadedImages.push(mockUploadedImage);
        
        // アップロード進捗のシミュレーション
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error(`画像 "${file.name}" のアップロードに失敗しました`);
      }
    }

    return uploadedImages;
  },

  // URL画像の追加
  addImageFromUrl: async (
    itineraryItemId: string,
    imageUrl: string
  ): Promise<ItineraryImage> => {
    console.log('Mock: Adding image from URL:', imageUrl);
    
    // URL検証
    const validation = await validateImageUrl(imageUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 実際のAPIでは、サーバーでURL画像を取得・保存
    const mockImage: ItineraryImage = {
      id: `url_img_${Date.now()}`,
      itineraryItemId,
      url: imageUrl,
      thumbnailUrl: imageUrl, // 実際はサーバーでサムネイル生成
      originalFileName: 'image-from-url.jpg',
      mimeType: 'image/jpeg',
      fileSize: 0, // 実際はサーバーで取得
      width: 800,
      height: 600,
      order: 0,
      isMain: false,
      uploadedBy: 'current-user-id',
      uploadedAt: new Date(),
    };

    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockImage;
  },

  // 画像情報の更新
  updateImage: async (
    imageId: string,
    updates: Partial<ItineraryImage>
  ): Promise<ItineraryImage> => {
    console.log('Mock: Updating image:', imageId, updates);
    
    // 実際のAPIでは、サーバーの画像情報を更新
    const mockUpdatedImage: ItineraryImage = {
      id: imageId,
      itineraryItemId: 'mock-item-id',
      url: 'mock-url',
      thumbnailUrl: 'mock-thumbnail-url',
      originalFileName: 'mock-file.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024000,
      width: 800,
      height: 600,
      order: 0,
      isMain: false,
      uploadedBy: 'current-user-id',
      uploadedAt: new Date(),
      ...updates,
    };

    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return mockUpdatedImage;
  },

  // 画像の削除
  deleteImage: async (imageId: string): Promise<void> => {
    console.log('Mock: Deleting image:', imageId);
    
    // 実際のAPIでは、サーバーから画像を削除
    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  // 旅程アイテムの画像一覧取得
  getImages: async (itineraryItemId: string): Promise<ItineraryImage[]> => {
    console.log('Mock: Getting images for item:', itineraryItemId);
    
    // 実際のAPIでは、サーバーから画像一覧を取得
    const mockImages: ItineraryImage[] = [
      {
        id: 'mock-1',
        itineraryItemId,
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop',
        originalFileName: 'beautiful-mountain.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2048000,
        width: 800,
        height: 600,
        caption: '美しい山の景色',
        altText: '雪をかぶった山々の風景',
        order: 0,
        isMain: true,
        uploadedBy: 'user-1',
        uploadedAt: new Date(Date.now() - 86400000), // 1日前
      },
      {
        id: 'mock-2',
        itineraryItemId,
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=150&fit=crop',
        originalFileName: 'nature-lake.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1536000,
        width: 800,
        height: 600,
        caption: '静かな湖',
        order: 1,
        isMain: false,
        uploadedBy: 'user-1',
        uploadedAt: new Date(Date.now() - 43200000), // 12時間前
      },
    ];

    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockImages;
  },

  // 画像の並び順変更
  reorderImages: async (
    itineraryItemId: string,
    imageOrders: { imageId: string; order: number }[]
  ): Promise<void> => {
    console.log('Mock: Reordering images:', itineraryItemId, imageOrders);
    
    // 実際のAPIでは、サーバーで画像の並び順を更新
    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  // メイン画像の設定
  setMainImage: async (
    itineraryItemId: string,
    imageId: string
  ): Promise<void> => {
    console.log('Mock: Setting main image:', itineraryItemId, imageId);
    
    // 実際のAPIでは、サーバーでメイン画像を設定
    // API遅延のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 200));
  },
};

// アップロード進捗を監視するためのイベントタイプ
export interface UploadProgressEvent {
  imageId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// アップロード進捗の監視（モック）
export const createUploadProgress = () => {
  const listeners: ((event: UploadProgressEvent) => void)[] = [];

  return {
    on: (callback: (event: UploadProgressEvent) => void) => {
      listeners.push(callback);
    },
    off: (callback: (event: UploadProgressEvent) => void) => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    },
    emit: (event: UploadProgressEvent) => {
      listeners.forEach(callback => callback(event));
    },
  };
};