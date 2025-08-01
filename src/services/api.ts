import axios from 'axios';
import {
  User,
  TravelGroup,
  Travel,
  ItineraryItem,
  WishlistItem,
  Expense,
  ExpenseCategory,
  Budget,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for CORS
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  console.log('API Request Debug:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No JWT token found in localStorage for API request:', config.url);
  }
  return config;
});

// Response interceptor for error handling and date conversion
api.interceptors.response.use(
  (response) => {
    // Convert date strings to Date objects for travel data
    if (response.data) {
      if (Array.isArray(response.data)) {
        response.data = response.data.map(convertDates);
      } else {
        response.data = convertDates(response.data);
      }
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    // Special handling for 403 errors to provide more context
    if (error.response?.status === 403) {
      console.error('Permission denied. Check if user has access to this resource.');
      console.error('Request details:', {
        endpoint: error.config?.url,
        method: error.config?.method,
        userData: error.config?.data,
        authToken: error.config?.headers?.Authorization ? 'Present' : 'Missing'
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('travel-storage');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Helper function to convert date strings to Date objects and transform data structure
function convertDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  // Convert common date fields
  ['startDate', 'endDate', 'createdAt', 'updatedAt'].forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      const date = new Date(result[field]);
      // Only assign if it's a valid date
      if (!isNaN(date.getTime())) {
        result[field] = date;
      }
    }
  });

  // Transform travel group members structure
  if (result.members && Array.isArray(result.members)) {
    result.members = result.members.map((member: any) => {
      if (member.user) {
        return member.user;
      }
      return member;
    });
  }

  // Handle nested objects
  Object.keys(result).forEach((key) => {
    if (
      result[key] &&
      typeof result[key] === 'object' &&
      !['startDate', 'endDate', 'createdAt', 'updatedAt', 'members'].includes(
        key
      )
    ) {
      if (Array.isArray(result[key])) {
        result[key] = result[key].map(convertDates);
      } else {
        result[key] = convertDates(result[key]);
      }
    }
  });

  return result;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  guestLogin: async (nickname: string, deviceFingerprint: string, groupId: string) => {
    const response = await api.post('/auth/guest-login', {
      nickname,
      deviceFingerprint,
      groupId,
    });
    return response.data;
  },

  refreshGuestSession: async (tempId: string) => {
    const response = await api.post(`/auth/guest-refresh/${tempId}`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getProfile: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
};

// Travel Groups API
export const travelGroupsApi = {
  getAll: async (): Promise<TravelGroup[]> => {
    const response = await api.get('/travel-groups');
    return response.data;
  },

  getOne: async (id: string): Promise<TravelGroup> => {
    const response = await api.get(`/travel-groups/${id}`);
    return response.data;
  },

  create: async (name: string): Promise<TravelGroup> => {
    const response = await api.post('/travel-groups', { name });
    return response.data;
  },

  addMember: async (groupId: string, email: string) => {
    const response = await api.post(`/travel-groups/${groupId}/members`, {
      email,
    });
    return response.data;
  },

  removeMember: async (groupId: string, userId: string) => {
    const response = await api.delete(
      `/travel-groups/${groupId}/members/${userId}`
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<TravelGroup>
  ): Promise<TravelGroup> => {
    const response = await api.patch(`/travel-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/travel-groups/${id}`);
    return response.data;
  },
};

// Travels API
export const travelsApi = {
  getAll: async (): Promise<Travel[]> => {
    const response = await api.get('/travels');
    return response.data;
  },

  getOne: async (id: string): Promise<Travel> => {
    const response = await api.get(`/travels/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    groupId: string;
  }): Promise<Travel> => {
    const response = await api.post('/travels', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Travel>): Promise<Travel> => {
    const response = await api.patch(`/travels/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/travels/${id}`);
    return response.data;
  },
};

// Itinerary API
export const itineraryApi = {
  getByTravel: async (travelId: string): Promise<ItineraryItem[]> => {
    const response = await api.get(`/itinerary?travelId=${travelId}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    date: string;
    period: 'morning' | 'afternoon' | 'evening';
    travelId: string;
  }): Promise<ItineraryItem> => {
    const response = await api.post('/itinerary', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<ItineraryItem>
  ): Promise<ItineraryItem> => {
    const response = await api.patch(`/itinerary/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/itinerary/${id}`);
    return response.data;
  },
};

// Wishlist API
export const wishlistApi = {
  getByTravel: async (travelId: string): Promise<WishlistItem[]> => {
    const response = await api.get(`/wishlist?travelId=${travelId}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    isShared?: boolean;
    travelId: string;
  }): Promise<WishlistItem> => {
    const response = await api.post('/wishlist', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<WishlistItem>
  ): Promise<WishlistItem> => {
    const response = await api.patch(`/wishlist/${id}`, data);
    return response.data;
  },

  toggleShare: async (id: string): Promise<WishlistItem> => {
    const response = await api.patch(`/wishlist/${id}/toggle-share`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/wishlist/${id}`);
    return response.data;
  },
};

// Expense Categories API
export const expenseCategoriesApi = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get('/expense-categories');
    return response.data;
  },
};

// Expenses API
export const expensesApi = {
  getByTravel: async (travelId: string): Promise<Expense[]> => {
    const response = await api.get(`/expenses?travelId=${travelId}`);
    return response.data;
  },

  create: async (travelId: string, data: {
    amount: number;
    title: string;
    categoryId: string;
    paidBy: string;
    splitBetween: string[];
    splitMethod: 'equal' | 'custom';
    customSplits?: { userId: string; amount: number }[];
    date: string;
    memo?: string;
    itineraryItemId?: string;
  }): Promise<Expense> => {
    const response = await api.post(`/travels/${travelId}/expenses`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

// Budgets API
export const budgetsApi = {
  getByTravel: async (travelId: string): Promise<Budget | null> => {
    const response = await api.get(`/budgets?travelId=${travelId}`);
    return response.data;
  },

  createOrUpdate: async (travelId: string, data: {
    totalBudget?: number;
    categoryBudgets?: { categoryId: string; amount: number }[];
  }): Promise<Budget> => {
    const response = await api.post(`/travels/${travelId}/budgets`, data);
    return response.data;
  },
};

// Expense Analytics API
export const expenseAnalyticsApi = {
  getByTravel: async (travelId: string) => {
    const response = await api.get(`/travels/${travelId}/expense-analytics`);
    return response.data;
  },
};

export default api;
