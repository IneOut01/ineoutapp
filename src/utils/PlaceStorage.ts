import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction, PlacePreferences } from '../types/placePrediction';

const STORAGE_KEYS = {
  HISTORY: '@PlaceStorage:history',
  FAVORITES: '@PlaceStorage:favorites',
  PREFERENCES: '@PlaceStorage:preferences',
  LAST_USED_LOCATIONS: '@PlaceStorage:lastUsedLocations',
};

const MAX_HISTORY_ITEMS = 30;

class PlaceStorage {
  /**
   * Salva un luogo nella cronologia
   */
  static async addToHistory(place: PlacePrediction): Promise<void> {
    try {
      // Recupera la cronologia esistente
      const history = await this.getHistory();
      
      // Rimuovi se è già presente (per evitare duplicati)
      const filteredHistory = history.filter(item => item.placeId !== place.placeId);
      
      // Aggiungi il nuovo elemento in testa
      const newHistory = [
        {
          ...place,
          source: 'history', 
          lastUsed: Date.now(),
          usageCount: (place.usageCount || 0) + 1
        },
        ...filteredHistory
      ];
      
      // Limita la lunghezza della cronologia
      const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
      
      // Salva la nuova cronologia
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Errore nel salvare nella cronologia', error);
    }
  }

  /**
   * Recupera la cronologia dei luoghi
   */
  static async getHistory(): Promise<PlacePrediction[]> {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Errore nel recuperare la cronologia', error);
      return [];
    }
  }

  /**
   * Svuota la cronologia
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    } catch (error) {
      console.error('Errore nel cancellare la cronologia', error);
    }
  }

  /**
   * Aggiunge o rimuove un luogo dai preferiti
   */
  static async toggleFavorite(place: PlacePrediction): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      
      // Controlla se è già nei preferiti
      const index = favorites.findIndex(item => item.placeId === place.placeId);
      
      if (index >= 0) {
        // Rimuovi dai preferiti
        favorites.splice(index, 1);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        return false; // Non è più un preferito
      } else {
        // Aggiungi ai preferiti
        const newFavorites = [
          ...favorites,
          {
            ...place,
            source: 'favorite',
            isFavorite: true,
            lastUsed: Date.now()
          }
        ];
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
        return true; // È diventato un preferito
      }
    } catch (error) {
      console.error('Errore nel modificare i preferiti', error);
      return false;
    }
  }

  /**
   * Recupera i luoghi preferiti
   */
  static async getFavorites(): Promise<PlacePrediction[]> {
    try {
      const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Errore nel recuperare i preferiti', error);
      return [];
    }
  }

  /**
   * Verifica se un luogo è tra i preferiti
   */
  static async isFavorite(placeId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(item => item.placeId === placeId);
    } catch (error) {
      console.error('Errore nel verificare se è un preferito', error);
      return false;
    }
  }

  /**
   * Salva le preferenze dell'utente
   */
  static async savePreferences(preferences: PlacePreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Errore nel salvare le preferenze', error);
    }
  }

  /**
   * Recupera le preferenze dell'utente
   */
  static async getPreferences(): Promise<PlacePreferences> {
    try {
      const preferences = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Errore nel recuperare le preferenze', error);
      return {};
    }
  }

  /**
   * Salva l'ultima posizione usata per una determinata città
   */
  static async saveLastUsedLocation(city: string, location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const locations = await this.getLastUsedLocations();
      const newLocations = { ...locations, [city.toLowerCase()]: location };
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_USED_LOCATIONS, JSON.stringify(newLocations));
    } catch (error) {
      console.error('Errore nel salvare l\'ultima posizione usata', error);
    }
  }

  /**
   * Recupera l'ultima posizione usata per una città
   */
  static async getLastUsedLocation(city: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const locations = await this.getLastUsedLocations();
      return locations[city.toLowerCase()] || null;
    } catch (error) {
      console.error('Errore nel recuperare l\'ultima posizione usata', error);
      return null;
    }
  }

  /**
   * Recupera tutte le ultime posizioni usate
   */
  static async getLastUsedLocations(): Promise<Record<string, { latitude: number; longitude: number }>> {
    try {
      const locations = await AsyncStorage.getItem(STORAGE_KEYS.LAST_USED_LOCATIONS);
      return locations ? JSON.parse(locations) : {};
    } catch (error) {
      console.error('Errore nel recuperare le ultime posizioni usate', error);
      return {};
    }
  }
}

export default PlaceStorage; 