import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationHookResult {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<boolean>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  getAddressFromCoordinates: (latitude: number, longitude: number) => Promise<string | null>;
}

/**
 * Hook personalizzato per gestire la geolocalizzazione
 * @param {boolean} autoRequest - Se true, richiede automaticamente i permessi di localizzazione all'inizializzazione
 * @returns {LocationHookResult} Stato della posizione e funzioni di utilità
 */
export const useLocation = (autoRequest: boolean = false): LocationHookResult => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Richiede i permessi di localizzazione e ottiene la posizione corrente
   * @returns {Promise<boolean>} True se i permessi sono stati concessi
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Richiesta permessi di localizzazione
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('È necessario concedere i permessi di localizzazione per utilizzare questa funzione');
        Alert.alert(
          'Permessi di localizzazione negati',
          'Per utilizzare questa funzione, concedi i permessi di localizzazione nelle impostazioni.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return false;
      }

      // Ottieni la posizione attuale
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy
      });
      
      setLoading(false);
      return true;
    } catch (err: any) {
      setError('Errore nel recupero della posizione: ' + err.message);
      setLoading(false);
      return false;
    }
  };

  /**
   * Calcola la distanza in chilometri tra due set di coordinate utilizzando la formula di Haversine
   * @param {number} lat1 - Latitudine punto 1
   * @param {number} lon1 - Longitudine punto 1
   * @param {number} lat2 - Latitudine punto 2
   * @param {number} lon2 - Longitudine punto 2
   * @returns {number} Distanza in chilometri
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distanza in km
    return Number(distance.toFixed(1));
  };

  /**
   * Ottiene l'indirizzo a partire dalle coordinate
   * @param {number} latitude - Latitudine
   * @param {number} longitude - Longitudine
   * @returns {Promise<string|null>} Indirizzo formattato o null in caso di errore
   */
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        return [
          address.street, 
          address.streetNumber, 
          address.city, 
          address.region, 
          address.postalCode
        ].filter(Boolean).join(', ');
      }
      return null;
    } catch (err) {
      console.error('Errore nel reverse geocoding:', err);
      return null;
    }
  };

  // Se autoRequest è true, richiedi i permessi di localizzazione all'inizializzazione
  useEffect(() => {
    if (autoRequest) {
      requestLocationPermission();
    }
  }, [autoRequest]);

  return {
    location,
    loading,
    error,
    requestLocationPermission,
    calculateDistance,
    getAddressFromCoordinates
  };
};

export default useLocation; 