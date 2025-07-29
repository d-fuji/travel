import { describe, it, expect } from 'vitest';
import { calculateExpenses, calculateSettlements } from '../expenseCalculations';
import { Expense } from '@/types';

describe('calculateExpenses', () => {
  const mockCategory = {
    id: 'cat1',
    name: '食事',
    icon: '🍽️',
    color: '#FF6B6B',
  };

  const createMockExpense = (overrides: Partial<Expense>): Expense => ({
    id: 'exp1',
    title: 'ランチ',
    amount: 3000,
    category: mockCategory,
    paidBy: 'user1',
    splitBetween: ['user1', 'user2'],
    splitMethod: 'equal',
    date: new Date('2024-01-01'),
    travelId: 'travel1',
    createdBy: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  describe('均等割りの場合', () => {
    it('自分が支払って自分も分担対象の場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 3000,
          paidBy: 'user1',
          splitBetween: ['user1', 'user2'],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(3000);
      expect(result.myTotalPaid).toBe(3000);
      expect(result.myTotalShare).toBe(1500); // 3000 / 2
      expect(result.balance).toBe(1500); // 3000 - 1500
    });

    it('他人が支払って自分も分担対象の場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 3000,
          paidBy: 'user2',
          splitBetween: ['user1', 'user2'],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(3000);
      expect(result.myTotalPaid).toBe(0);
      expect(result.myTotalShare).toBe(1500);
      expect(result.balance).toBe(-1500);
    });

    it('自分が分担対象外の場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 3000,
          paidBy: 'user2',
          splitBetween: ['user2', 'user3'],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(3000);
      expect(result.myTotalPaid).toBe(0);
      expect(result.myTotalShare).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('複数の支出がある場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          id: 'exp1',
          amount: 3000,
          paidBy: 'user1',
          splitBetween: ['user1', 'user2'],
        }),
        createMockExpense({
          id: 'exp2',
          amount: 2000,
          paidBy: 'user2',
          splitBetween: ['user1', 'user2', 'user3'],
        }),
        createMockExpense({
          id: 'exp3',
          amount: 1500,
          paidBy: 'user1',
          splitBetween: ['user2', 'user3'], // user1は対象外
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(6500);
      expect(result.myTotalPaid).toBe(4500); // 3000 + 1500
      expect(result.myTotalShare).toBeCloseTo(2166.67, 1); // 1500 + 666.67（2000/3）
      expect(result.balance).toBeCloseTo(2333.33, 1);
    });
  });

  describe('カスタム分割の場合', () => {
    it('カスタム分割で自分の負担額が指定されている場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 5000,
          paidBy: 'user2',
          splitMethod: 'custom',
          customSplits: [
            { userId: 'user1', amount: 2000 },
            { userId: 'user2', amount: 3000 },
          ],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(5000);
      expect(result.myTotalPaid).toBe(0);
      expect(result.myTotalShare).toBe(2000);
      expect(result.balance).toBe(-2000);
    });

    it('カスタム分割で自分が含まれていない場合', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 5000,
          paidBy: 'user2',
          splitMethod: 'custom',
          customSplits: [
            { userId: 'user2', amount: 3000 },
            { userId: 'user3', amount: 2000 },
          ],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(5000);
      expect(result.myTotalPaid).toBe(0);
      expect(result.myTotalShare).toBe(0);
      expect(result.balance).toBe(0);
    });
  });

  describe('エッジケース', () => {
    it('支出が空の場合', () => {
      const result = calculateExpenses([], 'user1');

      expect(result.totalAmount).toBe(0);
      expect(result.myTotalPaid).toBe(0);
      expect(result.myTotalShare).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('splitBetweenが空の場合（データ不整合）', () => {
      const expenses: Expense[] = [
        createMockExpense({
          amount: 3000,
          paidBy: 'user1',
          splitBetween: [],
        }),
      ];

      const result = calculateExpenses(expenses, 'user1');

      expect(result.totalAmount).toBe(3000);
      expect(result.myTotalPaid).toBe(3000);
      expect(result.myTotalShare).toBe(0);
      expect(result.balance).toBe(3000);
    });
  });
});

describe('calculateSettlements', () => {
  const mockCategory = {
    id: 'cat1',
    name: '食事',
    icon: '🍽️',
    color: '#FF6B6B',
  };

  it('2人での精算', () => {
    const expenses: Expense[] = [
      {
        id: 'exp1',
        title: 'ランチ',
        amount: 3000,
        category: mockCategory,
        paidBy: 'user1',
        splitBetween: ['user1', 'user2'],
        splitMethod: 'equal',
        date: new Date('2024-01-01'),
        travelId: 'travel1',
        createdBy: 'user1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const settlements = calculateSettlements(expenses, ['user1', 'user2']);

    // user2はuser1に1500円支払う必要がある
    expect(settlements.get('user2')?.get('user1')).toBe(1500);
    expect(settlements.has('user1')).toBe(false);
  });

  it('3人での複雑な精算', () => {
    const expenses: Expense[] = [
      {
        id: 'exp1',
        title: 'ランチ',
        amount: 6000,
        category: mockCategory,
        paidBy: 'user1',
        splitBetween: ['user1', 'user2', 'user3'],
        splitMethod: 'equal',
        date: new Date('2024-01-01'),
        travelId: 'travel1',
        createdBy: 'user1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'exp2',
        title: 'ディナー',
        amount: 3000,
        category: mockCategory,
        paidBy: 'user2',
        splitBetween: ['user1', 'user2'],
        splitMethod: 'equal',
        date: new Date('2024-01-01'),
        travelId: 'travel1',
        createdBy: 'user2',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const settlements = calculateSettlements(expenses, ['user1', 'user2', 'user3']);

    // user1: 支払い6000、負担3500 → +2500
    // user2: 支払い3000、負担3500 → -500
    // user3: 支払い0、負担2000 → -2000

    // user3はuser1に2000円支払う
    expect(settlements.get('user3')?.get('user1')).toBe(2000);
    // user2はuser1に500円支払う
    expect(settlements.get('user2')?.get('user1')).toBe(500);
  });
});