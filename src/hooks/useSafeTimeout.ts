import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook that provides safe timeout functions to avoid memory leaks
 * All timeouts created with this hook are automatically cleared when the component unmounts
 */
export const useSafeTimeout = () => {
  const timeoutRefs = useRef<number[]>([]);

  /**
   * Safe version of setTimeout that automatically clears when the component unmounts
   * @param callback Function to execute after the timer expires
   * @param delay Delay in milliseconds
   * @returns Timeout ID that can be used with clearTimeout
   */
  const setTimeout = useCallback((callback: () => void, delay: number): number => {
    const id = window.setTimeout(() => {
      callback();
      // Remove the timeout ID from refs after execution
      timeoutRefs.current = timeoutRefs.current.filter(timeoutId => timeoutId !== id);
    }, delay);

    // Store the timeout ID
    timeoutRefs.current.push(id);
    return id;
  }, []);

  /**
   * Clears a timeout and removes it from tracking
   * @param id The timeout ID to clear
   */
  const clearTimeout = useCallback((id: number): void => {
    window.clearTimeout(id);
    timeoutRefs.current = timeoutRefs.current.filter(timeoutId => timeoutId !== id);
  }, []);

  /**
   * Clears all timeouts created with this hook
   */
  const clearAllTimeouts = useCallback((): void => {
    timeoutRefs.current.forEach(window.clearTimeout);
    timeoutRefs.current = [];
  }, []);

  // Clean up all timeouts when the component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return { setTimeout, clearTimeout, clearAllTimeouts };
};

export default useSafeTimeout; 