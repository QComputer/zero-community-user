/**
 * Comprehensive Error Handling System for Frontend-Backend Integration
 * This system provides consistent error handling across the application
 */

import { toast } from 'react-toastify';
import { logError } from './logger';

/**
 * Error Types
 */
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;
};

/**
 * Error Handling Utility Class
 */
export class ErrorHandler {
  /**
   * Handle API errors consistently
   */
  static handleApiError(error: any, context: string = 'API Call'): ApiError {
    let apiError: ApiError;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      apiError = {
        message: error.response.data?.message || 'Server error occurred',
        code: error.response.data?.code || 'SERVER_ERROR',
        status: error.response.status,
        details: error.response.data,
        timestamp: new Date().toISOString()
      };

      this.logError(apiError, context);
      this.showUserFriendlyMessage(apiError);
    } else if (error.request) {
      // The request was made but no response was received
      apiError = {
        message: 'No response received from server',
        code: 'NO_RESPONSE',
        status: 0,
        details: { url: error.config?.url },
        timestamp: new Date().toISOString()
      };

      this.logError(apiError, context);
      this.showUserFriendlyMessage(apiError);
    } else {
      // Something happened in setting up the request that triggered an Error
      apiError = {
        message: error.message || 'Request setup error',
        code: 'REQUEST_ERROR',
        status: 0,
        details: { error: error.toString() },
        timestamp: new Date().toISOString()
      };

      this.logError(apiError, context);
      this.showUserFriendlyMessage(apiError);
    }

    return apiError;
  }

  /**
   * Show user-friendly error messages
   */
  private static showUserFriendlyMessage(error: ApiError): void {
    const userFriendlyMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'AUTHENTICATION_FAILED': 'Authentication failed. Please login again.',
      'VALIDATION_ERROR': 'Please check the form for errors.',
      'NOT_FOUND': 'The requested resource was not found.',
      'FORBIDDEN': 'You do not have permission to perform this action.',
      'SERVER_ERROR': 'Server error occurred. Please try again later.',
      'NO_RESPONSE': 'Server is not responding. Please try again later.',
      'REQUEST_ERROR': 'Request could not be completed. Please try again.'
    };

    const message = userFriendlyMessages[error.code || ''] ||
                   error.message ||
                   'An error occurred. Please try again.';

    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }

  /**
   * Log errors with context
   */
  private static logError(error: ApiError, context: string): void {
    logError(new Error(`${context}: ${error.message}`), context);
    console.error('API Error:', {
      context,
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle specific order-related errors
   */
  static handleOrderError(error: any, orderId?: string): ApiError {
    const apiError = this.handleApiError(error, `Order ${orderId || ''}`);

    // Add order-specific error handling
    if (error.response?.data?.message) {
      const orderMessages: Record<string, string> = {
        'Insufficient stock': 'Some items in your order are out of stock.',
        'Product not available': 'Some items are no longer available.',
        'Store not found': 'The selected store is not available.',
        'Order not found': 'The order could not be found.',
        'Cannot cancel order': 'This order cannot be canceled at this stage.',
        'Unauthorized to add feedback': 'You cannot add feedback to this order.'
      };

      const message = error.response.data.message;
      for (const [key, value] of Object.entries(orderMessages)) {
        if (message.includes(key)) {
          toast.error(value);
          break;
        }
      }
    }

    return apiError;
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: any): ApiError {
    const apiError = this.handleApiError(error, 'Authentication');

    if (error.response?.status === 401) {
      // Clear auth token if unauthorized
      localStorage.removeItem('token');
      toast.error('Your session has expired. Please login again.', {
        onClose: () => {
          window.location.href = '/login';
        }
      });
    }

    return apiError;
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: any, fieldName?: string): ApiError {
    const apiError = this.handleApiError(error, `Validation${fieldName ? ` - ${fieldName}` : ''}`);

    if (error.response?.data?.errors) {
      // Display each validation error
      const errors = error.response.data.errors;
      for (const field in errors) {
        toast.error(`${field}: ${errors[field]}`);
      }
    }

    return apiError;
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    message: string,
    code: string = 'GENERIC_ERROR',
    status: number = 400,
    details: any = {}
  ): ApiError {
    return {
      message,
      code,
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if error is related to network issues
   */
  static isNetworkError(error: any): boolean {
    return error.code === 'ECONNABORTED' ||
           error.message === 'Network Error' ||
           (error.response && error.response.status === 0);
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error: any): boolean {
    return error.response?.status === 401 ||
           error.response?.status === 403 ||
           error.message.includes('Not Authorized');
  }
}

/**
 * API Response Validator
 */
export class ResponseValidator {
  static validateSuccessResponse(response: any): boolean {
    if (!response || !response.data) {
      return false;
    }

    if (response.data.success === false) {
      ErrorHandler.handleApiError({
        response: {
          data: response.data,
          status: response.status || 400
        }
      });
      return false;
    }

    if (response.data.success !== true) {
      ErrorHandler.handleApiError({
        response: {
          data: { message: 'Invalid response format' },
          status: 500
        }
      });
      return false;
    }

    return true;
  }

  static getErrorFromResponse(response: any): ApiError | null {
    if (!response || !response.data) {
      return null;
    }

    if (response.data.success === false) {
      return {
        message: response.data.message || 'Request failed',
        code: 'API_ERROR',
        status: response.status || 400,
        details: response.data,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }
}

/**
 * Order Status Validation
 */
export class OrderStatusValidator {
  static validateStatusTransition(currentStatus: string, newStatus: string, role: string): boolean {
    const validTransitions: Record<string, Record<string, string[]>> = {
      customer: {
        placed: ['received'],
        accepted: ['received'],
        prepared: ['received'],
        pickedup: ['received'],
        delivered: ['received']
      },
      store: {
        placed: ['accepted', 'rejected'],
        accepted: ['prepared']
      },
      driver: {
        prepared: ['accepted'],
        accepted: ['pickedup'],
        pickedup: ['delivered']
      }
    };

    const allowedTransitions = validTransitions[role]?.[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  static canCancelOrder(status: string, role: string): boolean {
    const cancellableStatuses: Record<string, string[]> = {
      customer: ['placed', 'accepted', 'prepared'],
      store: ['placed', 'accepted', 'prepared'],
      driver: ['accepted', 'prepared']
    };

    return cancellableStatuses[role]?.includes(status) || false;
  }
}