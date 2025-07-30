'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageUploader({
  onImagesSelected,
  maxFiles = 5,
  isOpen,
  onClose,
}: ImageUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ファイルが変更されたときにプレビューURLを更新
  useEffect(() => {
    // 古いURLをクリーンアップ
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // 新しいURLを作成
    const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newUrls);

    // クリーンアップ関数
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]); // previewUrls を依存配列から除外

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const totalFiles = selectedFiles.length + newFiles.length;
      
      if (totalFiles > maxFiles) {
        const remainingSlots = maxFiles - selectedFiles.length;
        const filesToAdd = newFiles.slice(0, remainingSlots);
        setSelectedFiles([...selectedFiles, ...filesToAdd]);
      } else {
        setSelectedFiles([...selectedFiles, ...newFiles]);
      }
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onImagesSelected(selectedFiles);
      setSelectedFiles([]);
      setPreviewUrls([]);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">画像を追加</h3>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {selectedFiles.length === 0 ? (
            /* アップロードオプション */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">カメラ</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">ギャラリー</span>
              </button>
            </div>
          ) : (
            /* 選択された画像のプレビュー */
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">選択された画像 ({selectedFiles.length}枚)</h4>
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={previewUrls[index]}
                      alt={`選択画像 ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 追加で画像を選択するボタン */}
              {selectedFiles.length < maxFiles && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">カメラで追加</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">ギャラリーから追加</span>
                  </button>
                </div>
              )}
              
              {/* アップロードとキャンセルボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  アップロード ({selectedFiles.length}枚)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}