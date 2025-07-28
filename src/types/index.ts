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
  startTime?: string;
  endTime?: string;
  date: string;
  period: 'morning' | 'afternoon' | 'evening';
  travelId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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