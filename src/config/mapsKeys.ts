import { Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from './apiKeys';

// Configurazione chiavi Google Maps per diverse piattaforme
export const mapsKeys = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  web: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

// Funzione per validare le chiavi e mostrare avvisi appropriati
export const validateMapsKeys = () => {
  const platform = Platform.OS;
  const warningMessage = (p: string) => `⚠️ Google Maps API key not found for ${p}`;

  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not found in environment variables. Please check your .env file.');
    return false;
  }

  // Controlla che la chiave non sia vuota
  if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY === '') {
    console.warn('⚠️ Google Maps API key is empty. Please provide a valid key in your .env file.');
    return false;
  }

  return true;
}; 