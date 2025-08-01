'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { Plus, ArrowRight, Edit2, Trash2, X } from 'lucide-react';

interface WishlistPanelProps {
  travelId: string;
}

export default function WishlistPanel({ travelId }: WishlistPanelProps) {
  const {
    wishlistItems,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    moveWishlistToItinerary,
    fetchWishlistItems,
  } = useTravelStore();
  const { user } = useAuthStore();

  // Fetch wishlist items for this travel
  useEffect(() => {
    fetchWishlistItems(travelId);
  }, [travelId, fetchWishlistItems]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const items = wishlistItems.filter((item) => item.travelId === travelId);
  const myItems = items.filter((item) => item.addedBy === user?.id);
  const sharedItems = items.filter(
    (item) => item.isShared && item.addedBy !== user?.id
  );

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;

    try {
      await addWishlistItem({
        name: newItemName,
        description: newItemDescription,
        travelId,
        isShared: false,
      });

      setNewItemName('');
      setNewItemDescription('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Wishlist add error:', error);
      
      let errorMessage = '行きたい場所の追加に失敗しました。';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data?: any; status?: number } };
        
        if (apiError.response?.status === 401) {
          errorMessage = '認証が無効です。再度ログインしてください。';
        } else if (apiError.response?.status === 403) {
          errorMessage = 'この操作を実行する権限がありません。';
        } else if (apiError.response?.status === 400) {
          const validationErrors = apiError.response.data?.message;
          if (Array.isArray(validationErrors)) {
            errorMessage = `入力エラー: ${validationErrors.join(', ')}`;
          } else if (typeof validationErrors === 'string') {
            errorMessage = `入力エラー: ${validationErrors}`;
          }
        } else if (apiError.response?.data?.message) {
          errorMessage = `エラー: ${apiError.response.data.message}`;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `エラー: ${(error as Error).message}`;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">行きたい場所</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* My Wishlist */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
            <h3 className="font-semibold text-gray-900">
              あなたの行きたい場所
            </h3>
          </div>
          <div className="p-4">
            {myItems.length > 0 ? (
              <div className="space-y-3">
                {myItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onMoveToItinerary={(_date, _period) =>
                      moveWishlistToItinerary(item.id, _date, _period)
                    }
                    onEdit={() => setEditingItem(item)}
                    showMoveButton={true}
                    showEditButton={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                まだ行きたい場所がありません
              </p>
            )}
          </div>
        </div>

        {/* Shared Wishlist */}
        {sharedItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border">
            <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
              <h3 className="font-semibold text-gray-900">
                メンバーの行きたい場所
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {sharedItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onMoveToItinerary={(_date, _period) =>
                      moveWishlistToItinerary(item.id, _date, _period)
                    }
                    showMoveButton={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              行きたい場所を追加
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="場所名"
                required
              />

              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="メモ（任意）"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItemName('');
                    setNewItemDescription('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <EditWishlistModal
          item={editingItem}
          onSave={async (name, description) => {
            try {
              await updateWishlistItem(editingItem.id, {
                name,
                description: description || undefined,
              });
              setEditingItem(null);
            } catch (error) {
              alert('更新に失敗しました');
            }
          }}
          onCancel={() => setEditingItem(null)}
          onDelete={async () => {
            try {
              await deleteWishlistItem(editingItem.id);
              setEditingItem(null);
            } catch (error) {
              alert('削除に失敗しました');
            }
          }}
        />
      )}
    </div>
  );

  interface WishlistItemCardProps {
    item: any;
    onMoveToItinerary: (
      _date: string,
      _period: 'morning' | 'afternoon' | 'evening'
    ) => void;
    onEdit?: () => void;
    showMoveButton?: boolean;
    showEditButton?: boolean;
  }

  function WishlistItemCard({
    item,
    onMoveToItinerary,
    onEdit,
    showMoveButton,
    showEditButton,
  }: WishlistItemCardProps) {
    const [showMoveModal, setShowMoveModal] = useState(false);

    return (
      <>
        <div className="bg-gray-50 p-4 rounded-xl border group hover:bg-gray-100 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-3">
              {showEditButton && onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="編集"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {showMoveButton && (
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="旅程に追加"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {showMoveModal && (
          <MoveToItineraryModal
            onMove={onMoveToItinerary}
            onClose={() => setShowMoveModal(false)}
          />
        )}
      </>
    );
  }

  interface MoveToItineraryModalProps {
    onMove: (_date: string, _period: 'morning' | 'afternoon' | 'evening') => void;
    onClose: () => void;
  }

  function MoveToItineraryModal({ onMove, onClose }: MoveToItineraryModalProps) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<
      'morning' | 'afternoon' | 'evening'
    >('morning');

    const periods = [
      { key: 'morning' as const, label: '午前' },
      { key: 'afternoon' as const, label: '午後' },
      { key: 'evening' as const, label: '夜' },
    ];

    const handleMove = () => {
      if (selectedDate) {
        onMove(selectedDate, selectedPeriod);
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">旅程に追加</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付を選択
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時間帯を選択
              </label>
              <div className="grid grid-cols-3 gap-2">
                {periods.map((period) => (
                  <button
                    key={period.key}
                    type="button"
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${selectedPeriod === period.key
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleMove}
                disabled={!selectedDate}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  interface EditWishlistModalProps {
    item: any;
    onSave: (name: string, description: string) => void;
    onCancel: () => void;
    onDelete: () => void;
  }

  function EditWishlistModal({ item, onSave, onCancel, onDelete }: EditWishlistModalProps) {
    const [name, setName] = useState(item.name);
    const [description, setDescription] = useState(item.description || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      onSave(name, description);
    };

    const handleDelete = () => {
      if (showDeleteConfirm) {
        onDelete();
      } else {
        setShowDeleteConfirm(true);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-gray-900 mb-4 pr-10">
            行きたい場所を編集
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="場所名"
              required
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="メモ（任意）"
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  showDeleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {showDeleteConfirm ? '削除実行' : '削除'}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
