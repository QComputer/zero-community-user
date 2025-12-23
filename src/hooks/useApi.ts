/**
 * Generic API Hook
 * Consolidates common API call patterns across the application
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ApiResponse } from '../services/api';

/**
 * Generic API hook for data fetching
 * @param queryKey - Query key for caching
 * @param apiCall - API function to call
 * @param options - Additional query options
 * @returns useQuery result
 */
export const useApi = <T>(
  queryKey: string | string[],
  apiCall: () => Promise<ApiResponse<T>>,
  options: any = {}
) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        const response = await apiCall();
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('API Error:', error);
        throw new Error(error.message || 'Request failed');
      }
    },
    onError: (error: Error) => {
      console.error('Query Error:', error);
      toast.error(error.message || 'Failed to load data');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    ...options
  });
};

/**
 * Generic API mutation hook for data modifications
 * @param mutationFn - Mutation function
 * @param successMessage - Success message
 * @param errorMessage - Error message
 * @param invalidateQueries - Queries to invalidate on success
 * @returns useMutation result
 */
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  successMessage: string = 'Operation successful',
  errorMessage: string = 'Operation failed',
  invalidateQueries: string[] = []
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('Mutation Error:', error);
        throw new Error(error.message || 'Request failed');
      }
    },
    onSuccess: () => {
      toast.success(successMessage);
      
      // Invalidate queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: (error: Error) => {
      console.error('Mutation Error:', error);
      toast.error(error.message || errorMessage);
    }
  });
};

/**
 * Generic API hook for paginated data
 * @param queryKey - Query key for caching
 * @param apiCall - API function to call
 * @param page - Current page number
 * @param pageSize - Page size
 * @param filters - Filter parameters
 * @returns useQuery result with pagination
 */
export const usePaginatedApi = <T>(
  queryKey: string | string[],
  apiCall: (page: number, pageSize: number, filters?: any) => Promise<ApiResponse<{ data: T[]; pagination: any }>>,
  page: number = 1,
  pageSize: number = 10,
  filters: any = {}
) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) 
      ? [...queryKey, page, pageSize, JSON.stringify(filters)] 
      : [queryKey, page, pageSize, JSON.stringify(filters)],
    queryFn: async () => {
      try {
        const response = await apiCall(page, pageSize, filters);
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('Paginated API Error:', error);
        throw new Error(error.message || 'Failed to load data');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: undefined
  });
};

/**
 * Generic API hook for search functionality
 * @param queryKey - Query key for caching
 * @param apiCall - API function to call
 * @param searchQuery - Search query string
 * @param options - Additional query options
 * @returns useQuery result
 */
export const useSearchApi = <T>(
  queryKey: string | string[],
  apiCall: (searchQuery: string) => Promise<ApiResponse<T[]>>,
  searchQuery: string = '',
  options: any = {}
) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) 
      ? [...queryKey, searchQuery] 
      : [queryKey, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return [];
      }
      try {
        const response = await apiCall(searchQuery);
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data || [];
      } catch (error: any) {
        console.error('Search API Error:', error);
        throw new Error(error.message || 'Failed to search');
      }
    },
    enabled: !!searchQuery.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Generic API hook for real-time data updates
 * @param queryKey - Query key for caching
 * @param apiCall - API function to call
 * @param interval - Polling interval in milliseconds
 * @param options - Additional query options
 * @returns useQuery result
 */
export const useRealTimeApi = <T>(
  queryKey: string | string[],
  apiCall: () => Promise<ApiResponse<T>>,
  interval: number = 30000, // 30 seconds default
  options: any = {}
) => {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        const response = await apiCall();
        if (!response.success) {
          throw new Error(response.message || 'API request failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('Real-time API Error:', error);
        throw new Error(error.message || 'Failed to load real-time data');
      }
    },
    refetchInterval: interval,
    refetchIntervalInBackground: true,
    staleTime: 0, // Always refetch for real-time data
    gcTime: 0, // Don't cache real-time data
    ...options
  });
};

/**
 * Generic API hook for file uploads
 * @param mutationFn - Upload function
 * @param successMessage - Success message
 * @param errorMessage - Error message
 * @param invalidateQueries - Queries to invalidate on success
 * @returns useMutation result
 */
export const useFileUpload = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  successMessage: string = 'File uploaded successfully',
  errorMessage: string = 'File upload failed',
  invalidateQueries: string[] = []
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          throw new Error(response.message || 'File upload failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('File Upload Error:', error);
        throw new Error(error.message || 'File upload failed');
      }
    },
    onSuccess: () => {
      toast.success(successMessage);
      
      // Invalidate queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: (error: Error) => {
      console.error('File Upload Error:', error);
      toast.error(error.message || errorMessage);
    }
  });
};

/**
 * Generic API hook for bulk operations
 * @param mutationFn - Bulk operation function
 * @param successMessage - Success message
 * @param errorMessage - Error message
 * @param invalidateQueries - Queries to invalidate on success
 * @returns useMutation result
 */
export const useBulkOperation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  successMessage: string = 'Bulk operation completed',
  errorMessage: string = 'Bulk operation failed',
  invalidateQueries: string[] = []
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          throw new Error(response.message || 'Bulk operation failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('Bulk Operation Error:', error);
        throw new Error(error.message || 'Bulk operation failed');
      }
    },
    onSuccess: () => {
      toast.success(successMessage);
      
      // Invalidate queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: (error: Error) => {
      console.error('Bulk Operation Error:', error);
      toast.error(error.message || errorMessage);
    }
  });
};

/**
 * Hook for managing optimistic updates
 * @param queryKey - Query key to update
 * @param updateFn - Function to update the data optimistically
 * @param mutationFn - Actual mutation function
 * @param successMessage - Success message
 * @param errorMessage - Error message
 * @returns useMutation result with optimistic updates
 */
export const useOptimisticUpdate = <TData, TVariables>(
  queryKey: string | string[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData,
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  successMessage: string = 'Update successful',
  errorMessage: string = 'Update failed'
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          throw new Error(response.message || 'Update failed');
        }
        return response.data;
      } catch (error: any) {
        console.error('Optimistic Update Error:', error);
        throw new Error(error.message || 'Update failed');
      }
    },
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        Array.isArray(queryKey) ? queryKey : [queryKey],
        (old: TData | undefined) => updateFn(old, variables)
      );

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          context.previousData
        );
      }
      toast.error(error.message || errorMessage);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
    },
    onSuccess: () => {
      toast.success(successMessage);
    }
  });
};