'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/stores/travelStore';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Wallet, TrendingUp, Users } from 'lucide-react';
import AddExpenseModal from './AddExpenseModal';
import ExpenseList from './ExpenseList';
import ExpenseSummary from './ExpenseSummary';
import { calculateExpenses } from '@/utils/expenseCalculations';

interface ExpenseTrackerProps {
  travelId: string;
}

export default function ExpenseTracker({ travelId }: ExpenseTrackerProps) {
  const { user } = useAuthStore();
  const { expenses, fetchExpenses, groups, travels } = useTravelStore();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'list'>('summary');

  const travel = travels.find(t => t.id === travelId);
  const group = groups.find(g => g.id === travel?.groupId);
  const travelExpenses = expenses.filter(expense => expense.travelId === travelId);

  useEffect(() => {
    fetchExpenses(travelId);
  }, [travelId, fetchExpenses]);

  const calculations = user
    ? calculateExpenses(travelExpenses, user.id)
    : { totalAmount: 0, myTotalPaid: 0, myTotalShare: 0, balance: 0 };

  const { totalAmount, myTotalPaid, myTotalShare } = calculations;

  // デバッグ用（開発時のみ）
  if (process.env.NODE_ENV === 'development' && user && travelExpenses.length > 0) {
    console.log('Expense calculations:', {
      userId: user.id,
      totalExpenses: travelExpenses.length,
      ...calculations
    });
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">ユーザー情報を読み込み中...</p>
        <p className="text-xs text-gray-400 mt-2">ユーザーIDが取得できません</p>
      </div>
    );
  }

  if (!travel || !group) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">旅行データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">費用</h2>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">総支出</p>
              <p className="text-lg font-semibold text-gray-900">
                ¥{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">立替払い</p>
              <p className="text-lg font-semibold text-gray-900">
                ¥{myTotalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">私の負担額</p>
              <p className="text-lg font-semibold text-gray-900">
                ¥{Math.round(myTotalShare).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'summary'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          サマリー
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          支出一覧
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' ? (
        <ExpenseSummary
          expenses={travelExpenses}
          groupMembers={
            group.members.some(member => member.id === group.createdBy)
              ? group.members
              : [...group.members, { id: group.createdBy, name: 'オーナー', email: '' }]
          }
        />
      ) : (
        <ExpenseList
          expenses={travelExpenses}
          groupMembers={
            group.members.some(member => member.id === group.createdBy)
              ? group.members
              : [...group.members, { id: group.createdBy, name: 'オーナー', email: '' }]
          }
        />
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          travelId={travelId}
          groupMembers={[...group.members]}
        />
      )}
    </div>
  );
}