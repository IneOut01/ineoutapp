import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { PlacePrediction } from '../types/placePrediction';
import userPreferences from './UserPreferencesService';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Cache keys
const CACHE_KEYS = {
  PREDICTIONS: 'ineout_predictions_cache_',
  DETAILS: 'ineout_place_details_cache_',
};

// Cache TTL
const CACHE_TTL = {
  PREDICTIONS: 1000 * 60 * 30, // 30 minutes
  DETAILS: 1000 * 60 * 60 * 24 * 7, // 7 days
};

/**
 * Service to handle Google Places API requests with caching and offline support
 */
class PlacesService {
  private apiKey: string;
  private sessionToken: string | null = null;
  private lastSessionUpdate: number = 0;
  private offlineMode = false;
  
  constructor() {
    // Ottieni le API keys da Constants (app.config.js)
    const platform = Platform.OS;
    const googleMapsApiKeys = Constants.expoConfig?.extra?.googleMapsApiKeys || {};
    
    if (platform === 'ios') {
      this.apiKey = googleMapsApiKeys.ios || '';
    } else if (platform === 'android') {
      this.apiKey = googleMapsApiKeys.android || '';
    } else {
      // Web o altro
      this.apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || '';
    }
    
    console.log(`Using Google Maps API Key for ${platform}: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'undefined'}`);
    this.generateSessionToken();
    
    // Listen for network changes
    NetInfo.addEventListener(state => {
      this.offlineMode = !state.isConnected;
      
      // If coming back online, refresh session token
      if (state.isConnected && this.offlineMode) {
        this.generateSessionToken();
      }
    });
  }
  
  /**
   * Generate a new session token for better billing with Google Places API
   */
  generateSessionToken(): void {
    this.sessionToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    this.lastSessionUpdate = Date.now();
  }
  
  /**
   * Check if current session token needs refresh (older than 3 minutes)
   */
  private checkSessionToken(): void {
    // Refresh token if older than 3 minutes
    if (Date.now() - this.lastSessionUpdate > 1000 * 60 * 3) {
      this.generateSessionToken();
    }
  }
  
  /**
   * Get cached predictions for a query
   */
  private async getCachedPredictions(query: string): Promise<PlacePrediction[] | null> {
    try {
      if (!query) return null;
      
      const cacheKey = `${CACHE_KEYS.PREDICTIONS}${query?.toLowerCase() || ''}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_TTL.PREDICTIONS) {
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached predictions:', error);
      return null;
    }
  }
  
  /**
   * Cache predictions for a query
   */
  private async cachePredictions(query: string, predictions: PlacePrediction[]): Promise<void> {
    try {
      if (!query) return;
      
      const cacheKey = `${CACHE_KEYS.PREDICTIONS}${query?.toLowerCase() || ''}`;
      const cacheData = {
        data: predictions,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching predictions:', error);
    }
  }
  
  /**
   * Get cached place details
   */
  private async getCachedPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const cacheKey = `${CACHE_KEYS.DETAILS}${placeId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_TTL.DETAILS) {
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached place details:', error);
      return null;
    }
  }
  
  /**
   * Cache place details
   */
  private async cachePlaceDetails(placeId: string, details: any): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEYS.DETAILS}${placeId}`;
      const cacheData = {
        data: details,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching place details:', error);
    }
  }
  
  /**
   * Get address predictions from Google Places API with caching
   */
  async getPlacePredictions(
    query: string,
    options: {
      types?: string,
      components?: string,
      language?: string,
      location?: { lat: number; lng: number },
      radius?: number,
      countryRestrictions?: string[],
      applyUserPreferences?: boolean,
    } = {}
  ): Promise<PlacePrediction[]> {
    try {
      // Return empty array for empty queries
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      // Check if we have cached results
      const cachedPredictions = await this.getCachedPredictions(query);
      if (cachedPredictions) {
        console.log('Using cached predictions for:', query);
        
        // Apply user preferences if needed
        if (options.applyUserPreferences) {
          return await userPreferences.applyPreferences(cachedPredictions);
        }
        
        return cachedPredictions;
      }
      
      // If in offline mode, return empty results
      if (this.offlineMode) {
        console.log('Offline mode - cannot fetch new predictions');
        return [];
      }
      
      // Ensure we have a fresh session token
      this.checkSessionToken();
      
      const {
        types = 'address',
        components = '',
        language = 'it',
        location,
        radius = 50000,
        countryRestrictions = ['it'],
      } = options;
      
      // Build URL
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${this.apiKey}&sessiontoken=${this.sessionToken}&types=${types}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      }
      
      if (components) {
        url += `&components=${components}`;
      } else if (countryRestrictions.length > 0) {
        const components = countryRestrictions.map(country => `country:${country}`).join('|');
        url += `&components=${components}`;
      }
      
      if (language) {
        url += `&language=${language}`;
      }
      
      // Make the request
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', json.status, json.error_message);
        return [];
      }
      
      // Transform predictions to our format
      const predictions: PlacePrediction[] = (json.predictions || []).map(
        (prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || '',
          secondaryText: prediction.structured_formatting?.secondary_text || '',
          structured_formatting: prediction.structured_formatting,
          types: prediction.types || [],
        })
      );
      
      // Cache the results
      this.cachePredictions(query, predictions);
      
      // Apply user preferences if needed
      if (options.applyUserPreferences) {
        return await userPreferences.applyPreferences(predictions);
      }
      
      return predictions;
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      return [];
    }
  }
  
  /**
   * Get place details from Google Places API with caching
   */
  async getPlaceDetails(
    placeId: string,
    options: {
      fields?: string[],
      language?: string,
      updateUserPreferences?: boolean
    } = {}
  ): Promise<any> {
    try {
      // Check if we have cached details
      const cachedDetails = await this.getCachedPlaceDetails(placeId);
      if (cachedDetails) {
        console.log('Using cached place details for:', placeId);
        return cachedDetails;
      }
      
      // If in offline mode, return null
      if (this.offlineMode) {
        console.log('Offline mode - cannot fetch place details');
        return null;
      }
      
      // Ensure we have a fresh session token
      this.checkSessionToken();
      
      const {
        fields = ['address_component', 'geometry', 'formatted_address', 'name', 'type'],
        language = 'it',
        updateUserPreferences = true,
      } = options;
      
      // Build URL
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${
        this.apiKey
      }&sessiontoken=${this.sessionToken}&fields=${fields.join(',')}&language=${language}`;
      
      // Make the request
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.status !== 'OK') {
        console.error('Places Details API error:', json.status, json.error_message);
        return null;
      }
      
      const placeDetails = json.result;
      
      // Cache the results
      this.cachePlaceDetails(placeId, placeDetails);
      
      // Update user preferences if requested
      if (updateUserPreferences && placeDetails && placeDetails.types) {
        // Extract main category if available
        const mainCategory = placeDetails.types[0];
        if (mainCategory) {
          userPreferences.trackCategoryPreference(mainCategory);
        }
        
        // Update weights for this place
        userPreferences.updateWeights({
          placeId,
          description: placeDetails.formatted_address || placeDetails.name || '',
          mainText: placeDetails.name || '',
          secondaryText: placeDetails.formatted_address || '',
          types: placeDetails.types || [],
        });
      }
      
      return placeDetails;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }
  
  /**
   * Purge expired cache entries
   */
  async purgeExpiredCache(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter cache keys
      const predictionKeys = allKeys.filter(key => key.startsWith(CACHE_KEYS.PREDICTIONS));
      const detailKeys = allKeys.filter(key => key.startsWith(CACHE_KEYS.DETAILS));
      
      // Check prediction cache
      const predictionExpiredKeys: string[] = [];
      for (const key of predictionKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp > CACHE_TTL.PREDICTIONS) {
            predictionExpiredKeys.push(key);
          }
        }
      }
      
      // Check details cache
      const detailExpiredKeys: string[] = [];
      for (const key of detailKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp > CACHE_TTL.DETAILS) {
            detailExpiredKeys.push(key);
          }
        }
      }
      
      // Remove expired keys
      if (predictionExpiredKeys.length > 0) {
        await AsyncStorage.multiRemove(predictionExpiredKeys);
        console.log(`Purged ${predictionExpiredKeys.length} expired prediction caches`);
      }
      
      if (detailExpiredKeys.length > 0) {
        await AsyncStorage.multiRemove(detailExpiredKeys);
        console.log(`Purged ${detailExpiredKeys.length} expired detail caches`);
      }
    } catch (error) {
      console.error('Error purging expired cache:', error);
    }
  }
}

export default new PlacesService(); 