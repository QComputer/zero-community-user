import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

/**
 * Custom hook to detect and manage user role and permissions
 * @returns {Object} User role information and permission checks
 */
export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>('guest');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          setUserRole('guest');
          setLoading(false);
          return;
        }

        // Try to get user account information
        const accountResponse = await authAPI.userAccount();

        if (accountResponse && accountResponse.data) {
          const userData = accountResponse.data;
          setUserRole(userData.role || 'guest');
          setUserId(userData._id || '');
        } else {
          // If account call fails, check local storage for cached user data
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              setUserRole(parsedUser.role || 'guest');
              setUserId(parsedUser.userId || parsedUser._id || '');
            } catch (parseError) {
              console.error('Error parsing cached user data:', parseError);
              setUserRole('guest');
            }
          } else {
            setUserRole('guest');
          }
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setError('Failed to determine user role');
        setUserRole('guest');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [navigate]);

  /**
   * Check if user can edit a specific catalog
   * @param {string} catalogOwnerId - Owner ID of the catalog
   * @returns {boolean} True if user can edit the catalog
   */
  const canEditCatalog = (catalogOwnerId: string): boolean => {
    if (loading) return false;
    if (userRole === 'admin') return true;
    if (userRole === 'store' && userId === catalogOwnerId) return true;
    if (userRole === 'marketer') return true;
    return false;
  };

  /**
   * Check if user can edit advanced settings
   * @returns {boolean} True if user can edit advanced settings
   */
  const canEditAdvancedSettings = (): boolean => {
    if (loading) return false;
    return userRole === 'admin';
  };

  /**
   * Check if user can edit business information
   * @returns {boolean} True if user can edit business information
   */
  const canEditBusinessInfo = (): boolean => {
    if (loading) return false;
    return userRole === 'admin' || userRole === 'store';
  };

  /**
   * Check if user can view catalog (read-only access)
   * @returns {boolean} True if user can view catalogs
   */
  const canViewCatalog = (): boolean => {
    if (loading) return false;
    return ['admin', 'store', 'marketer', 'customer'].includes(userRole);
  };

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  const isAuthenticated = (): boolean => {
    if (loading) return false;
    return userRole !== 'guest';
  };

  return {
    userRole,
    userId,
    loading,
    error,
    canEditCatalog,
    canEditAdvancedSettings,
    canEditBusinessInfo,
    canViewCatalog,
    isAuthenticated,
    refreshUserRole: async () => {
      setLoading(true);
      try {
        const accountResponse = await authAPI.userAccount();
        if (accountResponse && accountResponse.data) {
          const userData = accountResponse.data;
          setUserRole(userData.role || 'guest');
          setUserId(userData._id || '');
        }
      } catch (err) {
        console.error('Error refreshing user role:', err);
      } finally {
        setLoading(false);
      }
    }
  };
};