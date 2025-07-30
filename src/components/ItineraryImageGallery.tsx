'use client';

import { useState } from 'react';
import { Plus, Eye, Grid3x3, Minimize2 } from 'lucide-react';
import { ItineraryImage } from '@/types';
import ImageUploader from './ImageUploader';
import ImageViewer from './ImageViewer';
import { imageApi } from '@/services/imageApi';

interface ItineraryImageGalleryProps {
  images: ItineraryImage[];
  itineraryItemId: string;
  displayMode?: 'thumbnail' | 'full' | 'grid';
  canEdit?: boolean;
  onImagesChange?: (images: ItineraryImage[]) => void;
}

export default function ItineraryImageGallery({
  images = [],
  itineraryItemId,
  displayMode = 'thumbnail',
  canEdit = false,
  onImagesChange,
}: ItineraryImageGalleryProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isCompact, setIsCompact] = useState(true);

  const handleImagesSelected = async (files: File[]) => {
    try {
      const uploadedImages = await imageApi.uploadImages(itineraryItemId, files);
      if (uploadedImages.length > 0 && onImagesChange) {
        const updatedImages = [...images, ...uploadedImages];
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('画像のアップロードに失敗しました');
    }
  };

  const handleUrlAdded = async (url: string) => {
    console.log('URL画像の追加は現在サポートされていません:', url);
    alert('URL画像の追加は現在サポートされていません');
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      await imageApi.deleteImage(imageId);
      const filteredImages = images.filter(img => img.id !== imageId);
      if (onImagesChange) {
        onImagesChange(filteredImages);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('画像の削除に失敗しました');
    }
  };

  const openViewer = () => {
    setShowViewer(true);
  };

  if (images.length === 0 && !canEdit) {
    return null;
  }

  // サイズとレイアウトの設定
  const imageSize = isCompact ? 'w-16 h-16' : 'w-24 h-24';
  const eyeSize = isCompact ? 'w-4 h-4' : 'w-6 h-6';
  const plusSize = isCompact ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="space-y-2">
      {/* 表示切り替えボタン */}
      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title={isCompact ? "大きく表示" : "小さく表示"}
          >
            {isCompact ? <Grid3x3 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 max-w-full">
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
      </div>

      {/* モーダルコンポーネント */}
      <ImageUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onImagesSelected={handleImagesSelected}
        onUrlAdded={handleUrlAdded}
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