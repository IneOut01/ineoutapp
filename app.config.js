export default {
  name: "IneOut",
  slug: "ineout",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
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
      apiKey: "AIzaSyD_GycqgSK5owyrQerfQ3pQXCzEZzZ6DyNE",
      authDomain: "dev-ineout.firebaseapp.com",
      projectId: "dev-ineout",
      storageBucket: "dev-ineout.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef1234567890"
    }
  },
  plugins: [
    "expo-localization",
    "@react-native-google-signin/google-signin",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0"
        }
      }
    ]
  ]
};
