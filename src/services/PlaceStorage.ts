import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../types/placePrediction';

const STORAGE_KEYS = {
  FAVORITES: '@places_favorites',
  HISTORY: '@places_history',
  LAST_USED: '@places_last_used',
  USER_PREFERENCES: '@places_user_preferences',
};

// Maximum number of items to store in history
const MAX_HISTORY_ITEMS = 10;

export class PlaceStorage {
  /**
   * Save a place to favorites
   */
  static async saveFavorite(place: PlacePrediction): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      
      // Check if place already exists in favorites
      const exists = favorites.some(fav => fav.placeId === place.placeId);
      
      if (!exists) {
        // Add place to favorites
        const newFavorites = [place, ...favorites];
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
      }
    } catch (error: any) {
      console.error('Error saving favorite place:', error);
    }
  }

  /**
   * Remove a place from favorites
   */
  static async removeFavorite(placeId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const newFavorites = favorites.filter(place => place.placeId !== placeId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
    } catch (error: any) {
      console.error('Error removing favorite place:', error);
    }
  }

  /**
   * Get all favorite places
   */
  static async getFavorites(): Promise<PlacePrediction[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error: any) {
      console.error('Error getting favorite places:', error);
      return [];
    }
  }

  /**
   * Check if a place is in favorites
   */
  static async isFavorite(placeId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(place => place.placeId === placeId);
    } catch (error: any) {
      console.error('Error checking if place is favorite:', error);
      return false;
    }
  }

  /**
   * Add a place to history
   */
  static async addToHistory(place: PlacePrediction): Promise<void> {
    try {
      const history = await this.getHistory();
      
      // Remove if already exists to avoid duplicates
      const filteredHistory = history.filter(item => item.placeId !== place.placeId);
      
      // Add to beginning of array and limit to max items
      const newHistory = [place, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
      
      // Also save as last used place
      await this.saveLastUsedPlace(place);
    } catch (error: any) {
      console.error('Error adding place to history:', error);
    }
  }

  /**
   * Get places history
   */
  static async getHistory(): Promise<PlacePrediction[]> {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error: any) {
      console.error('Error getting place history:', error);
      return [];
    }
  }

  /**
   * Clear place history
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    } catch (error: any) {
      console.error('Error clearing place history:', error);
    }
  }

  /**
   * Save last used place
   */
  static async saveLastUsedPlace(place: PlacePrediction): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_USED, JSON.stringify(place));
    } catch (error: any) {
      console.error('Error saving last used place:', error);
    }
  }

  /**
   * Get last used place
   */
  static async getLastUsedPlace(): Promise<PlacePrediction | null> {
    try {
      const lastUsedJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_USED);
      return lastUsedJson ? JSON.parse(lastUsedJson) : null;
    } catch (error: any) {
      console.error('Error getting last used place:', error);
      return null;
    }
  }

  /**
   * Save user preferences for places
   */
  static async saveUserPreferences(preferences: Record<string, any>): Promise<void> {
    try {
      // Get current preferences
      const current = await this.getUserPreferences();
      
      // Merge with new preferences
      const updated = { ...current, ...preferences };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error: any) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Get user preferences for places
   */
  static async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return preferencesJson ? JSON.parse(preferencesJson) : {};
    } catch (error: any) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }
} 