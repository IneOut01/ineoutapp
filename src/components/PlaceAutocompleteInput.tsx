import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import { PlacePrediction, SelectedPlaceInfo } from '../types/placePrediction';
import { COLORS, SHADOWS } from '../theme/colors';
import { FONTS, SIZES } from '../theme/typography';
import { userPreferencesService } from '../services/UserPreferencesService';
import * as Animatable from 'react-native-animatable';

const DEBOUNCE_MS = 300;

// Tipi di sorgenti per i suggerimenti
type PredictionSource = 'api' | 'favorite' | 'history';

interface PlaceAutocompleteInputProps {
  placeholder?: string;
  apiKey?: string;
  country?: string;
  language?: string;
  defaultValue?: string;
  onSelectPlace: (place: SelectedPlaceInfo) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  showLabel?: boolean;
  label?: string;
  inputStyle?: any;
  containerStyle?: any;
  errorMessage?: string;
  showLocationButton?: boolean;
  radius?: number;
  onLocationButtonPress?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'search' | 'next' | 'go';
}

const PlaceAutocompleteInput = ({
  placeholder = 'Cerca indirizzo',
  apiKey,
  country = 'it',
  language = 'it',
  defaultValue = '',
  onSelectPlace,
  onFocus,
  onBlur,
  onClear,
  showLabel = true,
  label = 'Indirizzo',
  inputStyle,
  containerStyle,
  errorMessage,
  showLocationButton = true,
  radius,
  onLocationButtonPress,
  onSubmitEditing,
  returnKeyType = 'search',
}: PlaceAutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<PlacePrediction | null>(null);
  const [selectionStartTime, setSelectionStartTime] = useState<number>(0);
  const [combinedPredictions, setCombinedPredictions] = useState<PlacePrediction[]>([]);
  const [viewHeight] = useState(new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const selectionIndex = useRef<number>(-1);

  // Hook per l'autocompletamento
  const {
    predictions: apiPredictions,
    loading,
    error,
    fetchPredictions,
    getPlaceDetails,
    clearPredictions,
  } = usePlacesAutocomplete({
    apiKey,
    language,
    country,
    debounce: DEBOUNCE_MS,
    radius,
  });

  // Ottieni suggerimenti basati su cronologia e preferiti
  const fetchLocalSuggestions = useCallback(async (input: string) => {
    if (!input) return [];
    return userPreferencesService.getSuggestions(input);
  }, []);

  // Combina i risultati dell'API e i suggerimenti locali
  useEffect(() => {
    const combineResults = async () => {
      if (!inputValue.trim()) {
        setCombinedPredictions([]);
        return;
      }

      const localSuggestions = await fetchLocalSuggestions(inputValue);
      
      // Se ci sono risultati API, li combina con i suggerimenti locali
      if (apiPredictions.length > 0) {
        // Filtra i duplicati (preferendo i dati locali)
        const existingIds = new Set(localSuggestions.map(p => p.placeId));
        const filteredApiPredictions = apiPredictions.filter(p => !existingIds.has(p.placeId));
        
        const combined = [...localSuggestions, ...filteredApiPredictions];
        
        // Personalizza l'ordine in base alle preferenze dell'utente
        const personalized = await userPreferencesService.personalizePredictions(combined);
        setCombinedPredictions(personalized);
      } else if (loading) {
        // Durante il caricamento, mostra solo i suggerimenti locali
        setCombinedPredictions(localSuggestions);
      } else if (localSuggestions.length > 0) {
        // Se non ci sono risultati API ma ci sono suggerimenti locali
        setCombinedPredictions(localSuggestions);
      } else {
        // Nessun risultato
        setCombinedPredictions([]);
      }
    };

    combineResults();
  }, [apiPredictions, loading, inputValue, fetchLocalSuggestions]);

  // Gestisce il cambio di valore nell'input
  const handleChangeText = (text: string) => {
    setInputValue(text);
    setSelectedPrediction(null);
    
    if (text.trim().length > 0) {
      fetchPredictions(text);
      setShowDropdown(true);
    } else {
      clearPredictions();
      setShowDropdown(false);
    }
  };

  // Controlla se mostrare il dropdown in base al focus e ai risultati
  useEffect(() => {
    const hasResults = combinedPredictions.length > 0;
    const shouldShow = isFocused && inputValue.trim().length > 0 && hasResults;
    
    setShowDropdown(shouldShow);
    
    // Animazione per l'altezza del dropdown
    Animated.timing(viewHeight, {
      toValue: shouldShow ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputValue, combinedPredictions, viewHeight]);

  // Gestisce la selezione di un luogo
  const handleSelectPlace = async (prediction: PlacePrediction, index: number) => {
    try {
      selectionIndex.current = index;
      setSelectedPrediction(prediction);
      setInputValue(prediction.description);
      setShowDropdown(false);
      Keyboard.dismiss();
      
      // Calcola il tempo impiegato per la selezione
      const timeToSelect = Date.now() - selectionStartTime;
      
      // Registra il comportamento di selezione dell'utente
      userPreferencesService.recordSelectionBehavior(
        index, 
        combinedPredictions.length,
        timeToSelect
      );
      
      // Aggiungi alla cronologia
      userPreferencesService.addToHistory(prediction);
      
      // Ottieni dettagli completi se necessario e disponibile
      let placeInfo: SelectedPlaceInfo;
      
      // Se la previsione è da API, ottieni i dettagli tramite API
      if (prediction.source !== 'favorite' && prediction.source !== 'history') {
        const details = await getPlaceDetails(prediction.placeId);
        
        if (details && details.geometry) {
          placeInfo = {
            placeId: prediction.placeId,
            description: prediction.description,
            location: {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            },
            address: details.formattedAddress || prediction.description,
            city: details.addressComponents?.find(c => 
              c.types.includes('locality') || c.types.includes('administrative_area_level_3')
            )?.longName || '',
            zipCode: details.addressComponents?.find(c => 
              c.types.includes('postal_code')
            )?.longName || '',
            country: details.addressComponents?.find(c => 
              c.types.includes('country')
            )?.longName || '',
          };
          
          // Registra la posizione di ricerca per riferimento futuro
          userPreferencesService.setLastSearchLocation(
            details.geometry.location.lat,
            details.geometry.location.lng
          );
        } else {
          // Fallback se i dettagli non sono disponibili
          placeInfo = {
            placeId: prediction.placeId,
            description: prediction.description,
            address: prediction.description,
          };
        }
      } else {
        // Per preferiti e cronologia, usa i dati memorizzati
        placeInfo = {
          placeId: prediction.placeId,
          description: prediction.description,
          address: prediction.description,
          ...(prediction.location && { location: prediction.location }),
          ...(prediction.city && { city: prediction.city }),
          ...(prediction.zipCode && { zipCode: prediction.zipCode }),
          ...(prediction.country && { country: prediction.country }),
        };
      }
      
      // Callback con i dati del luogo selezionato
      onSelectPlace(placeInfo);
    } catch (error) {
      console.error('Errore nella selezione del luogo:', error);
    }
  };

  // Gestione della pressione sul pulsante di posizione corrente
  const handleLocationButtonPress = () => {
    if (onLocationButtonPress) {
      onLocationButtonPress();
    }
  };

  // Gestione preferiti
  const handleToggleFavorite = async (prediction: PlacePrediction, e: any) => {
    e.stopPropagation();
    
    const isFav = prediction.isFavorite;
    
    if (isFav) {
      await userPreferencesService.removeFavorite(prediction.placeId);
    } else {
      await userPreferencesService.addFavorite(prediction);
    }
    
    // Aggiorna lo stato delle previsioni
    setCombinedPredictions(prevPredictions => 
      prevPredictions.map(p => 
        p.placeId === prediction.placeId 
          ? { ...p, isFavorite: !isFav } 
          : p
      )
    );
  };

  // Determina l'icona da mostrare in base alla fonte
  const getIconForPrediction = (prediction: PlacePrediction) => {
    if (prediction.source === 'favorite' || prediction.isFavorite) {
      return <Ionicons name="star" size={20} color={COLORS.warning} style={styles.predictionIcon} />;
    } else if (prediction.source === 'history') {
      return <Ionicons name="time" size={20} color={COLORS.textSecondary} style={styles.predictionIcon} />;
    } else {
      return <Ionicons name="location" size={20} color={COLORS.primary} style={styles.predictionIcon} />;
    }
  };

  // Rendering di una predizione nella lista
  const renderPrediction = ({ item, index }: { item: PlacePrediction; index: number }) => {
    const isLastItem = index === combinedPredictions.length - 1;
    
    return (
      <Animatable.View 
        animation="fadeIn" 
        duration={300} 
        delay={index * 30}
      >
        <TouchableOpacity
          style={[styles.predictionItem, isLastItem && styles.lastPredictionItem]}
          onPress={() => handleSelectPlace(item, index)}
          activeOpacity={0.7}
        >
          <View style={styles.predictionContent}>
            {getIconForPrediction(item)}
            <View style={styles.predictionTextContainer}>
              <Text numberOfLines={1} style={styles.predictionMainText}>
                {item.mainText}
              </Text>
              {item.secondaryText ? (
                <Text numberOfLines={1} style={styles.predictionSecondaryText}>
                  {item.secondaryText}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => handleToggleFavorite(item, e)}
          >
            <Ionicons
              name={item.isFavorite ? "star" : "star-outline"}
              size={20}
              color={item.isFavorite ? COLORS.warning : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  // Altezza calcolata per il dropdown
  const dropdownHeight = viewHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(combinedPredictions.length * 65, 300)],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {showLabel && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            setSelectionStartTime(Date.now());
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          placeholderTextColor={COLORS.textPlaceholder}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        
        {inputValue.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setInputValue('');
              clearPredictions();
              setShowDropdown(false);
              if (onClear) onClear();
            }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        
        {showLocationButton && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleLocationButtonPress}
          >
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      
      <Animated.View
        style={[
          styles.predictionsContainer,
          {
            height: dropdownHeight,
            opacity: viewHeight,
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Ricerca in corso...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={combinedPredictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              inputValue.trim().length > 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nessun risultato trovato</Text>
                </View>
              ) : null
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    marginBottom: 8,
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 8,
  },
  locationButton: {
    padding: 8,
    marginRight: 4,
  },
  predictionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  listContent: {
    paddingVertical: 4,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastPredictionItem: {
    borderBottomWidth: 0,
  },
  predictionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionIcon: {
    marginRight: 12,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textPrimary,
  },
  predictionSecondaryText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.xSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.xSmall,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default PlaceAutocompleteInput; 