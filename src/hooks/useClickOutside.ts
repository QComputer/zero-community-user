import { useEffect, useRef } from 'react';

/**
 * Custom hook for detecting clicks outside a referenced element
 * @param callback - Function to call when clicking outside
 * @param deps - Dependency array for the callback
 */
export const useClickOutside = <T extends HTMLElement>(
  callback: () => void,
  deps: React.DependencyList = []
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add event listener when the component mounts
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, deps); // Re-run effect if dependencies change

  return ref;
};

export default useClickOutside;