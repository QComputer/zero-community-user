import { useState, useEffect } from 'react';
import { cartAPI, Cart, CartItem } from '../services/api';
import { toast } from 'react-toastify';

/**
 * StoreCart interface for frontend cart management
 * Extends the Cart interface from api.ts with additional frontend-specific properties
 */
export interface StoreCart {
  storeId: string;
  storeName: string;
  items: CartItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the appropriate cart API based on authentication status
 * Uses unified approach - backend handles session management automatically
 */
const getCartAPI = () => {
  // Unified approach: use cartAPI for all user types
  // Backend handles session management automatically
  return cartAPI;
};

/**
 * Custom hook for managing cart state and operations
 */
export const useCart = () => {
  const [storeCarts, setStoreCarts] = useState<StoreCart[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * Load cart from API - unified approach for both guest and authenticated users
   * Backend handles session management automatically
   */
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading cart data...');
      const cartAPI = getCartAPI();
      const cartsResponse = await cartAPI.get();
      if (!cartsResponse.success) {
        throw new Error(cartsResponse.message || 'Failed to load cart');
      }
      console.log('Cart API response:', cartsResponse);
      const cartData = cartsResponse?.data || null;

      console.log('Carts data received:', cartData);

      // Handle guest cart session tracking
      if (cartData && cartData.isGuestCart && cartData.sessionId) {
        console.log('Guest cart detected, session ID:', cartData.sessionId);
        // Store session ID in localStorage for persistence across page reloads
        localStorage.setItem('guest_session_id', cartData.sessionId);
      }

      // Set the carts data as-is, maintaining store separation
      loadStoreCarts(cartData);
      setCart(cartData);

    } catch (error: any) {
      console.error('Failed to load cart:', error);
      setError('Failed to load cart data');
      toast.error(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const loadStoreCarts = (cart: Cart | null) => {
    if (!cart) {
      setStoreCarts([]);
      return;
    }

    // Transform cart data into store-separated structure
    const carts: StoreCart[] = [];
    
    // Group items by store
    const itemsByStore: Record<string, { storeName: string; items: CartItem[] }> = {};
    
    cart.items.forEach(item => {
      const storeId = item.store._id;
      const storeName = item.store.name || item.store.username || 'Unknown Store';
      
      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = {
          storeName,
          items: []
        };
      }
      itemsByStore[storeId].items.push(item);
    });
    
    // Create StoreCart objects
    Object.entries(itemsByStore).forEach(([storeId, { storeName, items }]) => {
      carts.push({
        storeId,
        storeName,
        items,
        expiresAt: cart.expiresAt,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      });
    });
    
    setStoreCarts(carts);
  }

  /**
   * Find a cart by store ID, create if doesn't exist
   */
  const findOrCreateStoreCart = (storeId: string, storeName?: string): StoreCart | undefined => {
    let storeCart = storeCarts.find(sc => sc.storeId === storeId);

    if (!storeCart) {
      // Create new cart structure
      storeCart = {
        storeId,
        storeName: storeName || 'Unknown Store',
        items: [],
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return storeCart;
  };

  const findStoreCart = (storeId: string): StoreCart | undefined => {
    return storeCarts.find(sc => sc.storeId === storeId);
  };

  /**
   * Find cart item by product ID within a specific cart
   */
  const findCartItem = (storeId: string, productId: string): CartItem | undefined => {
    const storeCart = findStoreCart(storeId);
    if (!storeCart || !storeCart.items || !Array.isArray(storeCart.items)) {
      return undefined;
    }
    return storeCart.items.find(item => item.product?._id === productId);
  };

  /**
   * Add product to cart by quantity
   * @param productId - The product ID
   * @param storeId - The store ID
   * @param quantityChange - Positive to add, negative to remove
   * @param catalogId - Optional catalog ID for guest carts
   * @returns Promise<void>
   */
  const handleAddToCart = async (productId: string, storeId: string, quantityChange: number, catalogId: string) => {
    try {
      console.log(`handleAddToCart called: productId=${productId}, storeId=${storeId}, quantityChange=${quantityChange}, catalogId=${catalogId}`);

      const cartAPI = getCartAPI();

      // Unified approach: backend handles session management automatically
      // No need to check authentication status - all valid sessions are authenticated

      // Find the cart for this store
      const storeCart = findOrCreateStoreCart(storeId, 'Temporary');
      if (!storeCart) {
        throw new Error('Could not create cart for store');
      }

      const existingItem = findCartItem(storeId, productId);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + quantityChange;

      console.log(`Cart state: currentQuantity=${currentQuantity}, newQuantity=${newQuantity}`);

      // Validate new quantity
      if (newQuantity < 0) {
        toast.error('Quantity cannot be negative');
        return;
      }

      // If removing all items, remove from cart
      if (newQuantity <= 0) {
        console.log('Removing item from cart');
        await cartAPI.removeFromCart(productId);
        // Refresh cart to get updated data
        await loadCart();
        toast.success('Product removed from cart');
        return;
      }

      // If item already exists, update quantity
      if (existingItem) {
        console.log('Updating existing item quantity');
        await cartAPI.updateCart(productId, newQuantity, catalogId);
      } else {
        // Add new item to cart
        console.log('Adding new item to cart');
        await cartAPI.addToCart(productId, quantityChange, catalogId);
      }

      // Refresh cart to get updated data with proper structure
      await loadCart();

      // Show appropriate success message based on cart type
      const isGuestCart = cart && cart.isGuestCart;
      const message = isGuestCart ? 'Item added to cart (guest session)' : 'Cart updated successfully';
      toast.success(message);

    } catch (error: any) {
      console.error('Failed to update cart:', error);
      setError('Failed to update cart');

      if (error.status === 401) {
        toast.error('Please login to add items to your cart');
      } else if (error.status === 403) {
        toast.error('You do not have permission to add items to cart');
      } else {
        toast.error(error.message || 'Failed to update cart');
      }
    }
  };

  /**
   * Get current cart item count for a specific product
   */
  const getCartItemCount = (productId: string): number => {
    if (cart && cart.items && Array.isArray(cart.items)) {
      const item = cart.items.find(item => item?.product?._id === productId);
      if (item) return item.quantity || 0;
    }
    return 0;
  };

  /**
   * Get total items across the cart
   */
  const getTotalItems = (): number => {
    let totalNumber = 0;
    for (const cartItem of cart?.items || []) {
      totalNumber += cartItem.quantity;
    }
    return totalNumber;
  };

  /**
   * Get total items for a specific store
   */
  const getStoreItemCount = (storeId: string): number => {
    const cart = storeCarts.find(sc => sc.storeId === storeId);
    if (!cart) return 0;

    if (cart.items && Array.isArray(cart.items)) {
      return cart.items.reduce((total: number, item) => total + item.quantity, 0);
    }
    return 0;
  };

  /**
   * Clear the entire cart (all stores)
   * Uses unified approach - backend handles session management automatically
   */
  const clearCart = async () => {
    try {
      const cartAPI = getCartAPI();

      // Unified approach: remove items individually for all user types
      const allProductIds: string[] = [];
      storeCarts.forEach(cart => {
        cart.items.forEach(item => {
          allProductIds.push(item.product._id);
        });
      });

      // Remove all items
      for (const productId of allProductIds) {
        await cartAPI.removeFromCart(productId);
      }

      // Clear local state
      setStoreCarts([]);
      toast.success('Cart cleared');

    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      setError('Failed to clear cart');
      toast.error('Failed to clear cart');
    }
  };

  /**
   * Clear cart for a specific store
   */
  const clearStoreCart = async (storeId: string) => {
    try {
      const cartAPI = getCartAPI();
      const cart = storeCarts.find(c => c.storeId === storeId);
      if (!cart) return;

      // Remove all items from this store's cart
      for (const item of cart.items) {
        await cartAPI.removeFromCart(item.product._id);
      }

      // Refresh cart data
      await loadCart();
      toast.success(`Cleared cart for ${cart.storeId || 'store'}`);

    } catch (error: any) {
      console.error('Failed to clear store cart:', error);
      setError('Failed to clear store cart');
      toast.error('Failed to clear store cart');
    }
  };

  /**
   * Get cart for a specific store
   */
  const getStoreCart = (storeId: string): StoreCart | undefined => {
    return storeCarts.find(cart => cart.storeId === storeId);
  };

  // Load cart on initial render
  useEffect(() => {
    loadCart();
  }, []);

  return {
    storeCarts,
    loading,
    error,
    handleAddToCart,
    getCartItemCount,
    getTotalItems,
    getStoreItemCount,
    clearCart,
    clearStoreCart,
    getStoreCart,
    loadCart,
    setStoreCarts
  };
};

export default useCart;