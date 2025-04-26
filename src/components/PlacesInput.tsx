import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import userPreferences from '../services/UserPreferences';
import { PlacePrediction } from '../types/placePrediction';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';

interface PlacesInputProps {
  placeholder?: string;
  onPlaceSelected?: (place: PlacePrediction, details?: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  useUserLocation?: boolean;
  language?: string;
  countryRestrict?: string; // formato ISO 'it', 'fr', etc.
  initialValue?: string;
  apiKey?: string;
  inputStyle?: any;
  containerStyle?: any;
  showRecentSearches?: boolean;
  autoFocus?: boolean;
  types?: string[];
  fetchDetails?: boolean;
  onError?: (error: any) => void;
}

export const PlacesInput: React.FC<PlacesInputProps> = ({
  placeholder = 'Cerca un indirizzo...',
  onPlaceSelected,
  onFocus,
  onBlur,
  useUserLocation = true,
  language = 'it',
  countryRestrict,
  initialValue = '',
  apiKey,
  inputStyle,
  containerStyle,
  showRecentSearches = true,
  autoFocus = false,
  types = ['address', 'establishment', 'geocode'],
  fetchDetails = false,
  onError
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState<PlacePrediction[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [errorPlace, setErrorPlace] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listOpacity = useRef(new Animated.Value(0)).current;
  
  // Configura opzioni per l'API di Places
  const options = {
    types,
    language,
    components: countryRestrict ? `country:${countryRestrict}` : undefined,
    useUserLocation,
    apiKey
  };
  
  const {
    predictions,
    isLoading,
    error,
    fetchPredictions,
    clearPredictions,
    getPlaceDetails,
    resetSessionToken
  } = usePlacesAutocomplete(options);
  
  // Carica le ricerche recenti e i preferiti all'avvio
  useEffect(() => {
    const loadUserData = async () => {
      const recent = await userPreferences.getRecentSearches();
      const favorites = await userPreferences.getFavoritePlaces();
      setRecentSearches(recent);
      setFavoritePlaces(favorites);
    };
    
    loadUserData();
  }, []);

  // Gestione animazione per mostrare/nascondere i risultati
  useEffect(() => {
    const shouldShowResults = isFocused && (predictions.length > 0 || (showRecent && recentSearches.length > 0));
    
    setShowPredictions(shouldShowResults);
    
    Animated.timing(listOpacity, {
      toValue: shouldShowResults ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start();
    
    // Mostra ricerche recenti solo quando l'input è vuoto
    setShowRecent(isFocused && query.length === 0 && showRecentSearches);
  }, [isFocused, predictions.length, query, recentSearches.length, showRecentSearches]);

  // Imposta l'errore locale quando cambia l'errore dell'hook
  useEffect(() => {
    setErrorPlace(error);
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Implementazione del debounce per la ricerca
  const debouncedFetchPredictions = useCallback(
    debounce((text: string) => {
      if (text.length >= 2) {
        fetchPredictions(text);
        // Aggiorna i pattern di ricerca dell'utente
        userPreferences.updateSearchPattern(text);
      } else {
        clearPredictions();
      }
    }, 300),
    [fetchPredictions, clearPredictions]
  );

  // Gestione del cambio di testo nell'input
  const handleTextChange = (text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      debouncedFetchPredictions(text);
    } else {
      clearPredictions();
    }
  };

  // Gestisce la selezione di un luogo
  const handlePlaceSelect = async (data, details = null) => {
    try {
      if (!data || !data.place_id) {
        console.warn('Dati del posto mancanti o incompleti');
        return;
      }
    
      const prediction: PlacePrediction = {
        placeId: data.place_id,
        description: data.description || '',
        mainText: data.structured_formatting?.main_text || '',
        secondaryText: data.structured_formatting?.secondary_text || ''
      };
    
      // Solo se fetchDetails è true, ottieni i dettagli
      let placeDetails = null;
      if (fetchDetails && details) {
        placeDetails = details;
      }
    
      // Aggiungi alla cronologia
      if (onPlaceSelected) {
        onPlaceSelected(prediction, placeDetails);
      }
    } catch (error) {
      console.error('Errore nella selezione del posto', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Gestisce l'aggiunta/rimozione dai preferiti
  const handleToggleFavorite = async (prediction: PlacePrediction, event: any) => {
    event.stopPropagation();
    
    const isFavorite = await userPreferences.toggleFavoritePlace(prediction);
    // Aggiorna la lista locale dei preferiti
    setFavoritePlaces(await userPreferences.getFavoritePlaces());
    
    console.log(`Luogo ${isFavorite ? 'aggiunto ai' : 'rimosso dai'} preferiti:`, prediction.description);
  };

  // Restituisce l'icona appropriata per i preferiti
  const getFavoriteIcon = (placeId: string) => {
    return userPreferences.isFavoritePlace(placeId) 
      ? 'heart' 
      : 'heart-outline';
  };

  // Pulisce l'input
  const handleClearInput = () => {
    setQuery('');
    clearPredictions();
    inputRef.current?.focus();
  };

  // Gestione del focus dell'input
  const handleFocus = () => {
    setIsFocused(true);
    resetSessionToken();
    if (onFocus) onFocus();
    // Mostra ricerche recenti se il campo è vuoto
    if (query.length === 0 && showRecentSearches) {
      setShowRecent(true);
    }
  };

  // Gestione della perdita di focus dell'input
  const handleBlur = () => {
    // Non nascondiamo immediatamente per permettere la selezione
    setTimeout(() => {
      if (!isFocused) return;
      setIsFocused(false);
      if (onBlur) onBlur();
    }, 150);
  };

  // Render delle predizioni Google Places
  const renderPredictions = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }
    
    if (errorPlace) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={18} color={COLORS.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorPlace}</Text>
        </View>
      );
    }

    // Ordina le predizioni in base alle preferenze dell'utente
    const sortedPredictions = [...predictions].sort((a, b) => {
      const scoreA = userPreferences.calculatePreferenceScore(a);
      const scoreB = userPreferences.calculatePreferenceScore(b);
      return scoreB - scoreA;
    });

    return sortedPredictions.map((prediction) => (
      <TouchableOpacity
        key={prediction.placeId}
        style={styles.predictionItem}
        onPress={() => handlePlaceSelect(prediction)}
        activeOpacity={0.7}
      >
        <View style={styles.predictionContent}>
          <Ionicons name="location" size={18} color={COLORS.primary} style={styles.predictionIcon} />
          <View style={styles.predictionTextContainer}>
            <Text style={styles.predictionMainText} numberOfLines={1}>
              {prediction.mainText}
            </Text>
            <Text style={styles.predictionSecondaryText} numberOfLines={1}>
              {prediction.secondaryText}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => handleToggleFavorite(prediction, e)}
        >
          <Ionicons name={getFavoriteIcon(prediction.placeId)} size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    ));
  };

  // Render delle ricerche recenti
  const renderRecentSearches = () => {
    if (!showRecent || recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Ricerche recenti</Text>
          {recentSearches.length > 0 && (
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearText}>Cancella</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentSearches.map((prediction) => (
          <TouchableOpacity
            key={`recent-${prediction.placeId}`}
            style={styles.predictionItem}
            onPress={() => handlePlaceSelect(prediction)}
            activeOpacity={0.7}
          >
            <View style={styles.predictionContent}>
              <Ionicons name="time-outline" size={18} color={COLORS.text2} style={styles.predictionIcon} />
              <View style={styles.predictionTextContainer}>
                <Text style={styles.predictionMainText} numberOfLines={1}>
                  {prediction.mainText}
                </Text>
                <Text style={styles.predictionSecondaryText} numberOfLines={1}>
                  {prediction.secondaryText}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => handleToggleFavorite(prediction, e)}
            >
              <Ionicons name={getFavoriteIcon(prediction.placeId)} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Cancella le ricerche recenti
  const clearRecentSearches = async () => {
    await userPreferences.clearAllPreferences();
    setRecentSearches([]);
    setFavoritePlaces([]);
    setShowRecent(false);
  };

  // Render dei luoghi preferiti
  const renderFavoritePlaces = () => {
    if (!showRecent || favoritePlaces.length === 0) return null;

    return (
      <View style={styles.favoritesContainer}>
        <Text style={styles.recentTitle}>Preferiti</Text>
        {favoritePlaces.map((prediction) => (
          <TouchableOpacity
            key={`favorite-${prediction.placeId}`}
            style={styles.predictionItem}
            onPress={() => handlePlaceSelect(prediction)}
            activeOpacity={0.7}
          >
            <View style={styles.predictionContent}>
              <Ionicons name="heart" size={18} color={COLORS.primary} style={styles.predictionIcon} />
              <View style={styles.predictionTextContainer}>
                <Text style={styles.predictionMainText} numberOfLines={1}>
                  {prediction.mainText}
                </Text>
                <Text style={styles.predictionSecondaryText} numberOfLines={1}>
                  {prediction.secondaryText}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => handleToggleFavorite(prediction, e)}
            >
              <Ionicons name="close" size={20} color={COLORS.text2} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          value={query}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          autoFocus={autoFocus}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Errore visualizzato fuori dall'animazione */}
      {!isLoading && errorPlace && !showPredictions && (
        <View style={styles.standaloneErrorContainer}>
          <Text style={styles.errorText}>{errorPlace}</Text>
        </View>
      )}
      
      {/* Lista di risultati */}
      <Animated.View
        style={[
          styles.predictionsContainer,
          { opacity: listOpacity, display: showPredictions ? 'flex' : 'none' }
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={true}
          style={styles.predictionsScrollView}
        >
          {/* Predizioni o Ricerche recenti */}
          {query.length > 0 ? renderPredictions() : renderRecentSearches()}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SPACING.borderRadius.medium,
    paddingHorizontal: SPACING.padding.small,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.margin.tiny,
  },
  searchIcon: {
    marginRight: SPACING.margin.tiny,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.normal,
    color: COLORS.text,
    padding: 0,
  },
  clearButton: {
    padding: SPACING.padding.tiny,
  },
  predictionsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SPACING.borderRadius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 300,
  },
  scrollContent: {
    paddingBottom: SPACING.padding.large,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.padding.small,
    paddingHorizontal: SPACING.padding.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  predictionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionIcon: {
    marginRight: SPACING.margin.small,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: TYPOGRAPHY.fontSize.normal,
    color: COLORS.text,
    fontWeight: '500',
  },
  predictionSecondaryText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.text2,
    marginTop: 1,
  },
  favoriteButton: {
    padding: 8,
  },
  loaderContainer: {
    padding: SPACING.padding.medium,
    alignItems: 'center',
  },
  recentContainer: {
    marginTop: SPACING.margin.small,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.padding.medium,
    paddingVertical: SPACING.padding.tiny,
  },
  recentTitle: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: '600',
    color: COLORS.text2,
    marginBottom: SPACING.margin.tiny,
    textTransform: 'uppercase',
  },
  clearText: {
    fontSize: TYPOGRAPHY.fontSize.small,
    color: COLORS.primary,
  },
  favoritesContainer: {
    marginTop: SPACING.margin.medium,
    paddingHorizontal: SPACING.padding.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    backgroundColor: COLORS.errorLight,
    borderRadius: 4,
    marginVertical: 4,
  },
  standaloneErrorContainer: {
    padding: SPACING.small,
    backgroundColor: COLORS.errorLight,
    borderRadius: 4,
    marginTop: 4,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  predictionsScrollView: {
    paddingBottom: SPACING.padding.large,
  },
});

export default PlacesInput; 