import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Config from 'react-native-config';

// Ottieni le API key dalle variabili d'ambiente o dalle costanti di Expo
const GOOGLE_MAPS_API_KEY_IOS = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || Config.GOOGLE_MAPS_API_KEY_IOS || '';
const GOOGLE_MAPS_API_KEY_ANDROID = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || Config.GOOGLE_MAPS_API_KEY_ANDROID || '';
const GOOGLE_MAPS_API_KEY = Platform.OS === 'ios' ? GOOGLE_MAPS_API_KEY_IOS : GOOGLE_MAPS_API_KEY_ANDROID;

/**
 * Interfaccia per i dettagli di un luogo restituiti dall'API
 */
export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  addressComponents?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

/**
 * Ottiene i dettagli di un luogo dal suo ID
 * @param placeId ID del luogo da Google Places
 * @param language Lingua dei risultati (default: 'it')
 * @returns Promise con i dettagli del luogo
 */
export const getPlaceDetails = async (placeId: string, language = 'it'): Promise<PlaceDetails | null> => {
  try {
    // Verifica che l'API key sia disponibile
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('API key di Google Maps non disponibile');
      return null;
    }
    
    // Parametri della richiesta
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      language,
      fields: 'place_id,name,formatted_address,geometry,address_components'
    });
    
    // Effettua la richiesta
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );
    
    // Verifica se la risposta è ok
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }
    
    // Parsa la risposta JSON
    const data = await response.json();
    
    // Verifica lo stato della risposta
    if (data.status !== 'OK' || !data.result) {
      console.warn(`Google Places API error: ${data.status}`, data.error_message);
      return null;
    }
    
    // Estrai e formatta i dati
    const result = data.result;
    
    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      geometry: result.geometry,
      addressComponents: result.address_components
    };
  } catch (error) {
    console.error('Errore nel recupero dei dettagli del luogo:', error);
    return null;
  }
};

/**
 * Converte un indirizzo in coordinate geografiche
 * @param address Indirizzo da geocodificare
 * @param language Lingua dei risultati (default: 'it')
 * @returns Promise con latitudine e longitudine
 */
export const geocodeAddress = async (address: string, language = 'it'): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Verifica che l'API key sia disponibile
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('API key di Google Maps non disponibile');
      return null;
    }
    
    // Parametri della richiesta
    const params = new URLSearchParams({
      address,
      key: GOOGLE_MAPS_API_KEY,
      language
    });
    
    // Effettua la richiesta
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );
    
    // Verifica se la risposta è ok
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }
    
    // Parsa la risposta JSON
    const data = await response.json();
    
    // Verifica lo stato della risposta
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`Google Geocoding API error: ${data.status}`, data.error_message);
      return null;
    }
    
    // Estrai le coordinate dal primo risultato
    const location = data.results[0].geometry.location;
    
    return {
      lat: location.lat,
      lng: location.lng
    };
  } catch (error) {
    console.error('Errore nella geocodifica dell\'indirizzo:', error);
    return null;
  }
};

/**
 * Ottiene l'indirizzo corrispondente a delle coordinate geografiche
 * @param lat Latitudine
 * @param lng Longitudine
 * @param language Lingua dei risultati (default: 'it')
 * @returns Promise con l'indirizzo formattato
 */
export const reverseGeocode = async (lat: number, lng: number, language = 'it'): Promise<string | null> => {
  try {
    // Verifica che l'API key sia disponibile
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('API key di Google Maps non disponibile');
      return null;
    }
    
    // Parametri della richiesta
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: GOOGLE_MAPS_API_KEY,
      language
    });
    
    // Effettua la richiesta
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );
    
    // Verifica se la risposta è ok
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }
    
    // Parsa la risposta JSON
    const data = await response.json();
    
    // Verifica lo stato della risposta
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`Google Reverse Geocoding API error: ${data.status}`, data.error_message);
      return null;
    }
    
    // Estrai l'indirizzo formattato dal primo risultato
    return data.results[0].formatted_address;
  } catch (error) {
    console.error('Errore nella geocodifica inversa:', error);
    return null;
  }
}; 