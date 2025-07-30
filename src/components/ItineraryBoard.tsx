'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { ItineraryItem, Expense } from '@/types';
import { Plus, Edit2, Trash2, Clock, MapPin, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import ItineraryImageGallery from './ItineraryImageGallery';

interface ItineraryBoardProps {
  travelId: string;
  startDate: Date;
  endDate: Date;
}

export default function ItineraryBoard({
  travelId,
  startDate,
  endDate,
}: ItineraryBoardProps) {
  const {
    itineraryItems,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    fetchItineraryItems,
    expenses,
    fetchExpenses,
  } = useTravelStore();
  const { user, isGuest } = useAuthStore();

  // Fetch itinerary items and expenses for this travel
  useEffect(() => {
    fetchItineraryItems(travelId);
    fetchExpenses(travelId);
  }, [travelId, fetchItineraryItems, fetchExpenses]);

  // Debug: itinerary itemsの内容を確認
  useEffect(() => {
    if (itineraryItems.length > 0) {
      console.log('Itinerary items loaded:', itineraryItems);
      console.log('First item images:', itineraryItems[0]?.images);
    }
  }, [itineraryItems]);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{
    date: string;
    period: 'morning' | 'afternoon' | 'evening';
  } | null>(null);
  const [expenseModalItem, setExpenseModalItem] = useState<ItineraryItem | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ItineraryItem | null>(null);

  // Generate date range
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const periods = [
    { key: 'morning' as const, label: '午前', icon: '🌅' },
    { key: 'afternoon' as const, label: '午後', icon: '☀️' },
    { key: 'evening' as const, label: '夜', icon: '🌙' },
  ];

  const getItemsForDatePeriod = (
    date: Date,
    period: 'morning' | 'afternoon' | 'evening'
  ) => {
    const dateStr = date.toISOString().split('T')[0];
    const filteredItems = itineraryItems.filter(
      (item) =>
        item.travelId === travelId &&
        item.date === dateStr &&
        item.period === period
    );

    // Sort by start time, putting items without start time at the end
    return filteredItems.sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const getExpensesForItineraryItem = (itemId: string) => {
    return expenses.filter(expense => expense.itineraryItemId === itemId);
  };

  const handleAddItem = (
    date: Date,
    period: 'morning' | 'afternoon' | 'evening'
  ) => {
    setNewItem({
      date: date.toISOString().split('T')[0],
      period,
    });
  };

  const handleSaveNewItem = (formData: {
    title: string;
    description: string;
    location: string;
    locationUrl?: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!user || !newItem) return;

    addItineraryItem({
      ...formData,
      date: newItem.date,
      period: newItem.period,
      travelId,
    });

    setNewItem(null);
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const toggleDateCollapse = (dateStr: string) => {
    const newCollapsed = new Set(collapsedDates);
    if (newCollapsed.has(dateStr)) {
      newCollapsed.delete(dateStr);
    } else {
      newCollapsed.add(dateStr);
    }
    setCollapsedDates(newCollapsed);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">旅程</h2>

      <div className="space-y-6">
        {dates.map((date, dateIndex) => {
          const dateStr = date.toISOString().split('T')[0];
          const isCollapsed = collapsedDates.has(dateStr);

          return (
            <div
              key={dateIndex}
              className="bg-white rounded-2xl shadow-sm border"
            >
              <div
                className={`p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isCollapsed
                  ? 'rounded-2xl'
                  : 'border-b rounded-t-2xl'
                  }`}
                onClick={() => toggleDateCollapse(dateStr)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {formatDateHeader(date)}
                  </h3>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-4">
                  {periods.map((period) => {
                    const items = getItemsForDatePeriod(date, period.key);

                    return (
                      <div
                        key={period.key}
                        className="border-l-4 border-gray-200 pl-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <span>{period.icon}</span>
                            {period.label}
                          </h4>
                          {!isGuest && (
                            <button
                              onClick={() => handleAddItem(date, period.key)}
                              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {items.map((item) => {
                            const itemExpenses = getExpensesForItineraryItem(item.id);
                            return (
                              <ItineraryItemCard
                                key={item.id}
                                item={item}
                                expenses={itemExpenses}
                                travelId={travelId}
                                isEditing={editingItem === item.id}
                                canEdit={!isGuest}
                                onEdit={() => setEditingItem(item.id)}
                                onSave={(_updates) => {
                                  updateItineraryItem(item.id, _updates);
                                  setEditingItem(null);
                                }}
                                onCancel={() => setEditingItem(null)}
                                onDelete={() => setDeleteConfirmItem(item)}
                                onAddExpense={(item) => setExpenseModalItem(item)}
                              />
                            );
                          })}

                          {items.length === 0 && (
                            <p className="text-sm text-gray-500 italic">予定なし</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {newItem && (
        <AddItemModal
          onSave={handleSaveNewItem}
          onCancel={() => setNewItem(null)}
        />
      )}

      {expenseModalItem && (
        <AddExpenseFromItineraryModal
          itineraryItem={expenseModalItem}
          travelId={travelId}
          onClose={() => setExpenseModalItem(null)}
        />
      )}

      {deleteConfirmItem && (
        <DeleteConfirmModal
          item={deleteConfirmItem}
          onConfirm={() => {
            deleteItineraryItem(deleteConfirmItem.id);
            setDeleteConfirmItem(null);
          }}
          onCancel={() => setDeleteConfirmItem(null)}
        />
      )}
    </div>
  );
}

interface ItineraryItemCardProps {
  item: ItineraryItem;
  expenses: Expense[];
  travelId: string;
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: (_updates: Partial<ItineraryItem>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddExpense?: (item: ItineraryItem) => void;
}

function ItineraryItemCard({
  item,
  expenses,
  travelId,
  isEditing,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddExpense,
}: ItineraryItemCardProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [location, setLocation] = useState(item.location || '');
  const [locationUrl, setLocationUrl] = useState(item.locationUrl || '');
  const [startTime, setStartTime] = useState(item.startTime || '');
  const [endTime, setEndTime] = useState(item.endTime || '');

  if (isEditing) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg border">
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1 text-base border rounded"
            placeholder="タイトル"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1 text-base border rounded resize-none"
            rows={2}
            placeholder="説明"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-2 py-1 text-base border rounded"
            placeholder="場所"
          />
          <input
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            className="w-full px-2 py-1 text-base border rounded"
            placeholder="場所のURL（任意）"
            type="url"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 px-2 py-1 text-base border rounded"
            />
            <span className="text-sm text-gray-500 self-center">〜</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 px-2 py-1 text-base border rounded"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() =>
              onSave({
                title,
                description,
                location,
                locationUrl: locationUrl.trim() || undefined,
                startTime,
                endTime
              })
            }
            className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-2 rounded-lg border group hover:bg-gray-100 transition-colors relative">
      <div className="w-full">
        {/* 右上のボタン群 */}
        {canEdit && (
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAddExpense && (
              <button
                onClick={() => onAddExpense(item)}
                className="p-1 text-gray-500 hover:text-green-600"
                title="費用を記録"
              >
                <Wallet className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1 text-gray-500 hover:text-primary-600"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="pr-12">
          <h5 className="font-medium text-gray-900">{item.title}</h5>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {(item.startTime || item.endTime) && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {item.startTime && item.endTime
                    ? `${item.startTime} - ${item.endTime}`
                    : item.startTime || item.endTime}
                </span>
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.locationUrl ? (
                  <a
                    href={item.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 underline"
                  >
                    {item.location}
                  </a>
                ) : (
                  <span>{item.location}</span>
                )}
              </div>
            )}
          </div>
          {expenses.length > 0 && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              💰 ¥{expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
            </div>
          )}
        </div>

      </div>
      {/* 画像ギャラリー */}
      <div className="mt-3 overflow-hidden">
        <ItineraryImageGallery
          images={item.images || []}
          itineraryItemId={item.id}
          travelId={travelId}
          displayMode={item.imageDisplayMode || 'thumbnail'}
          canEdit={canEdit}
          onImagesChange={(images) => {
            onSave({ images });
          }}
        />
      </div>
    </div>
  );
}

interface AddItemModalProps {
  onSave: (_data: {
    title: string;
    description: string;
    location: string;
    locationUrl?: string;
    startTime: string;
    endTime: string;
  }) => void;
  onCancel: () => void;
}

function AddItemModal({ onSave, onCancel }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      location,
      locationUrl: locationUrl.trim() || undefined,
      startTime,
      endTime
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">予定を追加</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="タイトル"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="説明（任意）"
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="場所（任意）"
          />

          <input
            type="url"
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="場所のURL（任意）"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始時間
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了時間
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
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
  );
}

interface AddExpenseFromItineraryModalProps {
  itineraryItem: ItineraryItem;
  travelId: string;
  onClose: () => void;
}

function AddExpenseFromItineraryModal({
  itineraryItem,
  travelId,
  onClose,
}: AddExpenseFromItineraryModalProps) {
  const { user } = useAuthStore();
  const { categories, addExpense, groups, travels } = useTravelStore();

  const travel = travels.find(t => t.id === travelId);
  const group = groups.find(g => g.id === travel?.groupId);
  const groupMembers = group
    ? group.members.some(member => member.id === group.createdBy)
      ? group.members
      : [...group.members, { id: group.createdBy, name: 'オーナー', email: '' }]
    : [];

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [splitBetween, setSplitBetween] = useState<string[]>(
    groupMembers.map(member => member.id)
  );
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !paidBy || splitBetween.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        title: itineraryItem.title,
        categoryId,
        paidBy,
        splitBetween,
        splitMethod: 'equal',
        date: new Date(itineraryItem.date),
        memo: memo || itineraryItem.description || undefined,
        itineraryItemId: itineraryItem.id,
        travelId,
      });

      onClose();
    } catch (error) {
      console.error('Failed to add expense:', error);

      let errorMessage = '支出の追加に失敗しました。';

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
          } else {
            errorMessage = '入力内容に問題があります。各項目を確認してください。';
          }
        } else if (apiError.response?.data?.message) {
          errorMessage = `エラー: ${apiError.response.data.message}`;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `エラー: ${(error as Error).message}`;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplitBetweenChange = (memberId: string, checked: boolean) => {
    if (checked) {
      setSplitBetween([...splitBetween, memberId]);
    } else {
      setSplitBetween(splitBetween.filter(id => id !== memberId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          「{itineraryItem.title}」の費用を記録
        </h3>

        {itineraryItem.location && (
          <p className="text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 inline mr-1" />
            {itineraryItem.location}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金額 *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ¥
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="10000"
                required
                min="0"
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">カテゴリを選択</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支払者 *
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {groupMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分担対象者 *
            </label>
            <div className="space-y-2">
              {groupMembers.map((member) => (
                <label key={member.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={splitBetween.includes(member.id)}
                    onChange={(e) => handleSplitBetweenChange(member.id, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
            {splitBetween.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                一人あたり: ¥{amount ? Math.round(parseFloat(amount) / splitBetween.length).toLocaleString() : '0'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="詳細や備考を入力"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || splitBetween.length === 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  item: ItineraryItem;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ item, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">予定を削除</h3>

        <p className="text-gray-700 mb-2">
          以下の予定を削除しますか？この操作は取り消せません。
        </p>

        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900">{item.title}</h4>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          {item.location && (
            <p className="text-sm text-gray-500 mt-1">📍 {item.location}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
