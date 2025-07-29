'use client';

import { useState } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';
import { X } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelId: string;
  groupMembers: User[];
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  travelId,
  groupMembers,
}: AddExpenseModalProps) {
  const { user } = useAuthStore();
  const { categories, addExpense, itineraryItems } = useTravelStore();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [splitBetween, setSplitBetween] = useState<string[]>(
    groupMembers.map(member => member.id)
  );
  const [memo, setMemo] = useState('');
  const [itineraryItemId, setItineraryItemId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get itinerary items for this travel
  const travelItineraryItems = itineraryItems.filter(item => item.travelId === travelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('ユーザー情報が取得できません。再度ログインしてください。');
      return;
    }
    
    if (!amount || !title || !categoryId || !paidBy || splitBetween.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        title,
        categoryId,
        paidBy,
        splitBetween,
        splitMethod: 'equal',
        date: new Date(),
        memo: memo || undefined,
        itineraryItemId: itineraryItemId || undefined,
        travelId,
      });

      // Reset form
      setAmount('');
      setTitle('');
      setCategoryId('');
      setPaidBy(user?.id || '');
      setSplitBetween(groupMembers.map(member => member.id));
      setMemo('');
      setItineraryItemId('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">支出を追加</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              項目名 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例: ランチ代"
              required
            />
          </div>

          {/* Category */}
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

          {/* Paid by */}
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

          {/* Split between */}
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

          {/* Related Itinerary Item */}
          {travelItineraryItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                関連する旅程
              </label>
              <select
                value={itineraryItemId}
                onChange={(e) => setItineraryItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">選択しない</option>
                {travelItineraryItems.map((item) => {
                  const date = new Date(item.date).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                  });
                  const periodLabel = item.period === 'morning' ? '午前' :
                    item.period === 'afternoon' ? '午後' : '夜';
                  return (
                    <option key={item.id} value={item.id}>
                      {date} {periodLabel} - {item.title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Memo */}
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

          {/* Submit buttons */}
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