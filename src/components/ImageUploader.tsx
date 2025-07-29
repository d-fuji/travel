'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Link, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onUrlAdded: (url: string) => void;
  maxFiles?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageUploader({
  onImagesSelected,
  onUrlAdded,
  maxFiles = 5,
  isOpen,
  onClose,
}: ImageUploaderProps) {
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files).slice(0, maxFiles);
      onImagesSelected(fileArray);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlAdded(urlInput.trim());
      setUrlInput('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">画像を追加</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* ドラッグ&ドロップエリア */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              画像をドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-500">
              または下のボタンで選択してください
            </p>
          </div>

          {/* アップロードオプション */}
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

          {/* URL入力 */}
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-2 border-t border-gray-200">
              <Link className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">URLから追加</span>
            </div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="画像のURLを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              URLから追加
            </button>
          </form>
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
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}