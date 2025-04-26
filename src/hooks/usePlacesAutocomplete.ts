import { useState, useEffect, useCallback, useRef } from 'react';
import PlacesService from '../services/PlacesService';
import userPreferences from '../services/UserPreferences';
import { PlacePrediction, PlacesAutocompleteOptions } from '../types/placePrediction';
import * as Location from 'expo-location';
import debounce from 'lodash.debounce';
import { mapsKeys } from '../config/mapsKeys';
import { Platform } from 'react-native';

interface UsePlacesAutocompleteProps {
  apiKey?: string;
  language?: string;
  types?: string[];
  countryRestrictions?: string[];
  useUserLocation?: boolean;
  defaultLocation?: { 
    lat: number; 
    lng: number; 
  };
  radius?: number;
  applyUserPreferences?: boolean;
  debounceTimeout?: number;
  fetchTimeout?: number;
  countryRestrict?: string;
}

export const usePlacesAutocomplete = (props: UsePlacesAutocompleteProps = {}) => {
  const {
    apiKey,
    language = 'it',
    types = ['address'],
    countryRestrictions = ['it'],
    useUserLocation = true,
    defaultLocation,
    radius = 50000,
    applyUserPreferences = true,
    debounceTimeout = 300,
    fetchTimeout = 5000,
    countryRestrict = 'it'
  } = props;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    defaultLocation || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string>(generateSessionToken());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ottieni la posizione dell'utente all'avvio se richiesto
  useEffect(() => {
    if (useUserLocation && !userLocation) {
      getUserLocation();
    }
  }, [useUserLocation]);

  // Ottiene la posizione dell'utente usando expo-location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permesso di localizzazione non concesso');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setUserLocation({ lat: latitude, lng: longitude });
    } catch (err) {
      console.error('Errore nel recupero della posizione:', err);
      setError('Impossibile ottenere la posizione attuale');
    }
  };

  // Funzione per generare un session token casuale
  function generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Resetta il session token quando necessario
  const resetSessionToken = useCallback(() => {
    setSessionToken(generateSessionToken());
  }, []);

  // Funzione per ottenere l'API key corretta in base alla piattaforma
  const getApiKey = useCallback(() => {
    // Prima utilizza l'API key passata come prop se disponibile
    if (apiKey) return apiKey;
    
    // Altrimenti usa quella dalla configurazione
    const key = Platform.OS === 'ios' 
      ? mapsKeys.ios 
      : Platform.OS === 'android' 
        ? mapsKeys.android 
        : mapsKeys.web;
    
    if (!key) {
      console.warn(`API key di Google Maps non trovata per la piattaforma ${Platform.OS}`);
    }
    
    return key;
  }, [apiKey]);

  // Recupera predizioni di luoghi in base al testo inserito
  const fetchPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Imposta un timeout per la chiamata
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configura un timeout per la fetch
    const timeoutPromise = new Promise<PlacesAutocompleteResponse>((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('Connessione lenta. La richiesta è scaduta.'));
      }, fetchTimeout);
    });

    try {
      const apiKey = getApiKey();
      
      if (!apiKey) {
        throw new Error('The provided API key is invalid.');
      }
      
      // Assicurati di usare sempre il token di sessione aggiornato
      const currentToken = sessionToken;
      console.log(`Usando session token: ${currentToken.substring(0, 8)}...`);
      
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${apiKey}&sessiontoken=${currentToken}&components=country:${countryRestrict}&language=it&types=(cities)`;

      // Race tra la fetch e il timeout
      const response = await Promise.race([
        fetch(endpoint),
        timeoutPromise
      ]) as Response;

      // Se il timeout è scattato, la promessa sarà rifiutata e catturata dal catch
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!response.ok) {
        throw new Error(`Errore di rete: ${response.status}`);
      }

      const data: PlacesAutocompleteResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || `Errore API Places: ${data.status}`);
      }

      // Trasforma i dati nel formato richiesto dall'applicazione
      const formattedPredictions: PlacePrediction[] = data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text
      }));

      setPredictions(formattedPredictions);
    } catch (error) {
      console.error('Errore nell\'autocomplete:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Si è verificato un errore imprevisto');
      }
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, countryRestrict, fetchTimeout, getApiKey]);

  // Crea una versione "debounced" della funzione fetchPredictions
  const debouncedFetchPredictions = useCallback(
    debounce(fetchPredictions, debounceTimeout),
    [fetchPredictions, debounceTimeout]
  );

  // Pulisci i timeout quando il componente si smonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Ottieni i dettagli di un luogo in base al suo ID
  const getPlaceDetails = useCallback(
    async (placeId: string, updatePreferences: boolean = true) => {
      setIsLoading(true);
      setError(null);

      try {
        const details = await PlacesService.getPlaceDetails(placeId, {
          language,
          updateUserPreferences: updatePreferences,
        });
        
        return details;
      } catch (err) {
        console.error('Errore nel recupero dei dettagli del luogo:', err);
        setError('Impossibile recuperare i dettagli del luogo');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  // Resituisce la lista delle ricerche recenti
  const getRecentSearches = useCallback(async () => {
    return await userPreferences.getRecentSearches();
  }, []);

  // Resituisce la lista dei luoghi preferiti
  const getFavoritePlaces = useCallback(async () => {
    return await userPreferences.getFavoritePlaces();
  }, []);

  return {
    predictions,
    isLoading,
    error,
    userLocation,
    fetchPredictions: debouncedFetchPredictions,
    clearPredictions: () => setPredictions([]),
    resetSessionToken,
    sessionToken,
    getPlaceDetails,
    getUserLocation,
    getRecentSearches,
    getFavoritePlaces
  };
};

export default usePlacesAutocomplete; 