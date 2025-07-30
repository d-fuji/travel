'use client';

import { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { ItineraryImage } from '@/types';
import ImageUploader from './ImageUploader';
import ImageViewer from './ImageViewer';
import { imageApi } from '@/services/imageApi';
import { useTravelStore } from '@/stores/travelStore';

interface ItineraryImageGalleryProps {
  images: ItineraryImage[];
  itineraryItemId: string;
  travelId: string;
  displayMode?: 'thumbnail' | 'full' | 'grid';
  canEdit?: boolean;
  onImagesChange?: (images: ItineraryImage[]) => void;
}

export default function ItineraryImageGallery({
  images = [],
  itineraryItemId,
  travelId,
  displayMode = 'thumbnail',
  canEdit = false,
  onImagesChange,
}: ItineraryImageGalleryProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const { fetchItineraryItems } = useTravelStore();

  const handleImagesSelected = async (files: File[]) => {
    try {
      const uploadedImages = await imageApi.uploadImages(itineraryItemId, files);
      if (uploadedImages.length > 0) {
        // 旅程データを再取得してすべてのデータを最新に更新
        await fetchItineraryItems(travelId);
        
        if (onImagesChange) {
          const updatedImages = [...images, ...uploadedImages];
          onImagesChange(updatedImages);
        }
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('画像のアップロードに失敗しました');
    }
  };


  const handleImageDelete = async (imageId: string) => {
    try {
      await imageApi.deleteImage(imageId);
      
      // 旅程データを再取得してすべてのデータを最新に更新
      await fetchItineraryItems(travelId);
      
      const filteredImages = images.filter(img => img.id !== imageId);
      if (onImagesChange) {
        onImagesChange(filteredImages);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('画像の削除に失敗しました');
    }
  };

  if (images.length === 0 && !canEdit) {
    return null;
  }

  // コンパクトサイズ固定
  const imageSize = 'w-16 h-16';
  const eyeSize = 'w-4 h-4';
  const plusSize = 'w-4 h-4';

  return (
    <div className="grid grid-cols-[repeat(auto-fit,4rem)] gap-1 justify-start max-w-full">
        {/* 画像表示 */}
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer flex-shrink-0 ${imageSize}`}
            onClick={() => {
              setShowViewer(true);
            }}
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt={image.altText || image.caption || '旅程画像'}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              loading="lazy"
            />
            
            {/* ホバーオーバーレイ */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
              <Eye className={`${eyeSize} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          </div>
        ))}
      
        {/* 画像追加ボタン */}
        {canEdit && (
          <div
            onClick={() => setShowUploader(true)}
            className={`border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors flex items-center justify-center flex-shrink-0 ${imageSize}`}
          >
            <div className="text-center">
              <Plus className={`${plusSize} text-gray-400 mx-auto`} />
            </div>
          </div>
        )}

      {/* モーダルコンポーネント */}
      <ImageUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onImagesSelected={handleImagesSelected}
        maxFiles={5}
      />

      {images.length > 0 && (
        <ImageViewer
          images={images}
          initialIndex={0}
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          onDelete={canEdit ? handleImageDelete : undefined}
        />
      )}
    </div>
  );
}