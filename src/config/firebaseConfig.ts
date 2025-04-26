import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Log ambiente in uso
console.log('FIREBASE CONFIG: ', __DEV__ ? 'SVILUPPO' : 'PRODUZIONE');

// Ottieni configurazione Firebase dalle variabili d'ambiente di Expo
const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig || {
  apiKey: "AIzaSyCYq0Po9hUcDkUGgqmKdj-NQtzZNLgJlJk",
  authDomain: "ineout-b7ce8.firebaseapp.com",
  projectId: "ineout-b7ce8",
  storageBucket: "ineout-b7ce8.firebasestorage.app",
  messagingSenderId: "716279621708",
  appId: "1:716279621708:web:807f1c314c807d9b3bace9",
  measurementId: "G-2C0R5V0M0M"
};

// Inizializza Firebase
console.log('FIREBASE CONFIG: Inizializzazione Firebase con config:', 
  Object.keys(firebaseConfig).reduce((acc, key) => ({
    ...acc,
    [key]: key === 'apiKey' ? 
      firebaseConfig[key].substring(0, 8) + '...' : 
      (typeof firebaseConfig[key] === 'string' ? 'configurato' : 'configurato')
  }), {})
);

// Inizializza app Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export di default
export default app;