'use client';

import { useState } from 'react';
import { Expense, User } from '@/types';
import { useTravelStore } from '@/stores/travelStore';
import { formatDate } from '@/utils/dateUtils';
import { Edit2, Trash2, Filter, Calendar } from 'lucide-react';
import EditExpenseModal from './EditExpenseModal';

interface ExpenseListProps {
  expenses: Expense[];
  groupMembers: User[];
}

export default function ExpenseList({ expenses, groupMembers }: ExpenseListProps) {
  const { itineraryItems, deleteExpense } = useTravelStore();
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPaidBy, setFilterPaidBy] = useState<string>('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get unique categories from expenses
  const categories = Array.from(new Set(expenses.map(e => e.category.id)))
    .map(catId => expenses.find(e => e.category.id === catId)?.category)
    .filter(Boolean);

  // Filter expenses
  let filteredExpenses = expenses;
  if (filterCategory) {
    filteredExpenses = filteredExpenses.filter(e => e.category.id === filterCategory);
  }
  if (filterPaidBy) {
    filteredExpenses = filteredExpenses.filter(e => e.paidBy === filterPaidBy);
  }

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'category':
        return a.category.name.localeCompare(b.category.name);
      default:
        return 0;
    }
  });

  const getPaidByName = (userId: string) => {
    const member = groupMembers.find(m => m.id === userId);
    return member?.name || 'Unknown';
  };

  const getSplitInfo = (expense: Expense) => {
    if (expense.splitMethod === 'equal') {
      const perPerson = Math.round(expense.amount / expense.splitBetween.length);
      return `${expense.splitBetween.length}人で分担 (¥${perPerson.toLocaleString()}/人)`;
    }
    return '個別分担';
  };

  const getItineraryItem = (itemId: string | undefined) => {
    if (!itemId) return null;
    return itineraryItems.find(item => item.id === itemId);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (window.confirm(`「${expense.title}」を削除しますか？この操作は取り消せません。`)) {
      try {
        await deleteExpense(expense.id);
      } catch (error) {
        console.error('Failed to delete expense:', error);
        
        let errorMessage = '支出の削除に失敗しました。';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const apiError = error as { response: { data?: any; status?: number } };
          
          if (apiError.response?.status === 401) {
            errorMessage = '認証が無効です。再度ログインしてください。';
          } else if (apiError.response?.status === 403) {
            errorMessage = 'この操作を実行する権限がありません。';
          } else if (apiError.response?.data?.message) {
            errorMessage = `エラー: ${apiError.response.data.message}`;
          }
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = `エラー: ${(error as Error).message}`;
        }
        
        alert(errorMessage);
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <p className="text-gray-500 mb-2">まだ支出がありません</p>
        <p className="text-sm text-gray-400">
          右上の+ボタンから支出を追加しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">フィルター・並び替え</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sort by */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">並び替え</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">日付順</option>
              <option value="amount">金額順</option>
              <option value="category">カテゴリ順</option>
            </select>
          </div>

          {/* Filter by category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              {categories.map((category) => (
                <option key={category!.id} value={category!.id}>
                  {category!.icon} {category!.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by paid by */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">支払者</label>
            <select
              value={filterPaidBy}
              onChange={(e) => setFilterPaidBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">すべて</option>
              {groupMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {sortedExpenses.map((expense) => (
          <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{expense.category.icon}</span>
                  <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                  <span 
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: expense.category.color }}
                  >
                    {expense.category.name}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-500">
                  <p>支払者: {getPaidByName(expense.paidBy)}</p>
                  <p>{getSplitInfo(expense)}</p>
                  <p>{formatDate(expense.date)}</p>
                  {expense.itineraryItemId && (
                    <div className="flex items-center gap-1 text-primary-600">
                      <Calendar className="w-3 h-3" />
                      <span>{getItineraryItem(expense.itineraryItemId)?.title || '旅程表アイテム'}</span>
                    </div>
                  )}
                  {expense.memo && (
                    <p className="text-gray-600 italic">メモ: {expense.memo}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4">
                <p className="text-xl font-bold text-gray-900">
                  ¥{expense.amount.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <button 
                    onClick={() => handleEditExpense(expense)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="編集"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-primary-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteExpense(expense)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results summary */}
      {filteredExpenses.length !== expenses.length && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {filteredExpenses.length}件 / 全{expenses.length}件の支出を表示中
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
          }}
          expense={editingExpense}
          groupMembers={groupMembers}
        />
      )}
    </div>
  );
}