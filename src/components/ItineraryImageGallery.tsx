'use client';

import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Grid3x3, List, Eye } from 'lucide-react';
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
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentDisplayMode, setCurrentDisplayMode] = useState(displayMode);
  const [loadedImages, setLoadedImages] = useState<ItineraryImage[]>(images);
  const [isLoading, setIsLoading] = useState(true);

  // 画像を取得
  useEffect(() => {
    const fetchImages = async () => {
      if (!itineraryItemId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedImages = await imageApi.getImages(itineraryItemId);
        setLoadedImages(fetchedImages || []);
        if (onImagesChange) {
          onImagesChange(fetchedImages || []);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
        setLoadedImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [itineraryItemId]);

  const displayImages = loadedImages || [];

  // デバッグ用ログ
  console.log('ItineraryImageGallery debug:', {
    loadedImages,
    displayImages,
    isLoading,
    itineraryItemId
  });

  const handleImagesSelected = async (files: File[]) => {
    try {
      const uploadedImages = await imageApi.uploadImages(itineraryItemId, files);
      const updatedImages = [...displayImages, ...uploadedImages];
      setLoadedImages(updatedImages);
      
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('画像のアップロードに失敗しました');
    }
  };

  const handleUrlAdded = async (url: string) => {
    // URL画像の追加はAPIにない機能なので、とりあえず無効化
    console.log('URL画像の追加は現在サポートされていません:', url);
    alert('URL画像の追加は現在サポートされていません');
  };


  const handleImageDelete = async (imageId: string) => {
    try {
      await imageApi.deleteImage(imageId);
      const filteredImages = displayImages.filter(img => img.id !== imageId);
      setLoadedImages(filteredImages);
      
      if (onImagesChange) {
        onImagesChange(filteredImages);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('画像の削除に失敗しました');
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setShowViewer(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">画像を読み込み中...</div>
      </div>
    );
  }

  if (displayImages.length === 0 && !canEdit) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 表示モード切替 */}
      {displayImages.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDisplayMode('thumbnail')}
            className={`p-1 rounded ${
              currentDisplayMode === 'thumbnail'
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="サムネイル表示"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDisplayMode('grid')}
            className={`p-1 rounded ${
              currentDisplayMode === 'grid'
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="グリッド表示"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 画像表示 */}
      <div className={`${
        currentDisplayMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
          : currentDisplayMode === 'thumbnail'
          ? 'flex gap-2 overflow-x-auto pb-2'
          : 'space-y-2'
      }`}>
        {Array.isArray(displayImages) && displayImages.map((image, index) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer ${
              currentDisplayMode === 'thumbnail'
                ? 'flex-shrink-0 w-20 h-20'
                : currentDisplayMode === 'grid'
                ? 'aspect-square'
                : 'w-full h-48'
            }`}
            onClick={() => openViewer(index)}
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt={image.altText || image.caption || '旅程画像'}
              className="w-full h-full object-cover rounded-lg border border-gray-200"
              loading="lazy"
            />
            
            {/* メイン画像バッジ */}
            {image.isMain && (
              <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1 py-0.5 rounded">
                メイン
              </div>
            )}

            {/* ホバーオーバーレイ */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* キャプション（フル表示時） */}
            {currentDisplayMode === 'full' && image.caption && (
              <p className="mt-1 text-sm text-gray-600">{image.caption}</p>
            )}
          </div>
        ))}
        
        {/* 画像追加ボタン */}
        {canEdit && (
          <div
            onClick={() => setShowUploader(true)}
            className={`border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors flex items-center justify-center ${
              currentDisplayMode === 'thumbnail'
                ? 'flex-shrink-0 w-20 h-20'
                : currentDisplayMode === 'grid'
                ? 'aspect-square'
                : 'w-full h-48'
            }`}
          >
            <div className="text-center">
              <Plus className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              {currentDisplayMode !== 'thumbnail' && (
                <p className="text-xs text-gray-500">追加</p>
              )}
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

      <ImageViewer
        images={Array.isArray(displayImages) ? displayImages : []}
        initialIndex={viewerIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onDelete={canEdit ? handleImageDelete : undefined}
      />

    </div>
  );
}