import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: 'text' | 'place';
  data?: any; // Dati aggiuntivi specifici per il tipo
}

interface UseSearchHistoryOptions {
  maxItems?: number;
  storageKey?: string;
}

/**
 * Hook per gestire la cronologia delle ricerche
 * @param options Opzioni di configurazione
 */
const useSearchHistory = (options: UseSearchHistoryOptions = {}) => {
  const {
    maxItems = 10,
    storageKey = '@ineout_search_history'
  } = options;
  
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica la cronologia all'avvio
  useEffect(() => {
    loadHistory();
  }, []);

  // Carica la cronologia da AsyncStorage
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedHistory = await AsyncStorage.getItem(storageKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error('Error loading search history:', err);
      setError(err instanceof Error ? err.message : 'Error loading search history');
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Salva la cronologia in AsyncStorage
  const saveHistory = useCallback(async (newHistory: SearchHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (err) {
      console.error('Error saving search history:', err);
      setError(err instanceof Error ? err.message : 'Error saving search history');
    }
  }, [storageKey]);

  // Aggiungi un elemento alla cronologia
  const addToHistory = useCallback(async (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    setIsLoading(true);
    try {
      // Crea un nuovo elemento con id e timestamp
      const newItem: SearchHistoryItem = {
        ...item,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now()
      };

      // Rimuovi eventuali duplicati (stessa query)
      const filteredHistory = history.filter(
        h => h.query.toLowerCase() !== item.query.toLowerCase()
      );
      
      // Aggiungi il nuovo elemento all'inizio dell'array
      const newHistory = [newItem, ...filteredHistory].slice(0, maxItems);
      
      setHistory(newHistory);
      await saveHistory(newHistory);
    } catch (err) {
      console.error('Error adding to search history:', err);
      setError(err instanceof Error ? err.message : 'Error adding to search history');
    } finally {
      setIsLoading(false);
    }
  }, [history, maxItems, saveHistory]);

  // Rimuovi un elemento dalla cronologia
  const removeFromHistory = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      await saveHistory(newHistory);
    } catch (err) {
      console.error('Error removing from search history:', err);
      setError(err instanceof Error ? err.message : 'Error removing from search history');
    } finally {
      setIsLoading(false);
    }
  }, [history, saveHistory]);

  // Cancella tutta la cronologia
  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setHistory([]);
      await AsyncStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Error clearing search history:', err);
      setError(err instanceof Error ? err.message : 'Error clearing search history');
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  return {
    history,
    isLoading,
    error,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadHistory
  };
};

export default useSearchHistory; 