'use client';

import { useMemo } from 'react';
import { Expense, User } from '@/types';
import { PieChart, BarChart3, TrendingUp, ArrowUpDown } from 'lucide-react';

interface ExpenseSummaryProps {
  expenses: Expense[];
  groupMembers: User[];
}

export default function ExpenseSummary({ expenses, groupMembers }: ExpenseSummaryProps) {
  const summaryData = useMemo(() => {
    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category.id]) {
        acc[category.id] = {
          ...category,
          amount: 0,
          count: 0,
        };
      }
      acc[category.id].amount += expense.amount;
      acc[category.id].count += 1;
      return acc;
    }, {} as Record<string, any>);

    // Member spending breakdown
    const memberBreakdown = expenses.reduce((acc, expense) => {
      if (!acc[expense.paidBy]) {
        const member = groupMembers.find(m => m.id === expense.paidBy);
        acc[expense.paidBy] = {
          id: expense.paidBy,
          name: member?.name || 'Unknown',
          totalPaid: 0,
          totalShare: 0,
          expenses: [],
        };
      }
      acc[expense.paidBy].totalPaid += expense.amount;
      acc[expense.paidBy].expenses.push(expense);
      return acc;
    }, {} as Record<string, any>);

    // Calculate shares for each member
    expenses.forEach(expense => {
      expense.splitBetween.forEach(memberId => {
        if (!memberBreakdown[memberId]) {
          const member = groupMembers.find(m => m.id === memberId);
          memberBreakdown[memberId] = {
            id: memberId,
            name: member?.name || 'Unknown',
            totalPaid: 0,
            totalShare: 0,
            expenses: [],
          };
        }

        if (expense.splitMethod === 'equal') {
          memberBreakdown[memberId].totalShare += expense.amount / expense.splitBetween.length;
        } else if (expense.customSplits) {
          const customSplit = expense.customSplits.find(split => split.userId === memberId);
          if (customSplit) {
            memberBreakdown[memberId].totalShare += customSplit.amount;
          }
        }
      });
    });

    // Calculate settlements (who owes whom)
    const balances = Object.values(memberBreakdown).map((member: any) => ({
      ...member,
      balance: member.totalPaid - member.totalShare,
    }));

    const settlements = [];
    const debtors = balances.filter(m => m.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debt = Math.abs(debtors[i].balance);
      const credit = creditors[j].balance;
      const amount = Math.min(debt, credit);

      if (amount > 0.01) { // Avoid tiny amounts
        settlements.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amount: Math.round(amount),
        });
      }

      debtors[i].balance += amount;
      creditors[j].balance -= amount;

      if (Math.abs(debtors[i].balance) < 0.01) i++;
      if (Math.abs(creditors[j].balance) < 0.01) j++;
    }

    return {
      categoryBreakdown: Object.values(categoryBreakdown),
      memberBreakdown: Object.values(memberBreakdown),
      balances,
      settlements,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    };
  }, [expenses, groupMembers]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PieChart className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-2">まだ支出がありません</p>
        <p className="text-sm text-gray-400">
          支出を追加すると分析結果が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">総支出額</p>
            <p className="text-3xl font-bold">¥{summaryData.totalAmount.toLocaleString()}</p>
            <p className="text-primary-100 text-sm mt-1">
              {expenses.length}件の支出 • {groupMembers.length}人で分担
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">カテゴリ別支出</h3>
        </div>
        
        <div className="space-y-3">
          {summaryData.categoryBreakdown.map((category: any) => {
            const percentage = (category.amount / summaryData.totalAmount) * 100;
            return (
              <div key={category.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: category.color, 
                          width: `${percentage}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ¥{category.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.count}件
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">メンバー別収支</h3>
        </div>
        
        <div className="space-y-4">
          {summaryData.balances.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>支払い: ¥{Math.round(member.totalPaid).toLocaleString()}</span>
                  <span>負担: ¥{Math.round(member.totalShare).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {member.balance >= 0 ? '+' : ''}¥{Math.round(member.balance).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {member.balance >= 0 ? '受け取り' : '支払い'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlements */}
      {summaryData.settlements.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpDown className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">精算方法</h3>
          </div>
          
          <div className="space-y-3">
            {summaryData.settlements.map((settlement: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-blue-600">{settlement.from}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-green-600">{settlement.to}</span>
                    </p>
                    <p className="text-xs text-gray-500">精算が必要</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ¥{settlement.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 text-center">
              💡 {summaryData.settlements.length}回の送金で精算完了
            </p>
          </div>
        </div>
      )}
    </div>
  );
}