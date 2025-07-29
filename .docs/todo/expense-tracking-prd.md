# 費用可視化機能 PRD (Product Requirements Document)

## 概要

旅行計画アプリに費用の記録・分割・可視化機能を追加し、グループメンバー間で支出を透明化し、精算を簡素化する。

## 目的

- 旅行中の支出を記録・管理できるようにする
- グループメンバー間での費用分担を自動計算する
- 支出の可視化により予算管理を支援する
- 精算の煩雑さを軽減する

## 対象ユーザー

- カップルや家族で旅行を計画するユーザー
- グループ旅行で費用を分担したいユーザー
- 旅行の予算管理をしたいユーザー

## 機能要件

### 1. 支出記録機能

#### 1.1 支出の追加
- **入力項目**：
  - 金額（必須）
  - 項目名（必須）
  - カテゴリ（交通費、宿泊費、食事、観光・娯楽、買い物、その他）
  - 支払者（必須）
  - 分担対象者（デフォルト：全メンバー）
  - 日付（デフォルト：今日）
  - メモ（任意）
  - レシート写真（任意）
  - **旅程アイテム紐付け**：関連する旅程表アイテムとの関連付け（任意）

#### 1.2 支出の編集・削除
- 支出の内容を後から編集可能
- 支払者のみ編集・削除可能（権限制御）

#### 1.3 支出の一覧表示
- 日付順・金額順でソート可能
- カテゴリでフィルタリング可能
- 支払者でフィルタリング可能

### 2. 費用分担機能

#### 2.1 分担方法
- **均等割り**（デフォルト）：参加者全員で等分
- **個別指定**：特定のメンバーのみで分担
- **割合指定**：メンバーごとに負担割合を指定

#### 2.2 分担計算
- リアルタイムで各メンバーの負担額を計算
- 支払い済み額と負担額の差額を表示
- 精算が必要な金額を明確化

### 3. 可視化機能

#### 3.1 サマリー表示
- 総支出額
- カテゴリ別支出額（円グラフ）
- メンバー別支払額（棒グラフ）
- 日別支出推移（折れ線グラフ）

#### 3.2 精算画面
- 「誰が誰にいくら払うべきか」を自動計算
- 最小の取引回数で精算できるよう最適化
- 精算完了のマーク機能

### 4. 予算管理機能

#### 4.1 予算設定
- 旅行全体の予算設定
- カテゴリ別予算設定

#### 4.2 予算との比較
- 予算に対する使用率の表示
- 予算超過時の警告表示

## 技術仕様

### データ構造

```typescript
interface Expense {
  id: string;
  travelId: string;
  amount: number;
  title: string;
  category: ExpenseCategory;
  paidBy: string; // User ID
  splitBetween: string[]; // User IDs
  splitMethod: 'equal' | 'custom';
  customSplits?: { userId: string; amount: number }[];
  date: Date;
  memo?: string;
  receiptImage?: string;
  itineraryItemId?: string; // 関連する旅程表アイテムのID
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Budget {
  id: string;
  travelId: string;
  totalBudget?: number;
  categoryBudgets: { categoryId: string; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### UI/UX設計

#### 画面構成
1. **費用概要画面**：サマリー情報と最近の支出
2. **支出一覧画面**：全ての支出を一覧表示
3. **支出追加画面**：新しい支出を記録
4. **精算画面**：メンバー間の精算状況
5. **予算管理画面**：予算設定と使用状況

#### ナビゲーション
- 旅行詳細画面にタブとして追加
- 「費用」タブでアクセス可能

#### UI/UX実装要件（開発中に追加）
- **統一モーダルデザイン**：`fixed inset-0 bg-black bg-opacity-50` の共通スタイル
- **z-index管理**：モーダル重なり順序の適切な管理（z-50, z-60等）
- **レスポンシブ対応**：モバイルファーストの画面設計
- **エラーハンドリング**：ユーザーフレンドリーなエラーメッセージ表示
- **リアルタイム更新**：状態変更の即座な反映

## 実装フェーズ

### Phase 1: 基本機能 ✅
- [x] 支出の記録・編集・削除
- [x] 基本的な分担計算（均等割り）
- [x] 支出一覧表示
- [x] 簡単なサマリー表示
- [x] 旅程アイテムとの紐付け機能
- [x] モーダルベースのUI実装
- [x] リアルタイム計算・更新

### Phase 2: 高度な分担機能
- [ ] 個別指定・割合指定の分担
- [ ] 精算計算・最適化
- [ ] カテゴリ別分析

### Phase 3: 可視化・予算管理
- [ ] グラフによる可視化
- [ ] 予算設定・管理
- [ ] レシート画像機能

## 成功指標

- 支出記録の使用率：80%以上
- 精算機能の使用率：60%以上
- 旅程アイテム連携利用率：40%以上（実装済み機能）
- ユーザーの旅行費用管理満足度向上
- モーダルUI操作完了率：95%以上（実装済みUI）

## リスク・考慮事項

- **プライバシー**：金銭情報の適切な保護
- **精度**：分担計算の正確性確保
- **使いやすさ**：入力の煩雑さを最小限に
- **データ整合性**：メンバー追加・削除時の既存データ処理

## 関連ファイル

実装済み・関連ファイル：
- `src/types/index.ts` - 型定義（実装済み）
- `src/stores/travelStore.ts` - 支出データの状態管理（実装済み）
- `src/components/ExpenseTracker.tsx` - メインコンポーネント（実装済み）
- `src/components/AddExpenseModal.tsx` - 支出追加モーダル（実装済み）
- `src/components/EditExpenseModal.tsx` - 支出編集モーダル（実装済み）
- `src/components/ExpenseList.tsx` - 支出一覧表示（実装済み）
- `src/components/ExpenseSummary.tsx` - サマリー表示（実装済み）
- `src/utils/expenseCalculations.ts` - 計算ロジック（実装済み）
- `src/services/api.ts` - API通信（実装済み）
- `src/app/travel/[id]/page.tsx` - タブ追加（実装済み）