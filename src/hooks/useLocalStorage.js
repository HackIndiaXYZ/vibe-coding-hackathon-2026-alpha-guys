import { useState, useEffect } from 'react';

/**
 * Custom hook that syncs React state with localStorage.
 * Handles JSON serialization/deserialization automatically.
 * Safe to use — catches all localStorage errors (private browsing, quota exceeded, etc.)
 *
 * @param {string} key          - localStorage key (prefix: "ssa_" for Smart Semester AI)
 * @param {*}      initialValue - Default value if key doesn't exist in storage
 * @returns {[value, setValue, removeValue]} - Tuple of state + setter + remover
 *
 * @example
 * const [courses, setCourses, clearCourses] = useLocalStorage('ssa_courses', []);
 */
export function useLocalStorage(key, initialValue) {

  // Initialize state from localStorage or use the provided initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Return parsed JSON if found; otherwise use initialValue
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Set a new value — persists to localStorage and updates React state.
   * Accepts a direct value OR an updater function (like React's setState).
   *
   * @param {*|Function} value - New value or function (prevValue => newValue)
   */
  const setValue = (value) => {
    try {
      // Support functional updates identical to useState's pattern
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // localStorage may throw if storage quota is exceeded
      console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  };

  /**
   * Remove the key from localStorage and reset state to initialValue.
   */
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  };

  // Sync state when the same key is updated in another tab/window
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (_) {
          // ignore parse errors from cross-tab events
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
