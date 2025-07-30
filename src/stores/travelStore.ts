import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Travel, TravelGroup, ItineraryItem, WishlistItem, Expense, ExpenseCategory, Budget } from '@/types';
import {
  travelGroupsApi,
  travelsApi,
  itineraryApi,
  wishlistApi,
  expensesApi,
  expenseCategoriesApi,
  budgetsApi,
} from '@/services/api';

interface TravelState {
  groups: TravelGroup[];
  travels: Travel[];
  itineraryItems: ItineraryItem[];
  wishlistItems: WishlistItem[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgets: Budget[];
  isLoading: boolean;

  // Data fetching
  fetchGroups: () => Promise<void>;
  fetchTravels: () => Promise<void>;
  fetchItineraryItems: (travelId: string) => Promise<void>;
  fetchWishlistItems: (travelId: string) => Promise<void>;
  fetchExpenses: (travelId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;

  // Travel Group actions
  createGroup: (name: string) => Promise<string>;
  updateGroup: (
    groupId: string,
    updates: Partial<TravelGroup>
  ) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addMemberToGroup: (groupId: string, email: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;

  // Travel actions
  createTravel: (
    name: string,
    destination: string,
    startDate: Date,
    endDate: Date,
    groupId: string
  ) => Promise<string>;
  updateTravel: (travelId: string, updates: Partial<Travel>) => Promise<void>;
  deleteTravel: (travelId: string) => Promise<void>;

  // Itinerary actions
  addItineraryItem: (item: {
    title: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    date: string;
    period: 'morning' | 'afternoon' | 'evening';
    travelId: string;
  }) => Promise<void>;
  updateItineraryItem: (
    id: string,
    updates: Partial<ItineraryItem>
  ) => Promise<void>;
  deleteItineraryItem: (id: string) => Promise<void>;

  // Wishlist actions
  addWishlistItem: (item: {
    name: string;
    description?: string;
    isShared?: boolean;
    travelId: string;
  }) => Promise<void>;
  updateWishlistItem: (
    id: string,
    updates: Partial<WishlistItem>
  ) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  toggleWishlistShare: (id: string) => Promise<void>;
  moveWishlistToItinerary: (
    wishlistId: string,
    date: string,
    period: 'morning' | 'afternoon' | 'evening'
  ) => Promise<void>;

  // Expense actions
  addExpense: (expense: {
    amount: number;
    title: string;
    categoryId: string;
    paidBy: string;
    splitBetween: string[];
    splitMethod: 'equal' | 'custom';
    customSplits?: { userId: string; amount: number }[];
    date: Date;
    memo?: string;
    itineraryItemId?: string;
    travelId: string;
  }) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense> & { categoryId?: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

}

// Default expense categories
const defaultCategories: ExpenseCategory[] = [
  { id: 'transport', name: '交通費', color: '#3B82F6', icon: '🚗' },
  { id: 'accommodation', name: '宿泊費', color: '#10B981', icon: '🏨' },
  { id: 'food', name: '食事', color: '#F59E0B', icon: '🍽️' },
  { id: 'entertainment', name: '観光・娯楽', color: '#EF4444', icon: '🎡' },
  { id: 'shopping', name: '買い物', color: '#8B5CF6', icon: '🛍️' },
  { id: 'other', name: 'その他', color: '#6B7280', icon: '📝' },
];

export const useTravelStore = create<TravelState>()(
  persist(
    (set, get) => ({
      groups: [],
      travels: [],
      itineraryItems: [],
      wishlistItems: [],
      expenses: [],
      categories: defaultCategories,
      budgets: [],
      isLoading: false,

      // Data fetching
      fetchGroups: async () => {
        set({ isLoading: true });
        try {
          const groups = await travelGroupsApi.getAll();
          set({ groups, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch groups:', error);
        }
      },

      fetchTravels: async () => {
        set({ isLoading: true });
        try {
          const travels = await travelsApi.getAll();
          set({ travels, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch travels:', error);
        }
      },

      fetchItineraryItems: async (travelId: string) => {
        try {
          const itineraryItems = await itineraryApi.getByTravel(travelId);
          set({ itineraryItems });
        } catch (error) {
          console.error('Failed to fetch itinerary items:', error);
        }
      },

      fetchWishlistItems: async (travelId: string) => {
        try {
          const wishlistItems = await wishlistApi.getByTravel(travelId);
          set({ wishlistItems });
        } catch (error) {
          // Set empty array on error to clear stale data
          set({ wishlistItems: [] });
        }
      },

      fetchExpenses: async (travelId: string) => {
        try {
          const expenses = await expensesApi.getByTravel(travelId);
          set({ expenses });
        } catch (error) {
          console.error('Failed to fetch expenses:', error);
          set({ expenses: [] });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await expenseCategoriesApi.getAll();
          set({ categories });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
          set({ categories: defaultCategories });
        }
      },

      createGroup: async (name: string) => {
        try {
          const newGroup = await travelGroupsApi.create(name);
          set((state) => ({
            groups: [...state.groups, newGroup],
          }));
          return newGroup.id;
        } catch (error) {
          console.error('Failed to create group:', error);
          throw error;
        }
      },

      updateGroup: async (groupId: string, updates: Partial<TravelGroup>) => {
        try {
          await travelGroupsApi.update(groupId, updates);
          set((state) => ({
            groups: state.groups.map((group) =>
              group.id === groupId ? { ...group, ...updates } : group
            ),
          }));
        } catch (error) {
          console.error('Failed to update group:', error);
          throw error;
        }
      },

      deleteGroup: async (groupId: string) => {
        try {
          await travelGroupsApi.delete(groupId);
          set((state) => ({
            groups: state.groups.filter((group) => group.id !== groupId),
          }));
        } catch (error) {
          console.error('Failed to delete group:', error);
          throw error;
        }
      },

      addMemberToGroup: async (groupId: string, email: string) => {
        try {
          await travelGroupsApi.addMember(groupId, email);
          // Refresh groups to get updated member list
          get().fetchGroups();
        } catch (error) {
          console.error('Failed to add member:', error);
          throw error;
        }
      },

      removeMemberFromGroup: async (groupId: string, userId: string) => {
        try {
          await travelGroupsApi.removeMember(groupId, userId);
          // Refresh groups to get updated member list
          get().fetchGroups();
        } catch (error) {
          console.error('Failed to remove member:', error);
          throw error;
        }
      },

      createTravel: async (
        name: string,
        destination: string,
        startDate: Date,
        endDate: Date,
        groupId: string
      ) => {
        try {
          const newTravel = await travelsApi.create({
            name,
            destination,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupId,
          });
          set((state) => ({
            travels: [...state.travels, newTravel],
          }));
          return newTravel.id;
        } catch (error) {
          console.error('Failed to create travel:', error);
          throw error;
        }
      },

      updateTravel: async (travelId: string, updates: Partial<Travel>) => {
        try {
          const updatedTravel = await travelsApi.update(travelId, updates);
          set((state) => ({
            travels: state.travels.map((travel) =>
              travel.id === travelId ? updatedTravel : travel
            ),
          }));
        } catch (error) {
          console.error('Failed to update travel:', error);
          throw error;
        }
      },

      deleteTravel: async (travelId: string) => {
        try {
          await travelsApi.delete(travelId);
          set((state) => ({
            travels: state.travels.filter((travel) => travel.id !== travelId),
          }));
        } catch (error) {
          console.error('Failed to delete travel:', error);
          throw error;
        }
      },

      addItineraryItem: async (item) => {
        try {
          const newItem = await itineraryApi.create(item);
          set((state) => ({
            itineraryItems: [...state.itineraryItems, newItem],
          }));
        } catch (error) {
          console.error('Failed to add itinerary item:', error);
          throw error;
        }
      },

      updateItineraryItem: async (id: string, updates) => {
        try {
          // imagesプロパティを除外してAPIに送信
          const { images, ...apiUpdates } = updates;
          
          // images以外のプロパティがある場合のみAPIを呼び出し
          if (Object.keys(apiUpdates).length > 0) {
            const updatedItem = await itineraryApi.update(id, apiUpdates);
            set((state) => ({
              itineraryItems: state.itineraryItems.map((item) =>
                item.id === id ? updatedItem : item
              ),
            }));
          }
          // imagesのみの更新の場合は何もしない（将来的にAPI実装予定）
        } catch (error) {
          console.error('Failed to update itinerary item:', error);
          throw error;
        }
      },

      deleteItineraryItem: async (id: string) => {
        try {
          await itineraryApi.delete(id);
          set((state) => ({
            itineraryItems: state.itineraryItems.filter(
              (item) => item.id !== id
            ),
          }));
        } catch (error) {
          console.error('Failed to delete itinerary item:', error);
          throw error;
        }
      },

      addWishlistItem: async (item) => {
        try {
          const newItem = await wishlistApi.create(item);
          set((state) => ({
            wishlistItems: [...state.wishlistItems, newItem],
          }));
        } catch (error) {
          throw error;
        }
      },

      updateWishlistItem: async (id: string, updates) => {
        try {
          const updatedItem = await wishlistApi.update(id, updates);
          set((state) => ({
            wishlistItems: state.wishlistItems.map((item) =>
              item.id === id ? updatedItem : item
            ),
          }));
        } catch (error) {
          console.error('Failed to update wishlist item:', error);
          throw error;
        }
      },

      deleteWishlistItem: async (id: string) => {
        try {
          await wishlistApi.delete(id);
          set((state) => ({
            wishlistItems: state.wishlistItems.filter(
              (item) => item.id !== id
            ),
          }));
        } catch (error) {
          console.error('Failed to delete wishlist item:', error);
          throw error;
        }
      },

      toggleWishlistShare: async (id: string) => {
        try {
          const updatedItem = await wishlistApi.toggleShare(id);
          set((state) => ({
            wishlistItems: state.wishlistItems.map((item) =>
              item.id === id ? updatedItem : item
            ),
          }));
        } catch (error) {
          console.error('Failed to toggle wishlist share:', error);
          throw error;
        }
      },

      moveWishlistToItinerary: async (
        wishlistId: string,
        date: string,
        period: 'morning' | 'afternoon' | 'evening'
      ) => {
        const { wishlistItems, addItineraryItem } = get();
        const wishlistItem = wishlistItems.find(
          (item) => item.id === wishlistId
        );

        if (wishlistItem) {
          try {
            await addItineraryItem({
              title: wishlistItem.name,
              description: wishlistItem.description,
              date,
              period,
              travelId: wishlistItem.travelId,
            });
          } catch (error) {
            console.error('Failed to move wishlist item to itinerary:', error);
            throw error;
          }
        }
      },

      addExpense: async (expense) => {
        try {
          const newExpense = await expensesApi.create(expense.travelId, {
            amount: expense.amount,
            title: expense.title,
            categoryId: expense.categoryId,
            paidBy: expense.paidBy,
            splitBetween: expense.splitBetween,
            splitMethod: expense.splitMethod,
            customSplits: expense.customSplits,
            date: expense.date.toISOString(),
            memo: expense.memo,
            itineraryItemId: expense.itineraryItemId,
          });

          set((state) => ({
            expenses: [...state.expenses, newExpense],
          }));
        } catch (error) {
          console.error('Failed to add expense:', error);
          throw error;
        }
      },

      updateExpense: async (id: string, updates: Partial<Expense>) => {
        try {
          const updateData: any = { ...updates };
          if (updateData.date) {
            updateData.date = updateData.date.toISOString();
          }
          
          const updatedExpense = await expensesApi.update(id, updateData);
          
          set((state) => ({
            expenses: state.expenses.map((expense) =>
              expense.id === id ? updatedExpense : expense
            ),
          }));
        } catch (error) {
          console.error('Failed to update expense:', error);
          throw error;
        }
      },

      deleteExpense: async (id: string) => {
        try {
          await expensesApi.delete(id);
          
          set((state) => ({
            expenses: state.expenses.filter((expense) => expense.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete expense:', error);
          throw error;
        }
      },
    }),
    {
      name: 'travel-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            // Convert date strings back to Date objects safely
            if (data.state.travels) {
              data.state.travels = data.state.travels.map((travel: any) => ({
                ...travel,
                startDate: travel.startDate ? new Date(travel.startDate) : null,
                endDate: travel.endDate ? new Date(travel.endDate) : null,
                createdAt: travel.createdAt ? new Date(travel.createdAt) : null,
              }));
            }
            if (data.state.groups) {
              data.state.groups = data.state.groups.map((group: any) => ({
                ...group,
                createdAt: group.createdAt ? new Date(group.createdAt) : null,
              }));
            }
            if (data.state.itineraryItems) {
              data.state.itineraryItems = data.state.itineraryItems.map(
                (item: any) => ({
                  ...item,
                  createdAt: item.createdAt ? new Date(item.createdAt) : null,
                  updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
                })
              );
            }
            if (data.state.wishlistItems) {
              data.state.wishlistItems = data.state.wishlistItems.map(
                (item: any) => ({
                  ...item,
                  createdAt: item.createdAt ? new Date(item.createdAt) : null,
                })
              );
            }
            if (data.state.expenses) {
              data.state.expenses = data.state.expenses.map(
                (expense: any) => ({
                  ...expense,
                  date: expense.date ? new Date(expense.date) : null,
                  createdAt: expense.createdAt ? new Date(expense.createdAt) : null,
                  updatedAt: expense.updatedAt ? new Date(expense.updatedAt) : null,
                })
              );
            }
            return data;
          } catch (error) {
            console.error('Error parsing stored data:', error);
            return null;
          }
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
