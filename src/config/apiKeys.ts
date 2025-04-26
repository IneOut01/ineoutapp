/**
 * API keys e configurazioni
 * Caricamento delle variabili d'ambiente con prefisso EXPO_PUBLIC_
 */

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Configurazione Firebase
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Funzione per validare la configurazione Firebase
export const isFirebaseConfigValid = (): boolean => {
  const requiredKeys = [
    'apiKey', 'authDomain', 'projectId', 
    'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.warn(`⚠️ Firebase configuration missing: ${missingKeys.join(', ')}`);
    console.warn('Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are defined.');
    return false;
  }
  
  return true;
};

// Altri API keys
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

// Google OAuth client IDs
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
export const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

// Funzione per validare la configurazione Google
export const isGoogleConfigValid = (): boolean => {
  if (!GOOGLE_WEB_CLIENT_ID) {
    console.warn('⚠️ Google Web Client ID not found. Please check your .env file.');
    return false;
  }
  
  return true;
};

// Funzione per verificare le variabili d'ambiente mancanti
export const checkMissingEnvVars = (): string[] => {
  const requiredEnvVars = [
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
  ];
  
  return requiredEnvVars.filter(key => !process.env[key]);
}; 