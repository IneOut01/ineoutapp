import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import Geocoder from 'react-native-geocoding';
import { EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } from '@env';

// Inizializza Geocoder con la chiave API di Google
Geocoder.init(EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Ottiene coordinate da un indirizzo (geocoding)
 * @param address Indirizzo da convertire in coordinate
 * @returns Oggetto con coordinate lat e lng
 */
export const getCoordinatesFromAddress = async (address: string): Promise<{
  lat: number;
  lng: number;
} | null> => {
  try {
    // Utilizziamo Geocoder per la geocodifica
    const response = await Geocoder.from(address);
    if (response.results.length > 0) {
      const { lat, lng } = response.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Errore nella geocodifica dell\'indirizzo:', error);
    return null;
  }
};

/**
 * Formatta un oggetto coordinate in formato Google Maps
 * @param lat Latitudine
 * @param lng Longitudine
 * @returns Oggetto formattato per Google Maps
 */
export const formatGoogleMapsLocation = (
  lat: number,
  lng: number
): {
  lat: number;
  lng: number;
} => {
  return {
    lat,
    lng
  };
};

/**
 * Ottiene l'indirizzo da una coppia di coordinate (reverse geocoding)
 * @param latitude Latitudine
 * @param longitude Longitudine
 * @returns Indirizzo formattato
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    // Utilizziamo Geocoder per il reverse geocoding
    const response = await Geocoder.from(latitude, longitude);
    
    if (response.results.length > 0) {
      return response.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Errore nel reverse geocoding:', error);
    return null;
  }
};

/**
 * Verifica se i servizi di localizzazione sono attivi
 * @returns true se i servizi sono attivi, false altrimenti
 */
export const hasLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    // In genere non abbiamo bisogno di verificare se i servizi sono attivi
    // perché requestLocationPermission() restituirà false se i servizi sono disattivati
    return true;
  } catch (error) {
    console.error('Errore nella verifica dei servizi di localizzazione:', error);
    return false;
  }
};

/**
 * Richiede i permessi di localizzazione
 * @returns true se i permessi sono concessi, false altrimenti
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
    
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permesso di localizzazione',
          message: 'Questa app ha bisogno di accedere alla tua posizione',
          buttonNeutral: 'Chiedimelo più tardi',
          buttonNegative: 'Annulla',
          buttonPositive: 'OK'
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    return false;
  } catch (error) {
    console.error('Errore nella richiesta dei permessi di localizzazione:', error);
    return false;
  }
};

/**
 * Ottiene la posizione corrente dell'utente
 * @returns Oggetto con coordinate lat e lng
 */
export const getCurrentPosition = async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number | null;
} | null> => {
  try {
    const permissionGranted = await requestLocationPermission();
    
    if (!permissionGranted) {
      console.log('Permessi di localizzazione non concessi');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Errore nel recupero della posizione:', error);
          reject(error);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
    });
  } catch (error) {
    console.error('Errore nel recupero della posizione:', error);
    return null;
  }
};

/**
 * Calculates the distance between two coordinates in kilometers
 * @param coords1 First coordinates
 * @param coords2 Second coordinates
 * @returns number Distance in kilometers
 */
export const getDistance = (
  coords1: Coordinates,
  coords2: Coordinates
): number => {
  if (!coords1 || !coords2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(coords2.latitude - coords1.latitude);
  const dLon = deg2rad(coords2.longitude - coords1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1.latitude)) *
      Math.cos(deg2rad(coords2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Converts degrees to radians
 * @param deg Degrees
 * @returns number Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Generates a URL for getting directions to a location
 * @param latitude Destination latitude
 * @param longitude Destination longitude
 * @param address Optional address for the destination
 * @returns string URL for directions
 */
export const getDirectionsUrl = (
  latitude: number, 
  longitude: number,
  address?: string
): string => {
  const destination = address 
    ? encodeURIComponent(address)
    : `${latitude},${longitude}`;
    
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?daddr=${destination}&dirflg=d`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  }
}; 