import { useState, useEffect } from 'react';
import propertyCategories, { Category } from '../data/categories';

/**
 * Custom hook for accessing property categories
 * @returns An object with categories array and loading state
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // In a real app, this might be a fetch from an API
      setCategories(propertyCategories);
      setLoading(false);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
      setLoading(false);
    }
  }, []);

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(category => category.id === id);
  };

  return {
    categories,
    loading,
    error,
    getCategoryById
  };
}; 