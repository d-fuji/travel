'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, ChevronLeft, ChevronRight, RotateCw, Download } from 'lucide-react';
import { ItineraryImage } from '@/types';

interface ImageViewerProps {
  images: ItineraryImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (image: ItineraryImage) => void;
  onDelete?: (imageId: string) => void;
}

export default function ImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // バックグラウンドスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      // iPhone Safariでの追加対策
      const preventDefault = (e: Event) => {
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventDefault, { passive: false });
      document.addEventListener('wheel', preventDefault, { passive: false });
      
      return () => {
        // クリーンアップ
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        document.removeEventListener('touchmove', preventDefault);
        document.removeEventListener('wheel', preventDefault);
      };
    }
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') onClose();
  };

  // フリック判定のための最小距離
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // ドラッグオフセットを計算（画面幅の割合として）
    const offset = currentTouch - touchStart;
    const maxOffset = window.innerWidth * 0.3; // 最大30%まで移動
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
    setDragOffset(clampedOffset);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    setDragOffset(0);
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (images.length > 1) {
      if (isLeftSwipe) {
        nextImage(); // 左フリックで次の画像
      } else if (isRightSwipe) {
        prevImage(); // 右フリックで前の画像
      }
    }

    // リセット
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={() => setShowControls(!showControls)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* ナビゲーション（複数画像の場合） */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 画像表示 */}
      <div 
        className="relative w-full h-full p-2 md:p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className={`w-full h-full ${isDragging ? '' : 'transition-transform duration-200'}`}
          style={{ 
            transform: `translateX(${dragOffset}px)`,
            opacity: isDragging ? Math.max(0.5, 1 - Math.abs(dragOffset) / (window.innerWidth * 0.3)) : 1
          }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.altText || currentImage.caption || '画像'}
            className="w-full h-full max-w-full max-h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* フリック方向のインジケーター */}
        {isDragging && Math.abs(dragOffset) > 20 && (
          <div className={`absolute top-1/2 -translate-y-1/2 text-white text-opacity-70 text-sm ${
            dragOffset > 0 ? 'left-4' : 'right-4'
          }`}>
            {dragOffset > 0 ? '← 前の画像' : '次の画像 →'}
          </div>
        )}

        {/* 画像情報 */}
        {currentImage.caption && (
          <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="text-sm">{currentImage.caption}</p>
          </div>
        )}
      </div>

      {/* コントロールバー */}
      <div className={`absolute top-4 left-4 right-16 flex items-center justify-between transition-all ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-xs text-gray-300">
            {currentImage.originalFileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(currentImage);
              }}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg"
              title="編集"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              // ダウンロード機能（モック）
              console.log('Download image:', currentImage.originalFileName);
            }}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg"
            title="ダウンロード"
          >
            <Download className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('この画像を削除しますか？')) {
                  onDelete(currentImage.id);
                }
              }}
              className="p-2 text-white hover:bg-red-500 hover:bg-opacity-20 rounded-lg"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* サムネイル（複数画像の場合） */}
      {images.length > 1 && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 transition-all ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white'
                  : 'border-transparent hover:border-gray-400'
              }`}
            >
              <img
                src={image.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}