import { useState, useEffect } from 'react';
import allCities from '../data/cities';

/**
 * Custom hook for accessing city data
 * @returns An object with cities array and loading state
 */
export const useCities = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // In a real app, this might be a fetch from an API
      setCities(allCities);
      setLoading(false);
    } catch (err) {
      console.error('Error loading cities:', err);
      setError('Failed to load cities');
      setLoading(false);
    }
  }, []);

  return {
    cities,
    loading,
    error
  };
}; 