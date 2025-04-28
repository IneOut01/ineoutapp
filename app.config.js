export default {
  name: "IneOut",
  slug: "ineout",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  android: {
    package: "com.ineout.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "INTERNET"
    ]
  },
  extra: {
    eas: {
      projectId: "4b927852-fd8b-485e-a738-46e339b44792"
    },
    firebaseConfig: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    }
  },
  plugins: [
    "@react-native-google-signin/google-signin",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0"
        }
      }
    ]
  ]
};