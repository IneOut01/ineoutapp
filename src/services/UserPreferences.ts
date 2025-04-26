import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacePrediction } from '../types/placePrediction';

// Chiavi di storage per diverse categorie di preferenze utente
const STORAGE_KEYS = {
  RECENT_SEARCHES: 'places:recentSearches',
  FAVORITE_PLACES: 'places:favoritePlaces',
  PREFERRED_CITIES: 'places:preferredCities',
  PREFERRED_TYPES: 'places:preferredTypes',
  USER_PATTERNS: 'places:userPatterns',
};

// Tempo massimo di persistenza dei dati (7 giorni in millisecondi)
const MAX_PERSISTENCE = 7 * 24 * 60 * 60 * 1000;

// Numero massimo di elementi da memorizzare per categoria
const MAX_ITEMS = {
  RECENT_SEARCHES: 20,
  FAVORITE_PLACES: 20,
  PREFERRED_CITIES: 10,
  PREFERRED_TYPES: 10,
  USER_PATTERNS: 50,
};

/**
 * Classe che gestisce le preferenze dell'utente relative ai luoghi
 * Implementa un sistema di apprendimento per migliorare i risultati di ricerca
 */
class UserPreferencesService {
  // Cache in memoria per ridurre le chiamate a AsyncStorage
  private recentSearches: PlacePrediction[] = [];
  private favoritePlaces: PlacePrediction[] = [];
  private preferredCities: { city: string; count: number; lastUsed: number }[] = [];
  private preferredTypes: { type: string; count: number; lastUsed: number }[] = [];
  private userPatterns: { term: string; count: number; lastUsed: number }[] = [];
  private initialized = false;

  /**
   * Inizializza il servizio caricando tutti i dati da AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Carica tutte le preferenze in parallelo
      const [
        recentSearches,
        favoritePlaces,
        preferredCities,
        preferredTypes,
        userPatterns
      ] = await Promise.all([
        this.getFromStorage<PlacePrediction[]>(STORAGE_KEYS.RECENT_SEARCHES, []),
        this.getFromStorage<PlacePrediction[]>(STORAGE_KEYS.FAVORITE_PLACES, []),
        this.getFromStorage<{ city: string; count: number; lastUsed: number }[]>(STORAGE_KEYS.PREFERRED_CITIES, []),
        this.getFromStorage<{ type: string; count: number; lastUsed: number }[]>(STORAGE_KEYS.PREFERRED_TYPES, []),
        this.getFromStorage<{ term: string; count: number; lastUsed: number }[]>(STORAGE_KEYS.USER_PATTERNS, [])
      ]);

      this.recentSearches = recentSearches;
      this.favoritePlaces = favoritePlaces;
      this.preferredCities = preferredCities;
      this.preferredTypes = preferredTypes;
      this.userPatterns = userPatterns;
      
      // Rimuovi i dati scaduti
      this.purgeExpiredData();
      
      this.initialized = true;
    } catch (error) {
      console.error('Errore durante l\'inizializzazione delle preferenze utente:', error);
    }
  }

  /**
   * Recupera dati da AsyncStorage con gestione degli errori
   */
  private async getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) as T : defaultValue;
    } catch (error) {
      console.error(`Errore nel recupero di ${key} da AsyncStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Salva dati in AsyncStorage con gestione degli errori
   */
  private async saveToStorage<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Errore nel salvataggio di ${key} in AsyncStorage:`, error);
    }
  }

  /**
   * Aggiunge una ricerca recente
   */
  async addRecentSearch(prediction: PlacePrediction): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    // Rimuovi duplicati
    this.recentSearches = this.recentSearches.filter(p => p.placeId !== prediction.placeId);
    
    // Aggiungi la nuova predizione all'inizio
    this.recentSearches.unshift({
      ...prediction,
      distance_meters: prediction.distance_meters
    });
    
    // Limita il numero di elementi
    if (this.recentSearches.length > MAX_ITEMS.RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, MAX_ITEMS.RECENT_SEARCHES);
    }
    
    // Aggiorna le statistiche di utilizzo
    this.updatePreferredCities(prediction);
    this.updatePreferredTypes(prediction.types);
    
    // Salva in storage
    await this.saveToStorage(STORAGE_KEYS.RECENT_SEARCHES, this.recentSearches);
  }

  /**
   * Aggiunge o rimuove un luogo dai preferiti
   */
  async toggleFavoritePlace(prediction: PlacePrediction): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    
    const index = this.favoritePlaces.findIndex(p => p.placeId === prediction.placeId);
    let isFavorite = false;
    
    if (index >= 0) {
      // Rimuovi dai preferiti
      this.favoritePlaces.splice(index, 1);
    } else {
      // Aggiungi ai preferiti
      this.favoritePlaces.push(prediction);
      isFavorite = true;
      
      // Limita il numero di elementi
      if (this.favoritePlaces.length > MAX_ITEMS.FAVORITE_PLACES) {
        this.favoritePlaces.shift();
      }
    }
    
    await this.saveToStorage(STORAGE_KEYS.FAVORITE_PLACES, this.favoritePlaces);
    return isFavorite;
  }

  /**
   * Verifica se un luogo è tra i preferiti
   */
  isFavoritePlace(placeId: string): boolean {
    return this.favoritePlaces.some(p => p.placeId === placeId);
  }

  /**
   * Aggiorna le città preferite in base alla nuova selezione
   */
  private updatePreferredCities(prediction: PlacePrediction): void {
    if (!prediction.secondaryText) return;
    
    // Estrai il nome della città (assumendo che sia nella prima parte del testo secondario)
    const city = prediction.secondaryText.split(',')[0].trim();
    const now = Date.now();
    
    // Cerca la città nell'array
    const existingCity = this.preferredCities.find(p => p.city.toLowerCase() === city.toLowerCase());
    
    if (existingCity) {
      // Aggiorna conteggio e timestamp
      existingCity.count += 1;
      existingCity.lastUsed = now;
    } else {
      // Aggiungi nuova città
      this.preferredCities.push({ city, count: 1, lastUsed: now });
    }
    
    // Ordina per conteggio (decrescente)
    this.preferredCities.sort((a, b) => b.count - a.count);
    
    // Limita il numero di elementi
    if (this.preferredCities.length > MAX_ITEMS.PREFERRED_CITIES) {
      this.preferredCities = this.preferredCities.slice(0, MAX_ITEMS.PREFERRED_CITIES);
    }
    
    // Salva in storage
    this.saveToStorage(STORAGE_KEYS.PREFERRED_CITIES, this.preferredCities);
  }

  /**
   * Aggiorna i tipi preferiti in base alla nuova selezione
   */
  private updatePreferredTypes(types: string[]): void {
    if (!types || types.length === 0) return;
    
    const now = Date.now();
    
    // Aggiorna tutti i tipi forniti
    for (const type of types) {
      const existingType = this.preferredTypes.find(p => p.type === type);
      
      if (existingType) {
        existingType.count += 1;
        existingType.lastUsed = now;
      } else {
        this.preferredTypes.push({ type, count: 1, lastUsed: now });
      }
    }
    
    // Ordina per conteggio (decrescente)
    this.preferredTypes.sort((a, b) => b.count - a.count);
    
    // Limita il numero di elementi
    if (this.preferredTypes.length > MAX_ITEMS.PREFERRED_TYPES) {
      this.preferredTypes = this.preferredTypes.slice(0, MAX_ITEMS.PREFERRED_TYPES);
    }
    
    // Salva in storage
    this.saveToStorage(STORAGE_KEYS.PREFERRED_TYPES, this.preferredTypes);
  }

  /**
   * Aggiorna i pattern di ricerca in base alla query
   */
  async updateSearchPattern(query: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!query || query.length < 3) return;
    
    const now = Date.now();
    const term = query?.toLowerCase().trim() || '';
    
    // Cerca il pattern nell'array
    const existingPattern = this.userPatterns.find(p => p.term === term);
    
    if (existingPattern) {
      // Aggiorna conteggio e timestamp
      existingPattern.count += 1;
      existingPattern.lastUsed = now;
    } else {
      // Aggiungi nuovo pattern
      this.userPatterns.push({ term, count: 1, lastUsed: now });
    }
    
    // Ordina per conteggio (decrescente)
    this.userPatterns.sort((a, b) => b.count - a.count);
    
    // Limita il numero di elementi
    if (this.userPatterns.length > MAX_ITEMS.USER_PATTERNS) {
      this.userPatterns = this.userPatterns.slice(0, MAX_ITEMS.USER_PATTERNS);
    }
    
    // Salva in storage
    await this.saveToStorage(STORAGE_KEYS.USER_PATTERNS, this.userPatterns);
  }

  /**
   * Calcola un punteggio per una previsione in base alle preferenze dell'utente
   * Questo punteggio viene utilizzato per ordinare i risultati
   */
  calculatePreferenceScore(prediction: PlacePrediction): number {
    if (!this.initialized) {
      this.initialize();
      return 0;
    }
    
    let score = 0;
    
    // Verifica se è un preferito
    if (this.isFavoritePlace(prediction.placeId)) {
      score += 100;  // Alta priorità per i preferiti
    }
    
    // Verifica se la città è tra le preferite
    if (prediction.secondaryText) {
      const city = prediction.secondaryText.split(',')[0].trim()?.toLowerCase() || '';
      const preferredCity = this.preferredCities.find(p => p.city?.toLowerCase() === city);
      if (preferredCity) {
        score += Math.min(preferredCity.count * 5, 50);  // Max 50 punti per città
      }
    }
    
    // Verifica se il tipo è tra i preferiti
    if (prediction.types && prediction.types.length > 0) {
      for (const type of prediction.types) {
        const preferredType = this.preferredTypes.find(p => p.type === type);
        if (preferredType) {
          score += Math.min(preferredType.count * 3, 30);  // Max 30 punti per tipo
        }
      }
    }
    
    // Tiene conto della distanza se disponibile, dando priorità ai luoghi più vicini
    if (prediction.distance_meters !== undefined) {
      // La distanza influisce inversamente: minore è, maggiore è il punteggio
      const distanceScore = Math.max(0, 20 - (prediction.distance_meters / 1000));
      score += distanceScore;
    }
    
    return score;
  }

  /**
   * Ottiene le ricerche recenti dell'utente
   */
  async getRecentSearches(): Promise<PlacePrediction[]> {
    if (!this.initialized) await this.initialize();
    return this.recentSearches;
  }

  /**
   * Ottiene i luoghi preferiti dell'utente
   */
  async getFavoritePlaces(): Promise<PlacePrediction[]> {
    if (!this.initialized) await this.initialize();
    return this.favoritePlaces;
  }

  /**
   * Ottiene le città preferite dell'utente
   */
  async getPreferredCities(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    return this.preferredCities.map(p => p.city);
  }

  /**
   * Rimuove i dati scaduti da tutte le collezioni
   */
  private purgeExpiredData(): void {
    const now = Date.now();
    const cutoff = now - MAX_PERSISTENCE;

    this.preferredCities = this.preferredCities.filter(item => item.lastUsed > cutoff);
    this.preferredTypes = this.preferredTypes.filter(item => item.lastUsed > cutoff);
    this.userPatterns = this.userPatterns.filter(item => item.lastUsed > cutoff);

    // Salva le modifiche
    this.saveToStorage(STORAGE_KEYS.PREFERRED_CITIES, this.preferredCities);
    this.saveToStorage(STORAGE_KEYS.PREFERRED_TYPES, this.preferredTypes);
    this.saveToStorage(STORAGE_KEYS.USER_PATTERNS, this.userPatterns);
  }
  
  /**
   * Pulisce tutte le preferenze dell'utente (per debugging o reset dell'app)
   */
  async clearAllPreferences(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      
      // Reimposta le variabili in memoria
      this.recentSearches = [];
      this.favoritePlaces = [];
      this.preferredCities = [];
      this.preferredTypes = [];
      this.userPatterns = [];
      
      console.log('Tutte le preferenze utente sono state eliminate');
    } catch (error) {
      console.error('Errore durante la pulizia delle preferenze:', error);
    }
  }
}

// Esporta un'istanza singleton per l'uso nell'app
export const userPreferences = new UserPreferencesService();

export default userPreferences; 