import { ItineraryImage, ImageUploadOptions } from '@/types';

// 画像ファイルの検証
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'サポートされていないファイル形式です。JPEG、PNG、WebP、GIFのみ対応しています。',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。',
    };
  }

  return { valid: true };
};

// 画像の圧縮とリサイズ
export const compressImage = async (
  file: File,
  options: ImageUploadOptions
): Promise<{ file: File; thumbnail: File }> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // 元画像のリサイズ
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth || 1920,
          options.maxHeight || 1080
        );

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // 品質設定
        const quality = options.quality === 'high' ? 0.9 : options.quality === 'low' ? 0.6 : 0.8;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('画像の圧縮に失敗しました'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            // サムネイル生成
            const thumbCanvas = document.createElement('canvas');
            const thumbCtx = thumbCanvas.getContext('2d');
            const thumbSize = 200;
            
            thumbCanvas.width = thumbSize;
            thumbCanvas.height = thumbSize;
            
            // アスペクト比を保持してサムネイル作成
            const scale = Math.min(thumbSize / img.width, thumbSize / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (thumbSize - scaledWidth) / 2;
            const y = (thumbSize - scaledHeight) / 2;
            
            thumbCtx?.drawImage(img, x, y, scaledWidth, scaledHeight);

            thumbCanvas.toBlob(
              (thumbBlob) => {
                if (!thumbBlob) {
                  reject(new Error('サムネイルの生成に失敗しました'));
                  return;
                }

                const thumbnailFile = new File([thumbBlob], `thumb_${file.name}`, {
                  type: file.type,
                  lastModified: Date.now(),
                });

                resolve({
                  file: compressedFile,
                  thumbnail: thumbnailFile,
                });
              },
              file.type,
              0.8
            );
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
};

// 画像サイズの計算
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  
  if (ratio >= 1) {
    return { width: originalWidth, height: originalHeight };
  }

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
};

// URL画像の検証
export const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return { valid: false, error: 'URLにアクセスできません' };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return { valid: false, error: '画像ファイルではありません' };
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return { valid: false, error: 'ファイルサイズが大きすぎます' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'URLの検証に失敗しました' };
  }
};

// ファイルサイズの人間が読める形式への変換
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 画像の並び順変更
export const reorderImages = (
  images: ItineraryImage[],
  fromIndex: number,
  toIndex: number
): ItineraryImage[] => {
  const result = Array.from(images);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // order値を更新
  return result.map((image, index) => ({
    ...image,
    order: index,
  }));
};

// メイン画像の設定
export const setMainImage = (images: ItineraryImage[], imageId: string): ItineraryImage[] => {
  return images.map((image) => ({
    ...image,
    isMain: image.id === imageId,
  }));
};

// 画像の遅延読み込み用のプレースホルダー生成
export const generateImagePlaceholder = (width: number, height: number): string => {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="${Math.min(width, height) / 10}">
        読み込み中...
      </text>
    </svg>`
  )}`;
};