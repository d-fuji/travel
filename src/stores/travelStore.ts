import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Travel, TravelGroup, ItineraryItem, WishlistItem } from '@/types';

interface TravelState {
  groups: TravelGroup[];
  travels: Travel[];
  itineraryItems: ItineraryItem[];
  wishlistItems: WishlistItem[];
  _hasHydrated: boolean;
  
  // Travel Group actions
  createGroup: (name: string, createdBy: string) => string;
  addMemberToGroup: (groupId: string, email: string) => void;
  
  // Travel actions
  createTravel: (name: string, destination: string, startDate: Date, endDate: Date, groupId: string, createdBy: string) => string;
  
  // Itinerary actions
  addItineraryItem: (item: Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItineraryItem: (id: string, updates: Partial<ItineraryItem>) => void;
  deleteItineraryItem: (id: string) => void;
  
  // Wishlist actions
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  toggleWishlistShare: (id: string) => void;
  moveWishlistToItinerary: (wishlistId: string, date: string, period: 'morning' | 'afternoon' | 'evening') => void;
  
  // Hydration
  initializeWithMockData: () => void;
}

// Mock data for development
const mockGroups: TravelGroup[] = [
  {
    id: 'group-1',
    name: '家族旅行',
    members: [
      { id: 'user-2', email: 'mom@example.com', name: 'お母さん' },
      { id: 'user-3', email: 'dad@example.com', name: 'お父さん' }
    ],
    createdBy: '1',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'group-2', 
    name: 'カップル旅行',
    members: [
      { id: 'user-4', email: 'partner@example.com', name: 'パートナー' }
    ],
    createdBy: '1',
    createdAt: new Date('2024-01-02')
  }
];

const mockTravels: Travel[] = [
  {
    id: 'travel-1',
    name: '沖縄家族旅行',
    destination: '沖縄県',
    startDate: new Date('2024-03-20'),
    endDate: new Date('2024-03-23'),
    groupId: 'group-1',
    createdBy: '1',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'travel-2',
    name: '京都桜旅行',
    destination: '京都府',
    startDate: new Date('2024-04-05'),
    endDate: new Date('2024-04-07'),
    groupId: 'group-2',
    createdBy: '1',
    createdAt: new Date('2024-01-20')
  }
];

const mockItineraryItems: ItineraryItem[] = [
  {
    id: 'item-1',
    title: '那覇空港到着',
    description: 'ANA便で到着予定',
    location: '那覇空港',
    startTime: '10:30',
    endTime: '11:00',
    date: '2024-03-20',
    period: 'morning',
    travelId: 'travel-1',
    createdBy: '1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'item-2',
    title: 'ホテルチェックイン',
    description: 'リゾートホテルに宿泊',
    location: 'ANAインターコンチネンタル万座ビーチリゾート',
    startTime: '15:00',
    endTime: '',
    date: '2024-03-20',
    period: 'afternoon',
    travelId: 'travel-1',
    createdBy: '1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'item-3',
    title: '美ら海水族館',
    description: 'ジンベエザメを見に行く',
    location: '沖縄美ら海水族館',
    startTime: '09:00',
    endTime: '12:00',
    date: '2024-03-21',
    period: 'morning',
    travelId: 'travel-1',
    createdBy: '1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  }
];

const mockWishlistItems: WishlistItem[] = [
  {
    id: 'wish-1',
    name: '首里城',
    description: '沖縄の歴史を学ぶ',
    addedBy: '1',
    travelId: 'travel-1',
    isShared: true,
    createdAt: new Date('2024-01-17')
  },
  {
    id: 'wish-2',
    name: '国際通り',
    description: 'お土産を買う',
    addedBy: '1',
    travelId: 'travel-1',
    isShared: false,
    createdAt: new Date('2024-01-17')
  },
  {
    id: 'wish-3',
    name: '清水寺',
    description: '桜の季節に訪問',
    addedBy: '1',
    travelId: 'travel-2',
    isShared: true,
    createdAt: new Date('2024-01-21')
  }
];

export const useTravelStore = create<TravelState>()(
  persist(
    (set, get) => ({
      groups: [],
      travels: [],
      itineraryItems: [],
      wishlistItems: [],
      
      // Initialize with mock data on first load
      _hasHydrated: false,
  
  createGroup: (name: string, createdBy: string) => {
    const id = Date.now().toString();
    const newGroup: TravelGroup = {
      id,
      name,
      members: [],
      createdBy,
      createdAt: new Date(),
    };
    
    set(state => ({
      groups: [...state.groups, newGroup]
    }));
    
    return id;
  },
  
  addMemberToGroup: (groupId: string, email: string) => {
    // Mock member addition
    set(state => ({
      groups: state.groups.map(group => 
        group.id === groupId 
          ? { ...group, members: [...group.members, { id: Date.now().toString(), email, name: email.split('@')[0] }] }
          : group
      )
    }));
  },
  
  createTravel: (name: string, destination: string, startDate: Date, endDate: Date, groupId: string, createdBy: string) => {
    const id = Date.now().toString();
    const newTravel: Travel = {
      id,
      name,
      destination,
      startDate,
      endDate,
      groupId,
      createdBy,
      createdAt: new Date(),
    };
    
    set(state => ({
      travels: [...state.travels, newTravel]
    }));
    
    return id;
  },
  
  addItineraryItem: (item) => {
    const newItem: ItineraryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      itineraryItems: [...state.itineraryItems, newItem]
    }));
  },
  
  updateItineraryItem: (id: string, updates) => {
    set(state => ({
      itineraryItems: state.itineraryItems.map(item =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
    }));
  },
  
  deleteItineraryItem: (id: string) => {
    set(state => ({
      itineraryItems: state.itineraryItems.filter(item => item.id !== id)
    }));
  },
  
  addWishlistItem: (item) => {
    const newItem: WishlistItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    set(state => ({
      wishlistItems: [...state.wishlistItems, newItem]
    }));
  },
  
  toggleWishlistShare: (id: string) => {
    set(state => ({
      wishlistItems: state.wishlistItems.map(item =>
        item.id === id ? { ...item, isShared: !item.isShared } : item
      )
    }));
  },
  
  moveWishlistToItinerary: (wishlistId: string, date: string, period: 'morning' | 'afternoon' | 'evening') => {
    const { wishlistItems, addItineraryItem } = get();
    const wishlistItem = wishlistItems.find(item => item.id === wishlistId);
    
    if (wishlistItem) {
      addItineraryItem({
        title: wishlistItem.name,
        description: wishlistItem.description,
        date,
        period,
        travelId: wishlistItem.travelId,
        createdBy: wishlistItem.addedBy,
      });
    }
  },
  
  initializeWithMockData: () => {
    const { groups, travels } = get();
    // Only initialize if no data exists
    if (groups.length === 0 && travels.length === 0) {
      set({
        groups: mockGroups,
        travels: mockTravels,
        itineraryItems: mockItineraryItems,
        wishlistItems: mockWishlistItems,
        _hasHydrated: true,
      });
    }
  },
}),
{
  name: 'travel-storage',
  storage: {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const data = JSON.parse(str);
      // Convert date strings back to Date objects
      if (data.state.travels) {
        data.state.travels = data.state.travels.map((travel: any) => ({
          ...travel,
          startDate: new Date(travel.startDate),
          endDate: new Date(travel.endDate),
          createdAt: new Date(travel.createdAt),
        }));
      }
      if (data.state.groups) {
        data.state.groups = data.state.groups.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
        }));
      }
      if (data.state.itineraryItems) {
        data.state.itineraryItems = data.state.itineraryItems.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
      }
      if (data.state.wishlistItems) {
        data.state.wishlistItems = data.state.wishlistItems.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
      }
      return data;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  },
}
)
);