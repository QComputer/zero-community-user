import axios from 'axios';
import { logApiCall, logError } from './logger';

/**
 * TypeScript interfaces for API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}
// User and Shop Cart
export interface User {
  _id: string;
  username: string;
  role: 'customer' | 'store' | 'driver' | 'admin' | 'staff';
  name?: string;
  phone?: string;
  email?: string;
  moreInfo?: string;
  statusMain?: string;
  statusCustom?: string;
  avatar?: string;
  image?: string;
  locationLat?: number;
  locationLng?: number;
  shareLocation?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CartItem {
  _id: string;
  product: Product;
  store: User;
  catalog: Catalog;
  image: string;
  quantity: number;
  addedAt: string;
  createdAt: string;
}
export interface Cart {
  _id: string;
  user?: User; // Optional for guest carts
  sessionId?: string; // Present for guest carts
  sessionType?: 'guest'; // Present for guest carts
  isGuestCart?: boolean; // Present for guest carts
  items: CartItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}



// Store
export interface Product {
  _id: string;
  name: string;
  store: User;
  category: Category
  description: string;
  price: number;
  image: string | null;
  available: boolean;
  ratings: number;
  tags: string[];
  stock: number;
  brand: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
}
export interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  store: User;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CatalogDesign {
  colorScheme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  layout?: {
    type?: 'grid' | 'list' | 'masonry';
    columns?: number;
  };
  theme?: string;
}
export interface Catalog {
  _id: string;
  name: string;
  store: User;
  description?: string;
  products: Product[];
  design: CatalogDesign;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shareLink?: string;
  qrCode?: string;
}
export interface Invitation {
  token: string;
  type: 'staff' | 'customer' | 'driver';
  invitationUrl: string;
  qrCode: string;
  isUsed: boolean;
  createdAt: string;
}


// Order workflow
/**
 * Order Status Types
 */
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'prepared'
  | 'pickedup'
  | 'delivered'
  | 'received'
  | 'rejected'
  | 'canceled by customer'
  | 'canceled by store'
  | 'canceled by driver';

/**
 * Order Interface matching backend schema
 */
export interface Order {
  _id: string;
  orderName: string;
  user: User;
  store: User;
  items: CartItem[];
  status: OrderStatus;
  driver?: User | null;
  phone: string;
  address_details?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  isTakeout: boolean;
  deliveryFee: number;
  amount: number;
  payment: boolean;
  isActive: boolean;
  datePlaced: string;
  // Progress tracking fields
  progressPrepare?: number;
  progressPickup?: number;
  progressDeliver?: number;
  minutesLeftPrepare?: number;
  minutesLeftPickup?: number;
  minutesLeftDeliver?: number;
  // Feedback fields
  customerRating?: number;
  customerComment?: string;
  customerReactions?: string[];
  // Time estimation fields
  datePrepared_byStore_est?: string;
  datePickedup_byDriver_est?: string;
  dateDelivered_byDriver_est?: string;
}

/**
 * Updated API Service for Zero Community Frontend
 * Matches backend standardization with proper error handling and response processing
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
export const API_DOCS_URL = import.meta.env.VITE_API_DOCS_URL || 'http://localhost:3000/api-docs';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token or gust session and handle API versioning
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}, Token: ${token ? 'PRESENT' : 'MISSING'}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.token = token; // Keep for backward compatibility
      console.log(`Token added to headers for ${config.method?.toUpperCase()} request`);
    }
    const sessionId = localStorage.getItem('sessionId');
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}, session: ${sessionId ? 'PRESENT' : 'MISSING'}`);
    if (sessionId) {
      config.headers['x-session-id'] = sessionId; // Keep for backward compatibility
      console.log(`Session added to headers for ${config.method?.toUpperCase()} request`);
    }

    // Add API version header
    config.headers['X-API-Version'] = '1.0';

    logApiCall(config.url || '', config.method?.toUpperCase() || 'GET', true);
    return config;
  },
  (error) => {
    logError(error, 'API Request Interceptor');
    return Promise.reject(standardizeError(error));
  }
);

// Response interceptor for standardized response handling
api.interceptors.response.use(
  (response) => {
    logApiCall(response.config.url || '', response.config.method?.toUpperCase() || '', true);

    // Handle standardized backend responses
    if (response.data && typeof response.data === 'object') {
      if (response.data.success === false) {
        // Standardized error response from backend
        return Promise.reject(standardizeError({
          response: {
            data: response.data,
            status: response.status
          }
        }));
      }
    }

    return response;
  },
  (error) => {
    const standardizedError = standardizeError(error);
    logApiCall(
      error.config?.url || '',
      error.config?.method?.toUpperCase() || '',
      false,
      { status: standardizedError.status, message: standardizedError.message }
    );
    logError(new Error(standardizedError.message), 'API Response Error');
    return Promise.reject(standardizedError);
  }
);

/**
 * Standardize error responses from backend
 * @param error - Raw error from axios
 * @returns Standardized error object
 */
function standardizeError(error: any): { message: string; status: number; data?: any; code?: string } {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, status } = error.response;

    if (data && data.message) {
      // Standardized backend error response
      return {
        message: data.message,
        status: status,
        data: data.data || data.error,
        code: data.code
      };
    }

    return {
      message: data?.error?.message || 'Request failed',
      status: status,
      data: data
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response received from server',
      status: 503,
      data: error.request
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'Request setup error',
      status: 400,
      data: error.config
    };
  }
}

/**
 * Handle API responses with standardized format
 * @param response - Axios response
 * @returns The full response object for backward compatibility
 */
async function handleResponse<T>(response: Promise<any>): Promise<ApiResponse<T>> {
  try {
    const result = await response;

    // Check for standardized backend response format
    if (result.data && result.data.success !== undefined) {
      if (result.data.success === false) {
        throw new Error(result.data.message || 'API request failed');
      }
      // Return the full response object for backward compatibility
      return result.data as ApiResponse<T>;
    }

    // Legacy response format (for backward compatibility)
    return {
      success: true,
      data: result.data,
      message: 'Success'
    } as ApiResponse<T>;
  } catch (error) {
    const standardized = standardizeError(error);
    throw standardized;
  }
}

/**
 * API Helper with built-in response handling
 */
class ApiHelper {
  static async get<T>(url: string, params?: any, config?: any): Promise<ApiResponse<T>> {
    const axiosConfig = config ? { params, ...config } : { params };
    return handleResponse<T>(api.get(url, axiosConfig));
  }

  static async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return handleResponse<T>(api.post(url, data, config));
  }

  static async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return handleResponse<T>(api.put(url, data, config));
  }

  static async delete<T>(url: string, _data?: any, config?: any): Promise<ApiResponse<T>> {
    return handleResponse<T>(api.delete(url, config));
  }

  static async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return handleResponse<T>(api.patch(url, data, config));
  }
}

/**
 * Get API documentation URL
 */
export function getApiDocsUrl(): string {
  return API_DOCS_URL;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token') || !!localStorage.getItem('session')
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): any {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

// User API - Updated with standardized response handling
export const userAPI = {
  // Authentication
  register: async (username: string, password: string, role: string): Promise<ApiResponse<User & { token: string }>> => {
    return ApiHelper.post<User & { token: string }>('/user/register', { username, password, role });
  },

  registerWithInvitation: async (data: { username: string; password: string; role: string; invitationToken?: string }): Promise<ApiResponse<User & { token: string }>> => {
    return ApiHelper.post<User & { token: string }>('/user/register', data);
  },

  login: async (username: string, password: string): Promise<ApiResponse<User & { token: string }>> => {
    return ApiHelper.post<User & { token: string }>('/user/login', { username, password });
  },

  // User account and profile
  getAccount: async () => {
    return ApiHelper.get('/user/account');
  },

  getProfile: async () => {
    return ApiHelper.get('/user/profile');
  },

  updateProfile: async (updatedUser: User): Promise<ApiResponse<User>> => {
    return ApiHelper.post('/user/update-profile', updatedUser);
  },

  updateStatus: async (updatedStatusMain: string): Promise<ApiResponse<User>> => {
    return ApiHelper.post<User>('/user/update-status', { updatedStatusMain });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return ApiHelper.post('/user/change-password', { currentPassword, newPassword });
  },

  // Admin endpoints
  getAdminProfile: async (targetId: string) => {
    return ApiHelper.get(`/user/admin/profile/${targetId}`);
  },
  getAdminAll: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/admin/all');
  },
  getAdminDrivers: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/admin/drivers');
  },

  getAdminStores: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/admin/stores');
  },

  // Public endpoints
  getPublicProfile: async (targetId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/user/public/profile/${targetId}`);
  },

  getPublicMenuById: async (targetId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/user/public/profile/${targetId}`);
  },

  // User management
  getAll: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/all');
  },

  getDrivers: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/drivers');
  },
  getStores: async (): Promise<ApiResponse<User[]>> => {
    return ApiHelper.get<User[]>('/user/stores');
  },


  // Social features
  toggleFollow: async (targetUserId: string) => {
    return ApiHelper.post('/user/follow', { targetUserId });
  },

  toggleFriend: async (targetUserId: string) => {
    return ApiHelper.post('/user/friend', { targetUserId });
  },

  // Favorites
  addToFavorites: async (userId: string, productId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/user/favorites/add', { userId, productId });
  },

  removeFromFavorites: async (userId: string, productId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/user/favorites/remove', { userId, productId });
  },

  getFavorites: async (userId: string): Promise<ApiResponse<Product[]>> => {
    return ApiHelper.get<Product[]>(`/user/favorites/${userId}`);
  },
  // Image uploads - Simplified to use unified image upload
  // Note: Profile and avatar images can now use the unified image upload endpoint
  // uploadProfileImage and uploadAvatarImage methods removed - use imageAPI.upload() instead

}

// Product API - Updated with standardized response handling
export const productAPI = {

  getCartProducts: async (productIds: string[]): Promise<ApiResponse<any[]>> => {
    return ApiHelper.post<any[]>('/product/cart-products', { productIds });
  },

  // Product operations
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/product/all');
  },

  getList: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get('/product/list');
  },

  add: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/product/add', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.put(`/product/${id}`, data);
  },

  remove: async (id: string): Promise<ApiResponse<any>> => {
    return ApiHelper.delete(`/product/${id}`);
  },

  // Public product endpoints (with query on req.body)
  getPublicList: async (storeId: string, data?: any) => {
    return ApiHelper.get(`/product/public-list/${storeId}`, data);
  },

  getPublicById: async (productId: string) => {
    return ApiHelper.get(`/product/public/${productId}`);
  },

  // Optimized endpoint to get products and categories together
  getProductsWithCategories: async (): Promise<ApiResponse<{ products: any[]; categories: any[] }>> => {
    return ApiHelper.get<{ products: any[]; categories: any[] }>('/product/products-with-categories');
  },

  // Product reactions
  addReaction: async (userId: string, productId: string, reaction: string) => {
    return ApiHelper.post('/product/reaction', { userId, productId, reaction });
  },

  removeReaction: async (userId: string, productId: string) => {
    return ApiHelper.delete('/product/reaction', { data: { userId, productId } });
  },

  getReaction: async (userId: string, productId: string) => {
    return ApiHelper.get(`/product/reaction/${userId}/${productId}`);
  }
};

// Order API - Updated with standardized response handling
export const orderAPI = {
  // Order operations
  placeOrder: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post<any>('/order/place', data);
  },

  // Dashboard statistics endpoint
  getDashboardStatistics: async (): Promise<ApiResponse<{
    orders: number;
    revenue: number;
    customers: number;
    products: number;
    placedOrders: number;
    acceptedOrders: number;
    pendingOrders: number;
    completedOrders: number;
    unreadMessages: number;
    availableOrders?: number;
  }>> => {
    return ApiHelper.get('/order/dashboard-stats');
  },


  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    return ApiHelper.get<Order[]>('/order/user-orders');
  },

  getStoreOrders: async (): Promise<ApiResponse<Order[]>> => {
    return ApiHelper.post<Order[]>('/order/store-orders');
  },

  getDriverOrders: async (): Promise<ApiResponse<Order[]>> => {
    return ApiHelper.post<Order[]>('/order/driver-orders');
  },

  getAllOrders: async (): Promise<ApiResponse<Order[]>> => {
    return ApiHelper.get<Order[]>('/order/all');
  },

  // Order status updates
  acceptByStore: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/accept-store', { orderId });
  },

  rejectByStore: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/reject-store', { orderId });
  },

  prepareOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/prepare', { orderId });
  },

  acceptByDriver: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/accept-driver', { orderId });
  },

  pickupOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/pickup', { orderId });
  },

  deliverOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/deliver-driver', { orderId });
  },

  receiveOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/receive-customer', { orderId });
  },

  // Time adjustments
  adjustPreparationTime: async (orderId: string, minutes: number): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/adjust-preparation', { orderId, minutes });
  },

  adjustPickupTime: async (orderId: string, minutes: number): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/adjust-pickup', { orderId, minutes });
  },

  adjustDeliveryTime: async (orderId: string, minutes: number): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/adjust-delivery', { orderId, minutes });
  },

  // Progress tracking
  getAvailableForDriver: async (): Promise<ApiResponse<Order[]>> => {
    return ApiHelper.post<Order[]>('/order/available-driver');
  },

  getOrderProgress: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/order/progress/${orderId}`);
  },

  getOrdersProgress: async (orderIds: string[]): Promise<ApiResponse<any[]>> => {
    return ApiHelper.post<any[]>('/order/progress-batch', { orderIds });
  },

  // Feedback
  addFeedback: async (data: { orderId: string; rating?: number; comment?: string; reactions?: string[] }): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/feedback', data);
  },

  cancelOrder: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/cancel', data);
  },


  // Payment endpoints
  markOrderAsPaid: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/mark-paid', { orderId });
  },

  markOrderAsUnpaid: async (orderId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/order/mark-unpaid', { orderId });
  },
  /*
    */
};

// Cart API - Unified approach for all user types (guest and authenticated)
export const cartAPI = {
  // Unified cart operations - works for both guest and authenticated users
  get: async (): Promise<ApiResponse<Cart>> => {
    return ApiHelper.get<Cart>('/cart/');
  },

  addToCart: async (productId: string, quantity: number, catalogId: string): Promise<any> => {
    return ApiHelper.post('/cart/', { productId, quantity, catalogId });
  },

  removeFromCart: async (productId: string): Promise<any> => {
    return ApiHelper.delete(`/cart/${productId}`, {});
  },

  updateCart: async (productId: string, quantity: number, catalogId: string): Promise<any> => {
    return ApiHelper.put('/cart/', { productId, quantity, catalogId });
  },

  // Legacy methods for backward compatibility
  add: async (itemId: string, quantity: number): Promise<any> => {
    return ApiHelper.post('/cart/', { itemId, quantity });
  },

  remove: async (itemId: string): Promise<any> => {
    return ApiHelper.delete(`/cart/${itemId}`);
  },

  update: async (itemId: string, quantity: number): Promise<any> => {
    return ApiHelper.put('/cart/', { itemId, quantity });
  }
};


// Auth API - Updated with standardized response handling
export const authAPI = {
  register: async (username: string, password: string, role: string): Promise<ApiResponse<User>> => {
    return ApiHelper.post<User>('/user/register', { username, password, role });
  },

  registerWithInvitation: async (data: { username: string; password: string; role: string; invitationToken?: string }): Promise<ApiResponse<User>> => {
    return ApiHelper.post<User>('/user/register', data);
  },

  login: async (username: string, password: string): Promise<ApiResponse<User & { token: string }>> => {
    return ApiHelper.post<User & { token: string }>('/user/login', { username, password });
  },

  guestLogin: async (isManual: boolean): Promise<ApiResponse<{ sessionId: string }>> => {
    return ApiHelper.post<{ sessionId: string }>('/user/guest-login', { manualLogin: isManual });
  },

  // User account and profile
  userAccount: async (): Promise<ApiResponse<User>> => {
    return ApiHelper.get<User>('/user/account');
  },

  userProfile: async (): Promise<ApiResponse<User>> => {
    return ApiHelper.get<User>('/user/profile');
  },

  updateProfile: async (data: any): Promise<ApiResponse> => {
    return ApiHelper.post<ApiResponse>('/user/update-profile', data);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    return ApiHelper.post<ApiResponse>('/user/change-password', { currentPassword, newPassword });
  },

  uploadProfileImage: async (userId: string, formData: FormData): Promise<any> => {
    return ApiHelper.post(`/user/upload-profile-image/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadAvatarImage: async (userId: string, formData: FormData): Promise<any> => {
    return ApiHelper.post(`/user/upload-avatar-image/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Category API - Updated with standardized response handling
export const categoryAPI = {
  publicList: async (storeId: string): Promise<ApiResponse<any>> => {
    // Public endpoint - no authentication required
    return ApiHelper.get(`/category/public-list/${storeId}`);
  },

  list: async (): Promise<ApiResponse<any[]>> => {
    // Authenticated endpoint
    return ApiHelper.post('/category/list', {});
  },

  add: async (data: FormData): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/category/add', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  update: async (id: string, data: FormData): Promise<ApiResponse<any>> => {
    return ApiHelper.put(`/category/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  remove: async (id: string): Promise<ApiResponse<any>> => {
    return ApiHelper.delete(`/category/${id}`);
  }
};

// Social API - Updated with standardized response handling
export const socialAPI = {
  getRelationships: async (): Promise<ApiResponse<any>> => {
    return ApiHelper.get('/social/relationships');
  },

  follow: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/social/follow', { targetUserId });
  },

  unfollow: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/social/unfollow', { targetUserId });
  },

  addFriend: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/social/add-friend', { targetUserId });
  },

  removeFriend: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/social/remove-friend', { targetUserId });
  },

  getStatus: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/social/status/${targetUserId}`);
  },

  getMutualFriends: async (targetUserId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/social/mutual-friends/${targetUserId}`);
  },

  getFriendSuggestions: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/social/friend-suggestions');
  }
};

// Message API - Updated with standardized response handling
export const messageAPI = {
  send: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/message/send', data);
  },

  getConversations: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/message/conversations');
  },

  getAllConversations: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/message/all-conversations');
  },

  getConversation: async (otherUserId: string): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>(`/message/conversation/${otherUserId}`);
  },

  getGroupMessages: async (groupId: string): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>(`/message/group/${groupId}`);
  },

  getUnreadMessages: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/message/unread');
  },

  markAsRead: async (messageId: string) => {
    return ApiHelper.put(`/message/${messageId}/read`);
  },

  markMessagesAsRead: async (messageIds: string[]) => {
    return ApiHelper.post('/message/read', { messageIds });
  }
};

// Invitation API - Updated with standardized response handling
export const invitationAPI = {
  create: async (data: { type: 'staff' | 'customer' }): Promise<ApiResponse<Invitation>> => {
    return ApiHelper.post<Invitation>('/invitation/create', data);
  },

  getInvitation: async (token: string): Promise<ApiResponse<Invitation>> => {
    return ApiHelper.get<Invitation>(`/invitation/${token}`);
  },

  getStoreInvitations: async (): Promise<ApiResponse<Invitation[]>> => {
    return ApiHelper.get<Invitation[]>('/invitation');
  },

  delete: async (token: string): Promise<ApiResponse> => {
    return ApiHelper.delete<ApiResponse>(`/invitation/${token}`);
  }
};

// Image API - Simplified with direct Liara disk uploads
export const imageAPI = {
  // List all images (admin only)
  list: async () => {
    return ApiHelper.get('/image/list');
  },

  // Check disk health (public endpoint)
  checkDiskHealth: async () => {
    return ApiHelper.get('/image/disk/health');
  },

  // Get disk space information (public endpoint)
  getDiskSpace: async () => {
    return ApiHelper.get('/image/disk/space');
  },

  // Download image backup (admin only)
  downloadBackup: async () => {
    return api.get('/image/backup', {
      responseType: 'blob',
      headers: { 'Accept': 'application/zip' }
    });
  },

  // Upload backup zip for restore (admin only)
  uploadBackup: async (formData: FormData) => {
    return api.post('/image/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete image (owner users)
  delete: async (filename: string) => {
    return ApiHelper.delete(`/image/${filename}`);
  },

  // Upload image (all users) - Simplified direct upload to Liara disk
  upload: async (formData: FormData) => {
    return handleResponse(api.post('/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  },

  // Clear all images (admin only)
  clearAll: async () => {
    return ApiHelper.delete('/image/clear');
  }

};


// Theme API
export const themeAPI = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/themes');
  },
  getThemes: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/themes');
  },
  applyTheme: async (themeId: string): Promise<ApiResponse> => {
    return ApiHelper.post<ApiResponse>('/themes/apply', { themeId });
  },
  delete: async (themeId: string): Promise<ApiResponse> => {
    return ApiHelper.delete<ApiResponse>(`/themes/${themeId}`);
  },
  toggleStatus: async (themeId: string): Promise<ApiResponse> => {
    return ApiHelper.patch<ApiResponse>(`/themes/${themeId}/toggle-status`);
  },
  setDefault: async (themeId: string, type: string): Promise<ApiResponse> => {
    return ApiHelper.post<ApiResponse>(`/themes/${themeId}/set-default`, { type });
  },
  update: async (themeId: string, formData: any): Promise<ApiResponse> => {
    return ApiHelper.put<ApiResponse>(`/themes/${themeId}`, formData);
  },
  create: async (formData: any): Promise<ApiResponse> => {
    return ApiHelper.post<ApiResponse>('/themes', formData);
  }
};

// Export the base API instance for direct use if needed
export { api as baseApi };

// Export error handling utilities
export { standardizeError, handleResponse, ApiHelper };

// Catalog API - Updated with standardized response handling
export const catalogAPI = {
  create: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/catalog/create', data);
  },

  duplicate: async (catalogId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.post(`/catalog/duplicate/${catalogId}`);
  },

  getCatalogs: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/catalog/list');
  },

  getCatalog: async (catalogId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get<any>(`/catalog/${catalogId}`);
  },

  update: async (catalogId: string, data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.put(`/catalog/${catalogId}`, data);
  },

  delete: async (catalogId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.delete(`/catalog/${catalogId}`);
  },

  // Catalog design endpoints
  getCatalogDesigns: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get<any[]>('/catalog/designs');
  },

  createCatalogDesign: async (data: any): Promise<ApiResponse<any>> => {
    return ApiHelper.post('/catalog/designs', data);
  },

  // Public catalog endpoints
  getPublicCatalog: async (catalogId: string): Promise<ApiResponse<any>> => {
    return ApiHelper.get(`/catalog/public/${catalogId}`);
  },

  getPublicStoreCatalogs: async (storeId: string): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get(`/catalog/public/list/${storeId}`);
  },

  getPublicCatalogs: async (): Promise<ApiResponse<any[]>> => {
    return ApiHelper.get('/catalog/public-list');
  }
};

export default {
  userAPI,
  productAPI,
  orderAPI,
  cartAPI,
  authAPI,
  categoryAPI,
  socialAPI,
  messageAPI,
  imageAPI,
  invitationAPI,
  themeAPI,
  catalogAPI,
  getApiDocsUrl,
  isAuthenticated,
  getCurrentUser,
  standardizeError
};