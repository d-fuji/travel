'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { Travel } from '@/types';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface EditTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  travel: Travel | null;
}

export default function EditTravelModal({ isOpen, onClose, travel }: EditTravelModalProps) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { updateTravel, deleteTravel } = useTravelStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (travel) {
      setName(travel.name);
      setDestination(travel.destination);
      setStartDate(travel.startDate.toISOString().split('T')[0]);
      setEndDate(travel.endDate.toISOString().split('T')[0]);
    }
  }, [travel]);

  if (!isOpen || !travel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !destination.trim() || !startDate || !endDate) return;

    try {
      await updateTravel(travel.id, {
        name: name.trim(),
        destination: destination.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      onClose();
    } catch (error) {
      console.error('Failed to update travel:', error);
    }
  };

  const handleDeleteTravel = async () => {
    if (!travel) return;
    
    try {
      await deleteTravel(travel.id);
      setShowDeleteConfirm(false);
      onClose();
      // 旅行削除後は一覧画面に戻る
      window.location.href = '/';
    } catch (error: any) {
      // エラーメッセージを表示
      if (error.response?.status === 403) {
        alert('旅行を削除する権限がありません。作成者のみ削除できます。');
      } else if (error.response?.status === 404) {
        alert('旅行が見つかりません');
      } else {
        alert('旅行の削除に失敗しました');
      }
    }
  };

  const isCreator = user?.id === travel.createdBy;

  return (
    <>
      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">旅行を削除</h3>
                <p className="text-sm text-gray-600">この操作は取り消せません</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              旅行「{travel?.name}」を削除しますか？<br />
              <span className="text-sm text-gray-500">関連する旅程表や行きたい場所のデータもすべて削除されます。</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteTravel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メインモーダル */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">旅行を編集</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: 沖縄旅行"
              required
              disabled={!isCreator}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目的地
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: 沖縄県"
              required
              disabled={!isCreator}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出発日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                required
                disabled={!isCreator}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                帰着日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                min={startDate}
                required
                disabled={!isCreator}
              />
            </div>
          </div>

          {!isCreator && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                旅行の編集は旅行作成者のみが可能です。
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {isCreator && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!isCreator}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              更新
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}