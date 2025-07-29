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
  creator?: User; // creator information from API
  createdBy: string;
  createdAt: Date;
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
  imageDisplayMode?: 'thumbnail' | 'full' | 'slideshow' | 'grid';
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
