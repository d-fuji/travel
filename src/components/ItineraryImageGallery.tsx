'use client';

import { useState } from 'react';
import { Plus, Image as ImageIcon, Grid3x3, List, Eye } from 'lucide-react';
import { ItineraryImage } from '@/types';
import ImageUploader from './ImageUploader';
import ImageViewer from './ImageViewer';

interface ItineraryImageGalleryProps {
  images: ItineraryImage[];
  displayMode?: 'thumbnail' | 'full' | 'grid';
  canEdit?: boolean;
  onImagesChange?: (images: ItineraryImage[]) => void;
}

export default function ItineraryImageGallery({
  images = [],
  displayMode = 'thumbnail',
  canEdit = false,
  onImagesChange,
}: ItineraryImageGalleryProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentDisplayMode, setCurrentDisplayMode] = useState(displayMode);

  // モック画像データ（実際のAPIが無い間の表示用）
  const mockImages: ItineraryImage[] = images.length > 0 ? images : [
    {
      id: 'mock-1',
      itineraryItemId: 'item-1',
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
      uploadedAt: new Date(),
    },
    {
      id: 'mock-2',
      itineraryItemId: 'item-1',
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
      uploadedAt: new Date(),
    },
  ];

  const displayImages = mockImages;

  const handleImagesSelected = (files: File[]) => {
    // 実際のAPIでは、ここでファイルアップロードを行う
    console.log('Selected files:', files);
    // モック: ファイルを画像オブジェクトに変換
    const newImages = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      itineraryItemId: 'current-item-id',
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      originalFileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      width: 0, // 実際のAPIでは画像読み込み後に設定
      height: 0,
      order: displayImages.length + index,
      isMain: displayImages.length === 0 && index === 0,
      uploadedBy: 'current-user-id',
      uploadedAt: new Date(),
    }));
    
    if (onImagesChange) {
      onImagesChange([...displayImages, ...newImages]);
    }
  };

  const handleUrlAdded = (url: string) => {
    // 実際のAPIでは、URLから画像情報を取得
    console.log('Added URL:', url);
    const newImage: ItineraryImage = {
      id: `url-${Date.now()}`,
      itineraryItemId: 'current-item-id',
      url: url,
      thumbnailUrl: url,
      originalFileName: 'image-from-url',
      mimeType: 'image/jpeg',
      fileSize: 0,
      width: 0,
      height: 0,
      order: displayImages.length,
      isMain: displayImages.length === 0,
      uploadedBy: 'current-user-id',
      uploadedAt: new Date(),
    };
    
    if (onImagesChange) {
      onImagesChange([...displayImages, newImage]);
    }
  };


  const handleImageDelete = (imageId: string) => {
    console.log('Delete image:', imageId);
    if (onImagesChange) {
      const filteredImages = displayImages.filter(img => img.id !== imageId);
      onImagesChange(filteredImages);
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setShowViewer(true);
  };

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
        {displayImages.map((image, index) => (
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

      {/* 画像がない場合の初期表示 */}
      {displayImages.length === 0 && canEdit && (
        <div 
          onClick={() => setShowUploader(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">画像を追加</p>
          <p className="text-xs text-gray-500">クリックして画像をアップロード</p>
        </div>
      )}

      {/* モーダルコンポーネント */}
      <ImageUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onImagesSelected={handleImagesSelected}
        onUrlAdded={handleUrlAdded}
        maxFiles={5}
      />

      <ImageViewer
        images={displayImages}
        initialIndex={viewerIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onDelete={canEdit ? handleImageDelete : undefined}
      />

    </div>
  );
}