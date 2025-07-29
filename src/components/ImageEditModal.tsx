'use client';

import { useState } from 'react';
import { X, RotateCw, Crop, Palette, Save } from 'lucide-react';
import { ItineraryImage } from '@/types';

interface ImageEditModalProps {
  image: ItineraryImage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<ItineraryImage>) => void;
}

export default function ImageEditModal({
  image,
  isOpen,
  onClose,
  onSave,
}: ImageEditModalProps) {
  const [caption, setCaption] = useState(image.caption || '');
  const [altText, setAltText] = useState(image.altText || '');
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      caption: caption.trim() || undefined,
      altText: altText.trim() || undefined,
      // 実際の実装では、rotation, brightness等の編集情報も保存
    });
    onClose();
  };

  const resetAdjustments = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const imageStyle = {
    transform: `rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">画像を編集</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex">
          {/* プレビューエリア */}
          <div className="flex-1 p-6 bg-gray-50">
            <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
              <img
                src={image.url}
                alt={image.altText || image.caption || '編集中の画像'}
                className="max-w-full max-h-full object-contain"
                style={imageStyle}
              />
            </div>
          </div>

          {/* 編集パネル */}
          <div className="w-80 p-4 bg-white border-l overflow-y-auto">
            <div className="space-y-6">
              {/* 基本情報 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">基本情報</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      キャプション
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="画像の説明を入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代替テキスト
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="アクセシビリティ用"
                    />
                  </div>
                </div>
              </div>

              {/* 回転 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  回転
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((prev) => prev - 90)}
                    className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    左90°
                  </button>
                  <button
                    onClick={() => setRotation((prev) => prev + 90)}
                    className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    右90°
                  </button>
                </div>
              </div>

              {/* 色調整 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  色調整
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      明度: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      コントラスト: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      彩度: {saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={resetAdjustments}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    リセット
                  </button>
                </div>
              </div>

              {/* ファイル情報 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ファイル情報</h4>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>ファイル名: {image.originalFileName}</p>
                  <p>サイズ: {(image.fileSize / 1024 / 1024).toFixed(1)}MB</p>
                  <p>解像度: {image.width} × {image.height}</p>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3 pt-6 border-t mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}