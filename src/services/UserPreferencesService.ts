import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../types/placePrediction';

// Chiavi storage
const STORAGE_KEYS = {
  FAVORITES: '@InEout:places_favorites',
  HISTORY: '@InEout:places_history',
  USER_PREFERENCES: '@InEout:user_preferences',
  SEARCH_WEIGHTS: 'ineout_search_weights',
  CATEGORY_PREFERENCES: 'ineout_category_preferences',
};

// Limite per le entry nella cronologia
const MAX_HISTORY_ITEMS = 20;

// Interfaccia per le preferenze dell'utente
interface UserPreferences {
  // Tipi di luoghi più frequentemente cercati dall'utente
  preferredPlaceTypes: Record<string, number>;
  // Città/aree più frequentemente cercate dall'utente
  preferredAreas: Record<string, number>; 
  // Orari del giorno in cui l'utente fa più ricerche
  searchTimePatterns: Record<string, number>;
  // Se l'utente preferisce risultati in base alla distanza
  distanceSensitive: boolean;
  // Se l'utente tende a selezionare prime voci o a scorrere la lista
  selectionBehavior: 'quick' | 'explorer' | 'undetermined';
  // Ultima posizione ricercata
  lastSearchLocation?: {
    lat: number;
    lng: number;
    timestamp: number;
  };
}

// Preferenze utente predefinite
const DEFAULT_PREFERENCES: UserPreferences = {
  preferredPlaceTypes: {},
  preferredAreas: {},
  searchTimePatterns: {},
  distanceSensitive: true,
  selectionBehavior: 'undetermined'
};

/**
 * Service for managing user's place preferences and learning behavior
 */
class UserPreferencesService {
  private preferences: UserPreferences = DEFAULT_PREFERENCES;
  private favorites: PlacePrediction[] = [];
  private history: PlacePrediction[] = [];
  private initialized = false;

  // Initial weights for different place types
  private defaultWeights = {
    restaurant: 1.0,
    cafe: 1.0,
    bar: 1.0, 
    lodging: 1.0,
    store: 1.0,
    park: 1.0,
    point_of_interest: 1.0,
    establishment: 1.0,
  };

  /**
   * Inizializza il servizio caricando i dati da AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Carica preferenze
      const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (preferencesJson) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(preferencesJson) };
      }
      
      // Carica preferiti
      const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (favoritesJson) {
        this.favorites = JSON.parse(favoritesJson);
      }
      
      // Carica cronologia
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyJson) {
        this.history = JSON.parse(historyJson);
      }
      
      this.initialized = true;
    } catch (error: any) {
      console.error('Errore durante il caricamento delle preferenze utente:', error);
      // In caso di errore, utilizziamo i valori predefiniti
      this.preferences = { ...DEFAULT_PREFERENCES };
      this.favorites = [];
      this.history = [];
      this.initialized = true;
    }
  }

  /**
   * Salva tutte le preferenze utente in AsyncStorage
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.preferences));
    } catch (error: any) {
      console.error('Errore durante il salvataggio delle preferenze utente:', error);
    }
  }

  /**
   * Salva i preferiti in AsyncStorage
   */
  private async saveFavorites(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
    } catch (error: any) {
      console.error('Errore durante il salvataggio dei preferiti:', error);
    }
  }

  /**
   * Salva la cronologia in AsyncStorage
   */
  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (error: any) {
      console.error('Errore durante il salvataggio della cronologia:', error);
    }
  }

  /**
   * Aggiunge un luogo ai preferiti
   */
  async addFavorite(place: PlacePrediction): Promise<void> {
    await this.initialize();
    
    // Rimuovi dai preferiti se già esiste
    const existingIndex = this.favorites.findIndex(p => p.placeId === place.placeId);
    if (existingIndex >= 0) {
      this.favorites.splice(existingIndex, 1);
    }
    
    // Aggiungi in testa all'array
    const favoritePlace = { 
      ...place, 
      isFavorite: true,
      source: 'favorite' as const
    };
    this.favorites.unshift(favoritePlace);
    
    await this.saveFavorites();
  }

  /**
   * Rimuove un luogo dai preferiti
   */
  async removeFavorite(placeId: string): Promise<void> {
    await this.initialize();
    
    const index = this.favorites.findIndex(p => p.placeId === placeId);
    if (index >= 0) {
      this.favorites.splice(index, 1);
      await this.saveFavorites();
    }
  }

  /**
   * Verifica se un luogo è tra i preferiti
   */
  async isFavorite(placeId: string): Promise<boolean> {
    await this.initialize();
    return this.favorites.some(p => p.placeId === placeId);
  }

  /**
   * Ottiene la lista dei luoghi preferiti
   */
  async getFavorites(): Promise<PlacePrediction[]> {
    await this.initialize();
    return [...this.favorites];
  }

  /**
   * Aggiunge un luogo alla cronologia
   */
  async addToHistory(place: PlacePrediction): Promise<void> {
    await this.initialize();
    
    // Rimuovi dalla cronologia se già esiste
    const existingIndex = this.history.findIndex(p => p.placeId === place.placeId);
    if (existingIndex >= 0) {
      this.history.splice(existingIndex, 1);
    }
    
    // Aggiungi in testa all'array con timestamp e incrementa contatore utilizzo
    const historyPlace = { 
      ...place, 
      recentlyUsed: true,
      lastUsed: Date.now(),
      useCount: ((place.useCount || 0) + 1),
      source: 'history' as const
    };
    this.history.unshift(historyPlace);
    
    // Limita la dimensione della cronologia
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    await this.saveHistory();
    
    // Aggiorna le preferenze utente in base alla selezione
    this.updatePreferencesFromSelection(place);
  }

  /**
   * Ottiene la cronologia dei luoghi recenti
   */
  async getHistory(): Promise<PlacePrediction[]> {
    await this.initialize();
    return [...this.history];
  }

  /**
   * Cancella tutta la cronologia
   */
  async clearHistory(): Promise<void> {
    await this.initialize();
    this.history = [];
    await this.saveHistory();
  }

  /**
   * Aggiorna le preferenze utente in base alla selezione di un luogo
   */
  private async updatePreferencesFromSelection(place: PlacePrediction): Promise<void> {
    // Incrementa il contatore per i tipi di luogo
    if (place.types && place.types.length > 0) {
      for (const type of place.types) {
        this.preferences.preferredPlaceTypes[type] = (this.preferences.preferredPlaceTypes[type] || 0) + 1;
      }
    }
    
    // Estrai la città/area dal testo secondario e incrementa il contatore
    if (place.secondaryText) {
      const areas = place.secondaryText.split(',').map(area => area.trim());
      for (const area of areas) {
        if (area) {
          this.preferences.preferredAreas[area] = (this.preferences.preferredAreas[area] || 0) + 1;
        }
      }
    }
    
    // Registra l'orario di ricerca
    const now = new Date();
    const hour = now.getHours();
    const timeSlot = `${Math.floor(hour / 3) * 3}-${Math.floor(hour / 3) * 3 + 2}`;
    this.preferences.searchTimePatterns[timeSlot] = (this.preferences.searchTimePatterns[timeSlot] || 0) + 1;
    
    await this.savePreferences();
  }

  /**
   * Registra il comportamento di selezione dell'utente
   * @param indexSelected L'indice dell'opzione selezionata
   * @param totalOptions Il numero totale di opzioni disponibili
   * @param timeToSelect Il tempo (in ms) impiegato per selezionare l'opzione
   */
  async recordSelectionBehavior(indexSelected: number, totalOptions: number, timeToSelect: number): Promise<void> {
    await this.initialize();
    
    // Determina il comportamento dell'utente
    // Se seleziona uno dei primi risultati velocemente -> quick
    // Se scorre molto o impiega molto tempo -> explorer
    const isQuickSelection = indexSelected < 2 && timeToSelect < 3000;
    const isExplorerSelection = indexSelected > 2 || timeToSelect > 5000;
    
    // Aggiorna il comportamento in base all'evidenza
    if (isQuickSelection && this.preferences.selectionBehavior !== 'quick') {
      this.preferences.selectionBehavior = 'quick';
    } else if (isExplorerSelection && this.preferences.selectionBehavior !== 'explorer') {
      this.preferences.selectionBehavior = 'explorer';
    }
    
    await this.savePreferences();
  }

  /**
   * Registra la posizione cercata
   */
  async setLastSearchLocation(lat: number, lng: number): Promise<void> {
    await this.initialize();
    
    this.preferences.lastSearchLocation = {
      lat,
      lng,
      timestamp: Date.now()
    };
    
    await this.savePreferences();
  }

  /**
   * Ottiene l'ultima posizione cercata (se recente)
   */
  async getLastSearchLocation(): Promise<{lat: number, lng: number} | null> {
    await this.initialize();
    
    const lastLocation = this.preferences.lastSearchLocation;
    if (!lastLocation) return null;
    
    // Considera valida solo se recente (ultime 24 ore)
    const isRecent = Date.now() - lastLocation.timestamp < 24 * 60 * 60 * 1000;
    return isRecent ? { lat: lastLocation.lat, lng: lastLocation.lng } : null;
  }

  /**
   * Personalizza i risultati di ricerca in base alle preferenze dell'utente
   */
  async personalizePredictions(predictions: PlacePrediction[]): Promise<PlacePrediction[]> {
    await this.initialize();
    
    // Preferenze vuote, nessuna personalizzazione
    if (Object.keys(this.preferences.preferredPlaceTypes).length === 0 && 
        Object.keys(this.preferences.preferredAreas).length === 0) {
      return predictions;
    }
    
    return predictions.map(prediction => {
      let score = 0;
      
      // Incrementa lo score se il tipo di luogo è tra i preferiti
      if (prediction.types) {
        for (const type of prediction.types) {
          score += (this.preferences.preferredPlaceTypes[type] || 0) * 2;
        }
      }
      
      // Incrementa lo score se l'area è tra le preferite
      if (prediction.secondaryText) {
        const areas = prediction.secondaryText.split(',').map(area => area.trim());
        for (const area of areas) {
          score += (this.preferences.preferredAreas[area] || 0) * 3;
        }
      }
      
      return {
        ...prediction,
        _personalizedScore: score
      };
    }).sort((a, b) => {
      // Solo se lo score personalizzato è significativo, modifica l'ordine
      const aScore = (a as any)._personalizedScore || 0;
      const bScore = (b as any)._personalizedScore || 0;
      
      if (Math.abs(aScore - bScore) > 5) {
        return bScore - aScore;
      }
      return 0; // Mantieni l'ordine originale
    });
  }

  /**
   * Ottiene i suggerimenti di ricerca basati su cronologia e preferiti
   */
  async getSuggestions(input?: string): Promise<PlacePrediction[]> {
    await this.initialize();
    
    // Combina cronologia e preferiti
    let suggestions: PlacePrediction[] = [
      ...this.favorites.map(p => ({ ...p, source: 'favorite' as const })),
      ...this.history.map(p => ({ ...p, source: 'history' as const }))
    ];
    
    // Rimuovi duplicati (priorità ai preferiti)
    const uniqueIds = new Set<string>();
    suggestions = suggestions.filter(p => {
      if (uniqueIds.has(p.placeId)) return false;
      uniqueIds.add(p.placeId);
      return true;
    });
    
    // Filtra in base all'input, se fornito
    if (input && input.length > 0) {
      const lowerInput = input.toLowerCase();
      suggestions = suggestions.filter(p => 
        p.description.toLowerCase().includes(lowerInput) ||
        p.mainText.toLowerCase().includes(lowerInput)
      );
    }
    
    return suggestions;
  }

  /**
   * Ottiene le preferenze dell'utente
   */
  async getPreferences(): Promise<UserPreferences> {
    await this.initialize();
    return { ...this.preferences };
  }

  /**
   * Initialize weights from storage or use defaults
   */
  async initializeWeights(): Promise<Record<string, number>> {
    try {
      const storedWeights = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_WEIGHTS);
      if (storedWeights) {
        return JSON.parse(storedWeights);
      }
      
      // Store default weights if none exist
      await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_WEIGHTS, JSON.stringify(this.defaultWeights));
      return this.defaultWeights;
    } catch (error: any) {
      console.error('Error initializing weights:', error);
      return this.defaultWeights;
    }
  }
  
  /**
   * Update weights based on user selection
   */
  async updateWeights(selectedPlace: PlacePrediction): Promise<void> {
    try {
      if (!selectedPlace.types || selectedPlace.types.length === 0) {
        return;
      }
      
      const currentWeights = await this.initializeWeights();
      const updatedWeights = { ...currentWeights };
      
      // Increase weights for the types of the selected place
      selectedPlace.types.forEach(type => {
        if (updatedWeights[type] !== undefined) {
          // Increase weight by 0.1, max 2.0
          updatedWeights[type] = Math.min(updatedWeights[type] + 0.1, 2.0);
        } else {
          // Add new type with default weight
          updatedWeights[type] = 1.0;
        }
      });
      
      // Normalize other weights slightly to prevent excessive skewing
      Object.keys(updatedWeights).forEach(key => {
        if (!selectedPlace.types?.includes(key)) {
          // Slowly decay weights for unused types, min 0.5
          updatedWeights[key] = Math.max(updatedWeights[key] * 0.99, 0.5);
        }
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_WEIGHTS, JSON.stringify(updatedWeights));
    } catch (error: any) {
      console.error('Error updating weights:', error);
    }
  }
  
  /**
   * Track category preferences based on selected places
   */
  async trackCategoryPreference(category: string): Promise<void> {
    try {
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_PREFERENCES);
      const preferences = storedPreferences ? JSON.parse(storedPreferences) : {};
      
      // Increment count for this category
      preferences[category] = (preferences[category] || 0) + 1;
      
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_PREFERENCES, JSON.stringify(preferences));
    } catch (error: any) {
      console.error('Error tracking category preference:', error);
    }
  }
  
  /**
   * Get top user preferences by category
   */
  async getTopCategories(limit = 3): Promise<{category: string, count: number}[]> {
    try {
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_PREFERENCES);
      if (!storedPreferences) {
        return [];
      }
      
      const preferences = JSON.parse(storedPreferences);
      
      // Sort categories by count and return top ones
      return Object.entries(preferences)
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error: any) {
      console.error('Error getting top categories:', error);
      return [];
    }
  }
  
  /**
   * Apply learned preferences to sort prediction results
   */
  async applyPreferences(predictions: PlacePrediction[]): Promise<PlacePrediction[]> {
    try {
      const weights = await this.initializeWeights();
      
      // Create a copy of predictions to avoid modifying originals
      const scoredPredictions = [...predictions];
      
      // Calculate scores based on weights
      scoredPredictions.forEach(prediction => {
        let score = 1.0; // Base score
        
        // Apply weights based on place types
        if (prediction.types && prediction.types.length > 0) {
          prediction.types.forEach(type => {
            if (weights[type]) {
              score *= weights[type];
            }
          });
        }
        
        // Store score as a temporary property
        (prediction as any)._score = score;
      });
      
      // Sort by score (higher first)
      return scoredPredictions
        .sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0))
        .map(p => {
          // Remove temporary score property
          const result = { ...p };
          delete (result as any)._score;
          return result;
        });
    } catch (error: any) {
      console.error('Error applying preferences:', error);
      return predictions; // Return original predictions if error
    }
  }
  
  /**
   * Clear all stored preferences
   */
  async resetPreferences(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.SEARCH_WEIGHTS,
        STORAGE_KEYS.CATEGORY_PREFERENCES
      ]);
    } catch (error: any) {
      console.error('Error resetting preferences:', error);
    }
  }

  searchPlacesByQuery(input: string, limit: number = 5): PlacePrediction[] {
    if (!input || input.length < 2) return [];
    
    const lowerInput = input?.toLowerCase() || '';
    
    return this.history.filter(p => 
      p.description?.toLowerCase().includes(lowerInput) ||
      p.mainText?.toLowerCase().includes(lowerInput)
    ).slice(0, limit);
  }
}

// Singleton instance
export const userPreferencesService = new UserPreferencesService();

export default userPreferencesService; 