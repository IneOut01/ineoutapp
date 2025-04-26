import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../types/placePrediction';

// Interfaccia per un elemento nella cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Impostazioni per la cache
interface PlacesCacheOptions {
  maxCacheSize?: number;      // Numero massimo di elementi nella cache
  expirationTime?: number;    // Tempo di scadenza in millisecondi
  storageKey?: string;        // Chiave per AsyncStorage
  autoCleanupInterval?: number; // Intervallo per la pulizia automatica
  persistCache?: boolean;     // Se salvare la cache in AsyncStorage
}

// Interfaccia per l'hook di ritorno
interface PlacesCacheReturn {
  getFromCache: <T>(key: string) => T | null;
  addToCache: <T>(key: string, data: T) => void;
  removeFromCache: (key: string) => void;
  clearCache: () => void;
  getCacheStats: () => PlacesCacheStats;
  preloadPlaces: (places: PlacePrediction[]) => Promise<void>;
  isPresentInCache: (key: string) => boolean;
}

// Statistiche della cache
interface PlacesCacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  oldestItem: number;
  newestItem: number;
  mostAccessed: {key: string, count: number} | null;
}

// Tipo per lo storage della cache
type CacheStorage = Record<string, CacheItem<any>>;

/**
 * Hook per gestire la cache intelligente dei luoghi
 */
const usePlacesCache = (options: PlacesCacheOptions = {}): PlacesCacheReturn => {
  // Valori di default
  const {
    maxCacheSize = 100,
    expirationTime = 7 * 24 * 60 * 60 * 1000, // 7 giorni
    storageKey = 'places_cache',
    autoCleanupInterval = 60 * 60 * 1000, // 1 ora
    persistCache = true
  } = options;

  // Variabili interne per statistiche
  const [cacheStorage, setCacheStorage] = useState<CacheStorage>({});
  const [cacheStats, setCacheStats] = useState<{
    hits: number;
    misses: number;
    total: number;
  }>({ hits: 0, misses: 0, total: 0 });

  // Carica la cache da AsyncStorage all'avvio
  useEffect(() => {
    const loadCache = async () => {
      if (persistCache) {
        try {
          const storedCache = await AsyncStorage.getItem(storageKey);
          if (storedCache) {
            setCacheStorage(JSON.parse(storedCache));
          }
        } catch (error) {
          console.error('Errore nel caricare la cache dei luoghi:', error);
        }
      }
    };

    loadCache();
  }, [storageKey, persistCache]);

  // Salva la cache in AsyncStorage quando cambia
  useEffect(() => {
    const saveCache = async () => {
      if (persistCache && Object.keys(cacheStorage).length > 0) {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(cacheStorage));
        } catch (error) {
          console.error('Errore nel salvare la cache dei luoghi:', error);
        }
      }
    };

    saveCache();
  }, [cacheStorage, storageKey, persistCache]);

  // Pulizia automatica della cache
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const updatedCache = { ...cacheStorage };
      let isModified = false;

      // Rimuovi elementi scaduti
      Object.entries(updatedCache).forEach(([key, item]) => {
        if (now - item.timestamp > expirationTime) {
          delete updatedCache[key];
          isModified = true;
        }
      });

      // Se la cache è troppo grande, rimuovi gli elementi meno utilizzati
      if (Object.keys(updatedCache).length > maxCacheSize) {
        const sortedItems = Object.entries(updatedCache).sort((a, b) => {
          // Punteggio basato su frequenza di accesso e recency
          const scoreA = a[1].accessCount * 0.7 + (now - a[1].lastAccessed) * 0.3;
          const scoreB = b[1].accessCount * 0.7 + (now - b[1].lastAccessed) * 0.3;
          return scoreA - scoreB;
        });

        // Rimuovi gli elementi fino a raggiungere maxCacheSize
        const toRemove = sortedItems.slice(0, sortedItems.length - maxCacheSize);
        toRemove.forEach(([key]) => {
          delete updatedCache[key];
        });
        
        isModified = isModified || toRemove.length > 0;
      }

      if (isModified) {
        setCacheStorage(updatedCache);
      }
    };

    // Esegui la pulizia immediatamente e imposta l'intervallo
    cleanup();
    const interval = setInterval(cleanup, autoCleanupInterval);

    return () => clearInterval(interval);
  }, [cacheStorage, expirationTime, maxCacheSize, autoCleanupInterval]);

  // Ottieni un elemento dalla cache
  const getFromCache = useCallback(<T>(key: string): T | null => {
    const now = Date.now();
    const item = cacheStorage[key];

    if (item && now - item.timestamp <= expirationTime) {
      // Aggiorna le statistiche
      setCacheStats(prev => ({
        ...prev,
        hits: prev.hits + 1,
        total: prev.total + 1
      }));

      // Aggiorna il contatore di accesso e il timestamp dell'ultimo accesso
      setCacheStorage(prev => ({
        ...prev,
        [key]: {
          ...item,
          accessCount: item.accessCount + 1,
          lastAccessed: now
        }
      }));

      return item.data as T;
    }

    // Cache miss
    setCacheStats(prev => ({
      ...prev,
      misses: prev.misses + 1,
      total: prev.total + 1
    }));

    return null;
  }, [cacheStorage, expirationTime]);

  // Aggiungi un elemento alla cache
  const addToCache = useCallback(<T>(key: string, data: T): void => {
    const now = Date.now();
    
    setCacheStorage(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now
      }
    }));
  }, []);

  // Rimuovi un elemento dalla cache
  const removeFromCache = useCallback((key: string): void => {
    setCacheStorage(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  // Pulisci tutta la cache
  const clearCache = useCallback((): void => {
    setCacheStorage({});
    if (persistCache) {
      AsyncStorage.removeItem(storageKey).catch(error => {
        console.error('Errore nel rimuovere la cache dei luoghi:', error);
      });
    }
  }, [storageKey, persistCache]);

  // Verifica se un elemento è presente nella cache
  const isPresentInCache = useCallback((key: string): boolean => {
    const now = Date.now();
    const item = cacheStorage[key];
    return !!item && now - item.timestamp <= expirationTime;
  }, [cacheStorage, expirationTime]);

  // Precarica una lista di luoghi nella cache
  const preloadPlaces = useCallback(async (places: PlacePrediction[]): Promise<void> => {
    const now = Date.now();
    const updates: CacheStorage = {};

    places.forEach(place => {
      const key = `place_${place.placeId}`;
      updates[key] = {
        data: place,
        timestamp: now,
        accessCount: 0,
        lastAccessed: now
      };
    });

    setCacheStorage(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Calcola le statistiche della cache
  const getCacheStats = useCallback((): PlacesCacheStats => {
    const now = Date.now();
    const entries = Object.entries(cacheStorage);
    
    if (entries.length === 0) {
      return {
        size: 0,
        hitRate: 0,
        missRate: 0,
        oldestItem: 0,
        newestItem: 0,
        mostAccessed: null
      };
    }

    // Trova l'elemento più vecchio e più nuovo
    let oldestTimestamp = now;
    let newestTimestamp = 0;
    let mostAccessedKey = '';
    let mostAccessedCount = 0;

    entries.forEach(([key, item]) => {
      if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp;
      if (item.timestamp > newestTimestamp) newestTimestamp = item.timestamp;
      if (item.accessCount > mostAccessedCount) {
        mostAccessedKey = key;
        mostAccessedCount = item.accessCount;
      }
    });

    // Calcola hit rate e miss rate
    const { hits, misses, total } = cacheStats;
    const hitRate = total > 0 ? hits / total : 0;
    const missRate = total > 0 ? misses / total : 0;

    return {
      size: entries.length,
      hitRate,
      missRate,
      oldestItem: now - oldestTimestamp,
      newestItem: now - newestTimestamp,
      mostAccessed: mostAccessedCount > 0 ? { key: mostAccessedKey, count: mostAccessedCount } : null
    };
  }, [cacheStorage, cacheStats]);

  return {
    getFromCache,
    addToCache,
    removeFromCache,
    clearCache,
    getCacheStats,
    preloadPlaces,
    isPresentInCache
  };
};

export default usePlacesCache; 