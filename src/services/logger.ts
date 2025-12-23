// Frontend logging functions using console for browser compatibility
export const logUserAction = (action: string, details?: any) => {
  console.log('User Action', { action, details, timestamp: new Date().toISOString() });
};

export const logApiCall = (endpoint: string, method: string, success: boolean, details?: any) => {
  if (success) {
    console.log('API Call Success', { endpoint, method, details, timestamp: new Date().toISOString() });
  } else {
    console.warn('API Call Failed', { endpoint, method, details, timestamp: new Date().toISOString() });
  }
};

export const logError = (error: Error, context?: string) => {
  console.error('Frontend Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logNavigation = (from: string, to: string) => {
  console.log('Navigation', { from, to, timestamp: new Date().toISOString() });
};