import { Expense } from '@/types';

export interface ExpenseCalculations {
  totalAmount: number;
  myTotalPaid: number;
  myTotalShare: number;
  balance: number;
}

/**
 * 支出の計算を行うユーティリティ関数
 * @param expenses - 支出の配列
 * @param userId - 計算対象のユーザーID
 * @returns 計算結果
 */
export function calculateExpenses(
  expenses: Expense[],
  userId: string
): ExpenseCalculations {
  // 総支出額
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 自分が支払った総額
  const myExpenses = expenses.filter(expense => expense.paidBy === userId);
  const myTotalPaid = myExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 自分が負担すべき総額
  const myTotalShare = expenses.reduce((sum, expense) => {
    // 均等割りの場合
    if (expense.splitMethod === 'equal' && expense.splitBetween.includes(userId)) {
      return sum + (expense.amount / expense.splitBetween.length);
    }
    // カスタム分割の場合
    else if (expense.customSplits) {
      const myShare = expense.customSplits.find(split => split.userId === userId);
      return sum + (myShare?.amount || 0);
    }
    return sum;
  }, 0);

  // 収支（プラスなら受け取るべき金額、マイナスなら支払うべき金額）
  const balance = myTotalPaid - myTotalShare;

  return {
    totalAmount,
    myTotalPaid,
    myTotalShare,
    balance,
  };
}

/**
 * グループ内での個人間の精算額を計算
 * @param expenses - 支出の配列
 * @param groupMemberIds - グループメンバーのID配列
 * @returns ユーザーID間の精算マップ
 */
export function calculateSettlements(
  expenses: Expense[],
  groupMemberIds: string[]
): Map<string, Map<string, number>> {
  // 各メンバーの収支を計算
  const memberBalances = new Map<string, number>();
  
  for (const memberId of groupMemberIds) {
    const { balance } = calculateExpenses(expenses, memberId);
    memberBalances.set(memberId, balance);
  }

  // 精算マップを作成（誰が誰にいくら払うか）
  const settlements = new Map<string, Map<string, number>>();
  
  // 簡易的な精算アルゴリズム（実際の実装では最適化が必要）
  const creditors = Array.from(memberBalances.entries())
    .filter(([_, balance]) => balance > 0)
    .sort((a, b) => b[1] - a[1]);
  
  const debtors = Array.from(memberBalances.entries())
    .filter(([_, balance]) => balance < 0)
    .sort((a, b) => a[1] - b[1]);

  for (const [creditorId, creditAmount] of creditors) {
    let remainingCredit = creditAmount;
    
    for (const [debtorId, debtAmount] of debtors) {
      if (remainingCredit <= 0) break;
      
      const remainingDebt = Math.abs(debtAmount);
      const settlementAmount = Math.min(remainingCredit, remainingDebt);
      
      if (settlementAmount > 0) {
        if (!settlements.has(debtorId)) {
          settlements.set(debtorId, new Map());
        }
        settlements.get(debtorId)!.set(creditorId, settlementAmount);
        remainingCredit -= settlementAmount;
      }
    }
  }

  return settlements;
}