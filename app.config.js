import 'dotenv/config';

// Debug log per verificare che le variabili vengano lette
console.log('FIREBASE/GOOGLE ENV CHECK:', {
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'defined' : 'undefined',
  GOOGLE_WEB: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'defined' : 'undefined',
  GOOGLE_ANDROID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'defined' : 'undefined',
  GOOGLE_IOS: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'defined' : 'undefined',
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'defined' : 'undefined',
});

// Firebase API key di default
const DEFAULT_FIREBASE_API_KEY = "AIzaSyCYq0Po9hUcDkUGgqmKdj-NQtzZNLgJlJk";

// Client ID di default (da utilizzare come fallback)
const DEFAULT_WEB_CLIENT_ID = "611979010466-cfs05d44r5fmul7eulqls90ot6rfj1vu.apps.googleusercontent.com";
const DEFAULT_IOS_CLIENT_ID = "611979010466-l82pb4cu9i94iobu6kb6edr1i9koasim.apps.googleusercontent.com";
const DEFAULT_ANDROID_CLIENT_ID = "611979010466-jq1uovggr5ud6cesttd66ack4jurfpds.apps.googleusercontent.com";

// Ottieni l'API key di Firebase con fallback
const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_API_KEY;

// Log separato per Firebase API key
console.log('FIREBASE API KEY:', firebaseApiKey ? firebaseApiKey.substring(0, 8) + '...' : 'undefined');

// Controlla se siamo in modalità diagnostica
const isDiagnosticMode = process.env.EXPO_PUBLIC_DIAGNOSTIC_MODE === 'true';
if (isDiagnosticMode) {
  console.log('🔍 MODALITÀ DIAGNOSTICA ATTIVATA');
}

// Configurazione Expo che sovrascrive app.json
module.exports = {
  name: "In&Out",
  slug: "ineout",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/playstore.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  jsEngine: "hermes",

  splash: {
    image: "./assets/playstore.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },

  assetBundlePatterns: [
    "**/*"
  ],

  ios: {
    bundleIdentifier: "com.ineout.ineout",
    supportsTablet: true,
    buildNumber: "1.0.0",
    config: {
      googleMapsApiKey: "AIzaSyD_yKwI0BTKnkJIUF8hyxUUZc32rSnkfBs",
      googleSignIn: {
        reservedClientId: `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULT_IOS_CLIENT_ID}`
      }
    }
  },

  android: {
    package: "com.ineout.ineout",
    adaptiveIcon: {
      foregroundImage: "./assets/playstore.png",
      backgroundColor: "#ffffff"
    },
    versionCode: 1,
    config: {
      googleMaps: {
        apiKey: "AIzaSyB8uW_LTgUrkzpRc4WxmGOtotvUOJkA8DI"
      }
    }
  },

  web: {
    favicon: "./assets/favicon.png"
  },

  scheme: "ineout",

  // Forza l'utilizzo di Expo Go invece delle development builds
  experiments: {
    tsconfigPaths: true
  },

  // Rimuovi runtimeVersion e updates per essere compatibile con Expo Go
  // runtimeVersion e updates sono solo per EAS Update, non per Expo Go
  extra: {
    eas: {
      // projectId: "e579f8e1-2aaa-4cb3-b73e-c05ffe14b9e2"
      projectId: "4b927852-fd8b-485e-a738-46e339b44792"
    },
    // Flag di modalità diagnostica
    diagnosticMode: isDiagnosticMode,
    googleMapsApiKey: "AIzaSyD_yKwI0BTKnkJIUF8hyxUUZc32rSnkfBs",
    firebaseConfig: {
      apiKey: firebaseApiKey,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ineout-b7ce8.firebaseapp.com",
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ineout-b7ce8",
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ineout-b7ce8.firebasestorage.app",
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "716279621708",
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:716279621708:web:807f1c314c807d9b3bace9",
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2C0R5V0M0M"
    },
    googleMapsApiKeys: {
      ios: "AIzaSyD_yKwI0BTKnkJIUF8hyxUUZc32rSnkfBs",
      android: "AIzaSyB8uW_LTgUrkzpRc4WxmGOtotvUOJkA8DI"
    },
    // Aggiungi client ID di Google
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULT_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || DEFAULT_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || DEFAULT_ANDROID_CLIENT_ID,
    // OpenAI API Key
    EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    // EmailJS Configuration
    EXPO_PUBLIC_EMAILJS_SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'default_service_id',
    EXPO_PUBLIC_EMAILJS_TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'default_template_id',
    EXPO_PUBLIC_EMAILJS_USER_ID: process.env.EXPO_PUBLIC_EMAILJS_USER_ID || 'default_user_id',
    // Forza l'uso di Expo Go
    expoGoEnabled: true
  },

  plugins: [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Allow In&Out to use your location."
      }
    ]
  ],

  // Proprietà per garantire che il progetto utilizzi Expo Go
  sdkVersion: "52.0.0",
  platforms: ["ios", "android", "web"]
}; 