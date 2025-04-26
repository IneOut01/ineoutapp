import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../types/placePrediction';

// Chiavi di storage
const FAVORITE_PLACES_KEY = '@ineout:favoritePlaces';
const HISTORY_PLACES_KEY = '@ineout:historyPlaces';
const PLACE_PREFERENCES_KEY = '@ineout:placePreferences';

// Numero massimo di elementi nella cronologia
const MAX_HISTORY_ITEMS = 20;

/**
 * Servizio per memorizzare e recuperare i luoghi preferiti e la cronologia
 */
export const PlaceStorage = {
  /**
   * Salva un luogo nei preferiti
   */
  async addToFavorites(place: PlacePrediction): Promise<void> {
    try {
      // Recupera i preferiti esistenti
      const favorites = await this.getFavorites();
      
      // Verifica se il luogo è già nei preferiti
      const existingIndex = favorites.findIndex(p => p.placeId === place.placeId);
      
      if (existingIndex >= 0) {
        // Se esiste già, rimuoviamo il vecchio e aggiungiamo quello nuovo all'inizio
        favorites.splice(existingIndex, 1);
      }
      
      // Aggiungiamo il luogo con il flag isFavorite
      const placeToSave: PlacePrediction = {
        ...place,
        isFavorite: true,
        source: 'favorite',
        lastUsed: Date.now()
      };
      
      favorites.unshift(placeToSave);
      
      // Salviamo i preferiti aggiornati
      await AsyncStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Errore nel salvataggio del preferito:', error);
    }
  },
  
  /**
   * Rimuove un luogo dai preferiti
   */
  async removeFromFavorites(placeId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(place => place.placeId !== placeId);
      await AsyncStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Errore nella rimozione del preferito:', error);
    }
  },
  
  /**
   * Ottiene tutti i luoghi preferiti
   */
  async getFavorites(): Promise<PlacePrediction[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_PLACES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Errore nel recupero dei preferiti:', error);
      return [];
    }
  },
  
  /**
   * Verifica se un luogo è nei preferiti
   */
  async isFavorite(placeId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(place => place.placeId === placeId);
    } catch (error) {
      console.error('Errore nella verifica del preferito:', error);
      return false;
    }
  },
  
  /**
   * Aggiunge un luogo alla cronologia
   */
  async addToHistory(place: PlacePrediction): Promise<void> {
    try {
      // Recupera la cronologia
      const history = await this.getHistory();
      
      // Rimuove il luogo se già presente
      const filteredHistory = history.filter(p => p.placeId !== place.placeId);
      
      // Prepara il luogo per il salvataggio nella cronologia
      const placeToSave: PlacePrediction = {
        ...place,
        source: 'history',
        lastUsed: Date.now(),
        usageCount: ((history.find(p => p.placeId === place.placeId)?.usageCount || 0) + 1)
      };
      
      // Aggiunge il nuovo luogo all'inizio
      filteredHistory.unshift(placeToSave);
      
      // Limita la lunghezza della cronologia
      const truncatedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS);
      
      // Salva la cronologia aggiornata
      await AsyncStorage.setItem(HISTORY_PLACES_KEY, JSON.stringify(truncatedHistory));
      
      // Aggiorna le statistiche di utilizzo
      await this.updatePlaceUsageStats(place.placeId);
    } catch (error) {
      console.error('Errore nel salvataggio nella cronologia:', error);
    }
  },
  
  /**
   * Recupera la cronologia dei luoghi
   */
  async getHistory(): Promise<PlacePrediction[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_PLACES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Errore nel recupero della cronologia:', error);
      return [];
    }
  },
  
  /**
   * Cancella la cronologia
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_PLACES_KEY);
    } catch (error) {
      console.error('Errore nella cancellazione della cronologia:', error);
    }
  },
  
  /**
   * Aggiorna le statistiche di utilizzo di un luogo
   */
  async updatePlaceUsageStats(placeId: string): Promise<void> {
    try {
      // Recupera le preferenze esistenti
      const preferences = await this.getPlacePreferences();
      
      // Aggiorna o crea le statistiche per questo luogo
      preferences[placeId] = {
        ...(preferences[placeId] || {}),
        lastUsed: Date.now(),
        usageCount: (preferences[placeId]?.usageCount || 0) + 1
      };
      
      // Salva le preferenze aggiornate
      await AsyncStorage.setItem(PLACE_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle statistiche di utilizzo:', error);
    }
  },
  
  /**
   * Recupera le preferenze degli utenti per i luoghi
   */
  async getPlacePreferences(): Promise<Record<string, { lastUsed: number; usageCount: number }>> {
    try {
      const data = await AsyncStorage.getItem(PLACE_PREFERENCES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Errore nel recupero delle preferenze dei luoghi:', error);
      return {};
    }
  },
  
  /**
   * Recupera i luoghi usati più frequentemente
   */
  async getFrequentlyUsedPlaces(limit = 5): Promise<PlacePrediction[]> {
    try {
      const history = await this.getHistory();
      return [...history]
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Errore nel recupero dei luoghi frequenti:', error);
      return [];
    }
  },
  
  /**
   * Recupera i luoghi usati recentemente
   */
  async getRecentlyUsedPlaces(limit = 5): Promise<PlacePrediction[]> {
    try {
      const history = await this.getHistory();
      return [...history]
        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Errore nel recupero dei luoghi recenti:', error);
      return [];
    }
  },
  
  /**
   * Recupera luoghi personalizzati in base al testo di input
   */
  async getPersonalizedPlaces(input: string, limit = 5): Promise<PlacePrediction[]> {
    try {
      // Ottieni sia i preferiti che la cronologia
      const favorites = await this.getFavorites();
      const history = await this.getHistory();
      
      // Combina le liste evitando duplicati (favoriti hanno la precedenza)
      const allPlaces: PlacePrediction[] = [
        ...favorites,
        ...history.filter(h => !favorites.some(f => f.placeId === h.placeId))
      ];
      
      // Filtra per testo di input (se presente)
      const lowercaseInput = input.toLowerCase();
      const filtered = input
        ? allPlaces.filter(
            place => 
              place.description.toLowerCase().includes(lowercaseInput) ||
              place.mainText.toLowerCase().includes(lowercaseInput) ||
              (place.secondaryText && place.secondaryText.toLowerCase().includes(lowercaseInput))
          )
        : allPlaces;
      
      // Ordina per più recenti o più usati
      return filtered
        .sort((a, b) => {
          // Favoriti hanno precedenza
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          
          // Poi per frequenza d'uso
          const usageCountDiff = (b.usageCount || 0) - (a.usageCount || 0);
          if (usageCountDiff !== 0) return usageCountDiff;
          
          // Infine per data di ultimo utilizzo
          return (b.lastUsed || 0) - (a.lastUsed || 0);
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Errore nel recupero dei luoghi personalizzati:', error);
      return [];
    }
  }
};

export default PlaceStorage; 