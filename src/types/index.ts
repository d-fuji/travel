export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface TravelGroup {
  id: string;
  name: string;
  members: User[];
  guestUsers?: GuestUserInfo[]; // guest users information from API
  creator?: User; // creator information from API
  createdBy: string;
  createdAt: Date;
}

export interface GuestUserInfo {
  tempId: string;
  nickname: string;
  joinedAt: Date;
}

export interface Travel {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  groupId: string;
  createdBy: string;
  createdAt: Date;
}

export interface ItineraryItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  locationUrl?: string;
  startTime?: string;
  endTime?: string;
  date: string;
  period: 'morning' | 'afternoon' | 'evening';
  travelId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  images?: ItineraryImage[];
  mainImageId?: string;
  showImages?: boolean;
  imageDisplayMode?: 'thumbnail' | 'full' | 'grid';
}

export interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  addedBy: string;
  travelId: string;
  isShared: boolean;
  createdAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  travelId: string;
  amount: number;
  title: string;
  category: ExpenseCategory;
  paidBy: string;
  splitBetween: string[];
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

export interface Budget {
  id: string;
  travelId: string;
  totalBudget?: number;
  categoryBudgets: { categoryId: string; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryImage {
  id: string;
  itineraryItemId: string;
  url: string;
  thumbnailUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  caption?: string;
  altText?: string;
  order: number;
  isMain: boolean;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ImageUploadOptions {
  quality: 'high' | 'medium' | 'low';
  maxWidth?: number;
  maxHeight?: number;
  enableCompression: boolean;
}

// 招待リンク関連の型定義
export interface InvitationLink {
  id: string;
  groupId: string;
  token: string; // セキュアなランダムトークン
  createdBy: string; // User ID
  customMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationUsage {
  id: string;
  invitationLinkId: string;
  userId: string;
  usedAt: Date;
  success: boolean;
}

export interface InvitationSettings {
  id: string;
  groupId: string;
  allowMemberInvite: boolean; // 一般メンバーの招待権限
  requireApproval: boolean; // 管理者承認が必要か
  allowGuestMode: boolean; // ゲストモード許可
}

export interface GuestUser {
  id: string;
  tempId: string; // 一時的なID
  nickname: string;
  groupId: string;
  deviceFingerprint: string; // デバイス識別用
  joinedAt: Date;
  lastActiveAt: Date;
  isConverted: boolean; // 本登録済みかどうか
  convertedUserId?: string; // 本登録後のユーザーID
  permissions: GuestPermission[];
}

export interface GuestPermission {
  action: string; // 'read', 'comment', 'edit_wishlist' etc.
  allowed: boolean;
  resource?: string; // 対象リソース
}

// 招待リンク作成リクエスト
export interface CreateInvitationLinkRequest {
  customMessage?: string;
}

// 招待リンク参加リクエスト
export interface JoinInvitationRequest {
  userId?: string; // 既存ユーザーの場合
  userData?: UserRegistrationData; // 新規ユーザーの場合
  guestData?: { nickname: string; deviceFingerprint: string }; // ゲストの場合
}

// ユーザー登録データ
export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
}

// ゲストユーザー本登録リクエスト
export interface ConvertGuestRequest {
  email: string;
  password: string;
  name?: string;
}

// 招待リンク詳細（参加前確認用）
export interface InvitationDetails {
  token: string;
  group: TravelGroup;
  travels: Travel[]; // グループに関連する旅行一覧
  inviter: User;
  customMessage?: string;
  memberCount: number;
  isValid: boolean;
}

// 事前準備タスク管理
export interface PreTravelTask {
  id: string;
  travelId: string;
  title: string;
  category: TaskCategory;
  assignedTo: string[]; // User IDs
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  memo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: 'domestic' | 'international' | 'group' | 'custom';
  tasks: Omit<PreTravelTask, 'id' | 'travelId' | 'assignedTo' | 'createdBy' | 'createdAt' | 'updatedAt'>[];
  isPublic: boolean;
  createdBy?: string;
}
