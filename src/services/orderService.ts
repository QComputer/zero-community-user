/**
 * Order Service - Frontend API layer that exactly matches backend order controller
 * This service provides a comprehensive order workflow that aligns with backend tests
 */

import { orderAPI, Order } from './api';
import { toast } from 'react-toastify';
import { logApiCall, logError } from './logger';

/**
 * Cart Item Interface
 */
export interface CartItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  available?: boolean;
}

/**
 * Order Service Class - Comprehensive order workflow
 */
export class OrderService {
  /**
   * Place a new order - matches backend placeOrder controller exactly
   * @param userId - The user placing the order
   * @param storeUsername - The store username
   * @param items - Array of cart items
   * @param options - Additional order options
   */
  static async placeOrder(
    userId: string,
    storeUsername: string,
    items: CartItem[],
    options: {
      orderName?: string;
      phone?: string;
      address_details?: string;
      deliveryLat?: number;
      deliveryLng?: number;
      isTakeout: boolean;
      deliveryFee: number;
    }
  ): Promise<string> {
    try {
      logApiCall('/orders/place', 'POST', false);

      // Transform items to match backend expected format
      const orderItems = items.map(item => ({
        _id: item._id || item.productId, // Support both formats
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const orderData = {
        userId,
        storeUserName: storeUsername,
        orderName: options.orderName || `Order ${new Date().toLocaleDateString()}`,
        phone: options.phone,
        address_details: options.address_details,
        deliveryLat: options.deliveryLat,
        deliveryLng: options.deliveryLng,
        isTakeout: options.isTakeout,
        deliveryFee: options.deliveryFee,
        amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        items: orderItems
      };

      const response = await orderAPI.placeOrder(orderData);

      if (response.success && response.data) {
        logApiCall('/orders/place', 'POST', true);
        toast.success('Order placed successfully!');
        return response.data.orderId;
      } else {
        logApiCall('/orders/place', 'POST', false, { message: response.message });
        toast.error(response.message || 'Failed to place order');
        throw new Error(response.message || 'Order placement failed');
      }
    } catch (error: any) {
      logError(error, 'OrderService.placeOrder');
      toast.error(error.message || 'Failed to place order');
      throw error;
    }
  }

  /**
   * Get orders for current user based on role
   */
  static async getUserOrders(role: string): Promise<Order[]> {
    try {
      let response;

      if (role === 'customer') {
        response = await orderAPI.getUserOrders();
      } else if (role === 'store') {
        response = await orderAPI.getStoreOrders();
      } else if (role === 'driver') {
        response = await orderAPI.getDriverOrders();
      } else {
        throw new Error('Invalid user role');
      }

      if (response.success) {
        return response.data || [];
      } else {
        toast.error(response.message || 'Failed to fetch orders');
        return [];
      }
    } catch (error: any) {
      logError(error, 'OrderService.getUserOrders');
      toast.error(error.message || 'Failed to fetch orders');
      return [];
    }
  }

  /**
   * Store accepts an order
   */
  static async acceptOrderByStore(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.acceptByStore(orderId);
      if (response.success) {
        toast.success('Order accepted successfully!');
        return true;
      } else {
        toast.error(response.message || 'Failed to accept order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.acceptOrderByStore');
      toast.error(error.message || 'Failed to accept order');
      return false;
    }
  }

  /**
   * Store rejects an order
   */
  static async rejectOrderByStore(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.rejectByStore(orderId);
      if (response.success) {
        toast.success('Order rejected');
        return true;
      } else {
        toast.error(response.message || 'Failed to reject order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.rejectOrderByStore');
      toast.error(error.message || 'Failed to reject order');
      return false;
    }
  }

  /**
   * Store prepares an order
   */
  static async prepareOrder(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.prepareOrder(orderId);
      if (response.success) {
        toast.success('Order marked as prepared!');
        return true;
      } else {
        toast.error(response.message || 'Failed to prepare order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.prepareOrder');
      toast.error(error.message || 'Failed to prepare order');
      return false;
    }
  }

  /**
   * Driver accepts an order
   */
  static async acceptOrderByDriver(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.acceptByDriver(orderId);
      if (response.success) {
        toast.success('Order accepted for delivery!');
        return true;
      } else {
        toast.error(response.message || 'Failed to accept order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.acceptOrderByDriver');
      toast.error(error.message || 'Failed to accept order');
      return false;
    }
  }

  /**
   * Driver picks up an order
   */
  static async pickupOrder(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.pickupOrder(orderId);
      if (response.success) {
        toast.success('Order picked up!');
        return true;
      } else {
        toast.error(response.message || 'Failed to pickup order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.pickupOrder');
      toast.error(error.message || 'Failed to pickup order');
      return false;
    }
  }

  /**
   * Driver delivers an order
   */
  static async deliverOrder(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.deliverOrder(orderId);
      if (response.success) {
        toast.success('Order delivered!');
        return true;
      } else {
        toast.error(response.message || 'Failed to deliver order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.deliverOrder');
      toast.error(error.message || 'Failed to deliver order');
      return false;
    }
  }

  /**
   * Customer receives an order
   */
  static async receiveOrder(orderId: string): Promise<boolean> {
    try {
      const response = await orderAPI.receiveOrder(orderId);
      if (response.success) {
        toast.success('Order received!');
        return true;
      } else {
        toast.error(response.message || 'Failed to confirm receipt');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.receiveOrder');
      toast.error(error.message || 'Failed to confirm receipt');
      return false;
    }
  }

  /**
   * Adjust preparation time
   */
  static async adjustPreparationTime(orderId: string, minutes: number): Promise<boolean> {
    try {
      const response = await orderAPI.adjustPreparationTime(orderId, minutes);
      if (response.success) {
        toast.success(`Preparation time adjusted by ${minutes} minutes`);
        return true;
      } else {
        toast.error(response.message || 'Failed to adjust preparation time');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.adjustPreparationTime');
      toast.error(error.message || 'Failed to adjust preparation time');
      return false;
    }
  }

  /**
   * Adjust pickup time
   */
  static async adjustPickupTime(orderId: string, minutes: number): Promise<boolean> {
    try {
      const response = await orderAPI.adjustPickupTime(orderId, minutes);
      if (response.success) {
        toast.success(`Pickup time adjusted by ${minutes} minutes`);
        return true;
      } else {
        toast.error(response.message || 'Failed to adjust pickup time');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.adjustPickupTime');
      toast.error(error.message || 'Failed to adjust pickup time');
      return false;
    }
  }

  /**
   * Adjust delivery time
   */
  static async adjustDeliveryTime(orderId: string, minutes: number): Promise<boolean> {
    try {
      const response = await orderAPI.adjustDeliveryTime(orderId, minutes);
      if (response.success) {
        toast.success(`Delivery time adjusted by ${minutes} minutes`);
        return true;
      } else {
        toast.error(response.message || 'Failed to adjust delivery time');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.adjustDeliveryTime');
      toast.error(error.message || 'Failed to adjust delivery time');
      return false;
    }
  }

  /**
   * Add customer feedback to an order
   */
  static async addFeedback(
    orderId: string,
    rating: number,
    comment?: string,
    reactions?: string[]
  ): Promise<boolean> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const feedbackData = {
        orderId,
        rating,
        comment: comment?.trim(),
        reactions
      };

      const response = await orderAPI.addFeedback(feedbackData);

      if (response.success) {
        toast.success('Thank you for your feedback!');
        return true;
      } else {
        toast.error(response.message || 'Failed to submit feedback');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.addFeedback');
      toast.error(error.message || 'Failed to submit feedback');
      return false;
    }
  }

  /**
   * Get available orders for driver
   */
  static async getAvailableOrdersForDriver(): Promise<Order[]> {
    try {
      const response = await orderAPI.getAvailableForDriver();
      if (response.success) {
        return response.data || [];
      } else {
        toast.error(response.message || 'Failed to fetch available orders');
        return [];
      }
    } catch (error: any) {
      logError(error, 'OrderService.getAvailableOrdersForDriver');
      toast.error(error.message || 'Failed to fetch available orders');
      return [];
    }
  }

  /**
   * Get progress for multiple orders
   */
  static async getOrdersProgress(orderIds: string[]): Promise<Record<string, any>> {
    try {
      const response = await orderAPI.getOrdersProgress(orderIds);
      if (response.success && response.data) {
        const progressMap: Record<string, any> = {};
        response.data.forEach((progress: any) => {
          progressMap[progress._id] = progress;
        });
        return progressMap;
      } else {
        toast.error(response.message || 'Failed to fetch order progress');
        return {};
      }
    } catch (error: any) {
      logError(error, 'OrderService.getOrdersProgress');
      toast.error(error.message || 'Failed to fetch order progress');
      return {};
    }
  }

  /**
   * Get store order counts
   */
  static async getStoreOrderCounts(): Promise<{ placed: number; preparation: number }> {
    try {
      // This endpoint doesn't exist in the current API, but we can simulate it
      // by fetching all orders and counting
      const response = await orderAPI.getStoreOrders();
      if (response.success) {
        const orders = response.data || [];
        const placed = orders.filter((order: any) => order.status === 'placed' && order.isActive).length;
        const preparation = orders.filter((order: any) => ['accepted', 'prepared'].includes(order.status) && order.isActive).length;
        return { placed, preparation };
      } else {
        toast.error(response.message || 'Failed to fetch order counts');
        return { placed: 0, preparation: 0 };
      }
    } catch (error: any) {
      logError(error, 'OrderService.getStoreOrderCounts');
      toast.error(error.message || 'Failed to fetch order counts');
      return { placed: 0, preparation: 0 };
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string, userId: string, role: string): Promise<boolean> {
    try {
      const cancelData = {
        orderId,
        [role === 'customer' ? 'userId' : role === 'store' ? 'storeId' : 'driverId']: userId
      };

      // Use the cancel endpoint directly
      const response = await orderAPI.cancelOrder(cancelData);

      if (response.success) {
        toast.success('Order canceled successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to cancel order');
        return false;
      }
    } catch (error: any) {
      logError(error, 'OrderService.cancelOrder');
      toast.error(error.message || 'Failed to cancel order');
      return false;
    }
  }
}

/**
 * Order Workflow Helper - State machine for order processing
 */
export class OrderWorkflow {
  static getNextActions(order: any, userRole: string): string[] {
    const actions: string[] = [];

    if (userRole === 'store') {
      if (order.status === 'placed') {
        actions.push('accept_store', 'reject_store');
      } else if (order.status === 'accepted') {
        actions.push('prepare');
        actions.push('adjust_prepare_5', 'adjust_prepare_3', 'adjust_prepare_1',
                   'adjust_prepare_-1', 'adjust_prepare_-3', 'adjust_prepare_-5');
      }
    } else if (userRole === 'driver') {
      // Check if this is an available order (no driver assigned yet)
      const isAvailableOrder = !order.driver && order.stateGiven === 'by-store';

      if (isAvailableOrder && order.isTakeout) {
        actions.push('accept_driver');
      } else if (order.driver && order.isTakeout) {
        // Show pickup button when order is prepared or accepted-by-driver
        if (order.status === 'prepared' || order.status === 'accepted-by-driver') {
          actions.push('pickup');
        }
        
        // Time adjustment section - show for accepted orders (after driver accepts, before pickup)
        if (order.status === 'accepted' || order.status === 'accepted-by-driver') {
          actions.push('adjust_pickup_5', 'adjust_pickup_3', 'adjust_pickup_1',
                     'adjust_pickup_-1', 'adjust_pickup_-3', 'adjust_pickup_-5');
        }

        // Show deliver button when order is picked up
        if (order.status === 'pickedup') {
          actions.push('deliver');
          actions.push('adjust_deliver_5', 'adjust_deliver_3', 'adjust_deliver_1',
                     'adjust_deliver_-1', 'adjust_deliver_-3', 'adjust_deliver_-5');
        }
      }
    } else if (userRole === 'customer') {
      if (['pickedup', 'prepared', 'delivered'].includes(order.status)) {
        actions.push('receive');
      }
      if (order.status === 'received' && !order.customerRating) {
        actions.push('feedback');
      }
    }

    return actions;
  }

  static canCancelOrder(order: Order, userRole: string): boolean {
    const cancellableStatuses = ['placed', 'accepted', 'prepared'];
    return cancellableStatuses.includes(order.status) &&
           ((userRole === 'customer' && !!order.user) ||
            (userRole === 'store' && !!order.store) ||
            (userRole === 'driver' && !!order.driver));
  }
}

/**
 * Order Validation Utilities
 */
export class OrderValidation {
  static validateOrderData(orderData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.userId) {
      errors.push('User ID is required');
    }

    if (!orderData.storeUserName) {
      errors.push('Store username is required');
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      for (const item of orderData.items) {
        if (!item._id && !item.productId) {
          errors.push(`Item ${item.name} is missing product ID`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${item.name} has invalid quantity`);
        }
      }
    }

    if (!orderData.amount || orderData.amount <= 0) {
      errors.push('Order amount must be positive');
    }

    if (orderData.isTakeout === undefined) {
      errors.push('Delivery type (isTakeout) is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}