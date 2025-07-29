# Travel Backend API Endpoints Overview

## 認証 (Authentication)

### POST /auth/login
ユーザーログイン
- **Body**: `{ email: string, password: string }`
- **Response**: JWT トークンを含む認証情報

### POST /auth/register
新規ユーザー登録
- **Body**: `{ email: string, password: string, name: string }`
- **Response**: 作成されたユーザー情報

## ユーザー管理 (Users)
**Note**: 全てのエンドポイントは JWT 認証が必要

### GET /users
全ユーザー一覧取得

### GET /users/:id
特定ユーザー情報取得

### PATCH /users/:id
ユーザー情報更新

### DELETE /users/:id
ユーザー削除

## 旅行グループ (Travel Groups)
**Note**: 全てのエンドポイントは JWT 認証が必要

### POST /travel-groups
旅行グループ作成
- **Body**: `{ name: string }`

### GET /travel-groups
自分が所属する旅行グループ一覧取得

### GET /travel-groups/:id
特定の旅行グループ詳細取得

### POST /travel-groups/:id/members
グループにメンバー追加
- **Body**: `{ email: string }`

### DELETE /travel-groups/:id/members/:userId
グループからメンバー削除

### PATCH /travel-groups/:id
旅行グループ情報更新

### DELETE /travel-groups/:id
旅行グループ削除

## 旅行プラン (Travels)
**Note**: 全てのエンドポイントは JWT 認証が必要

### POST /travels
旅行プラン作成
- **Body**: `{ name: string, destination: string, startDate: string, endDate: string, groupId: string }`

### GET /travels
自分がアクセス可能な旅行プラン一覧取得

### GET /travels/:id
特定の旅行プラン詳細取得

### PATCH /travels/:id
旅行プラン情報更新
- **Body**: `{ name?: string, destination?: string, startDate?: string, endDate?: string }`

### DELETE /travels/:id
旅行プラン削除

## 旅程 (Itinerary)
**Note**: 全てのエンドポイントは JWT 認証が必要

### POST /itinerary
旅程アイテム作成
- **Body**: 
  ```json
  {
    "title": "string",
    "description": "string",
    "location": "string",
    "locationUrl": "string",
    "startTime": "string",
    "endTime": "string",
    "date": "string",
    "period": "string",
    "travelId": "string"
  }
  ```

### GET /itinerary?travelId={travelId}
特定の旅行に紐づく旅程一覧取得
- **Query**: `travelId` (必須)

### GET /itinerary/:id
特定の旅程アイテム詳細取得

### PATCH /itinerary/:id
旅程アイテム更新

### DELETE /itinerary/:id
旅程アイテム削除

### GET /itinerary/:itemId/images
旅程アイテムに紐づく画像一覧取得

## ウィッシュリスト (Wishlist)
**Note**: 全てのエンドポイントは JWT 認証が必要

### POST /wishlist
ウィッシュリストアイテム作成
- **Body**: `{ name: string, description: string, isShared?: boolean, travelId: string }`

### GET /wishlist?travelId={travelId}
特定の旅行に紐づくウィッシュリスト取得
- **Query**: `travelId` (必須)

### GET /wishlist/:id
特定のウィッシュリストアイテム詳細取得

### PATCH /wishlist/:id
ウィッシュリストアイテム更新

### PATCH /wishlist/:id/toggle-share
アイテムの共有状態を切り替え

### DELETE /wishlist/:id
ウィッシュリストアイテム削除

## 経費管理 (Expenses)
**Note**: 全てのエンドポイントは JWT 認証が必要

### GET /expense-categories
経費カテゴリー一覧取得

### GET /expenses?travelId={travelId}
特定の旅行に紐づく経費一覧取得
- **Query**: `travelId` (必須)

### POST /travels/:travelId/expenses
経費登録
- **Body**: 経費情報

### PATCH /expenses/:id
経費情報更新

### DELETE /expenses/:id
経費削除

### GET /budgets?travelId={travelId}
特定の旅行の予算情報取得
- **Query**: `travelId` (必須)

### POST /travels/:travelId/budgets
予算の作成・更新

### GET /travels/:travelId/expense-analytics
経費分析データ取得

## 画像管理 (Images)
**Note**: 全てのエンドポイントは JWT 認証が必要

### POST /images/upload
画像アップロード（最大10枚まで）
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `images`: ファイル（複数可）
  - `itineraryItemId`: string
  - `userId`: string
  - `options`: JSON文字列（オプション）

### DELETE /images/:imageId
画像削除

### PATCH /images/:imageId
画像情報更新

### POST /images/main
メイン画像設定
- **Body**: 設定情報

## 共通仕様

### 認証
- `/auth/*` 以外の全てのエンドポイントは JWT トークンによる認証が必要
- Authorization ヘッダーに `Bearer {token}` 形式でトークンを含める

### レスポンス形式
- 成功時: ステータスコード 200/201、JSON形式のレスポンスボディ
- エラー時: 適切なHTTPステータスコードとエラーメッセージ

### バリデーション
- 全てのエンドポイントで入力値のバリデーションが実施される
- 不正な入力の場合は 400 Bad Request が返される