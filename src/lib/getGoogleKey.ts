import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Retrieves the appropriate Google Maps API key for the current platform
 * Falls back gracefully if keys are not available
 */
export const getGoogleKey = () => {
  return Platform.select({
    ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY,
    android: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
    default: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY,
  });
};

/**
 * Logs whether Google Maps API key is available for current platform
 */
export const logGoogleKeyStatus = () => {
  const key = getGoogleKey();
  const platform = Platform.OS;
  
  if (key) {
    console.log(`Google key loaded for ${platform}`);
  } else {
    console.warn(`⚠️ Google Maps API key not found for ${platform}`);
  }
  
  return !!key;
}; 