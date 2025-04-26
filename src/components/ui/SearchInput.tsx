import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  FlatList,
  Keyboard,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import usePlacesAutocomplete from '../../hooks/usePlacesAutocomplete';
import useSearchHistory, { SearchHistoryItem } from '../../hooks/useSearchHistory';
import { useTranslation } from '../../contexts/LanguageContext';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onSelectPlace?: (placeId: string, description: string) => void;
  containerStyle?: object;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onSelectPlace,
  containerStyle,
  autoFocus = false,
  showSuggestions = true
}: SearchInputProps) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsHeight = useRef(new Animated.Value(0)).current;
  
  // Gestione della cronologia di ricerca
  const { 
    history, 
    addToHistory, 
    isLoading: isHistoryLoading 
  } = useSearchHistory();

  // Google Places Autocomplete
  const { 
    predictions, 
    isLoading: isPredictionsLoading,
    fetchPredictions,
    getPlaceDetails
  } = usePlacesAutocomplete({
    debounceTime: 300,
    language: 'it',
    country: 'it',
    types: ['geocode', 'establishment']
  });

  // Prevenire la visualizzazione di suggerimenti per query brevi
  const shouldShowSuggestions = value.length > 2 && showSuggestions;
  
  // Filtra la cronologia in base all'input corrente
  const filteredHistory = history
    .filter(item => item.query.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 3);

  // Effetto per animare l'entrata del componente
  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);

  // Effetto per animare i suggerimenti quando l'input è focalizzato
  useEffect(() => {
    if (isFocused && shouldShowSuggestions && (predictions.length > 0 || filteredHistory.length > 0)) {
      Animated.spring(suggestionsHeight, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(suggestionsHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [isFocused, shouldShowSuggestions, predictions.length, filteredHistory.length]);

  // Gestisce il focus sull'input
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Gestisce la perdita di focus sull'input
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Gestisce la pulizia dell'input
  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  // Gestisce la ricerca
  const handleSearch = () => {
    if (value.trim()) {
      // Aggiungi alla cronologia
      addToHistory({
        query: value.trim(),
        type: 'text'
      });
      
      // Esegui ricerca
      if (onSubmit) {
        onSubmit(value.trim());
      }
      
      Keyboard.dismiss();
      setIsFocused(false);
    }
  };

  // Gestisce la selezione di un luogo dai risultati di autocomplete
  const handleSelectPlace = async (placeId: string, description: string) => {
    // Aggiorna l'input con la descrizione del luogo
    onChangeText(description);
    
    // Aggiungi alla cronologia
    addToHistory({
      query: description,
      type: 'place',
      data: { placeId }
    });
    
    // Opzionalmente ottieni dettagli e invia al genitore
    if (onSelectPlace) {
      onSelectPlace(placeId, description);
    }
    
    Keyboard.dismiss();
    setIsFocused(false);
  };

  // Gestisce la selezione di un elemento dalla cronologia
  const handleSelectHistory = (item: SearchHistoryItem) => {
    onChangeText(item.query);
    
    if (item.type === 'place' && item.data?.placeId && onSelectPlace) {
      onSelectPlace(item.data.placeId, item.query);
    } else if (onSubmit) {
      onSubmit(item.query);
    }
    
    Keyboard.dismiss();
    setIsFocused(false);
  };

  // Aggiorna i suggerimenti quando l'input cambia
  useEffect(() => {
    if (value.length > 2) {
      fetchPredictions(value);
    }
  }, [value, fetchPredictions]);

  // Rendering dell'elemento di cronologia
  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <Animatable.View 
      animation="fadeIn" 
      duration={400} 
      style={styles.suggestionItem}
    >
      <TouchableOpacity
        style={styles.suggestionContent}
        onPress={() => handleSelectHistory(item)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="time-outline" 
          size={18} 
          color={COLORS.text.secondary} 
          style={styles.itemIcon} 
        />
        <Text style={styles.suggestionText} numberOfLines={1}>{item.query}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  // Rendering dell'elemento di predizione
  const renderPredictionItem = ({ item }: { item: any }) => (
    <Animatable.View 
      animation="fadeIn" 
      duration={400} 
      style={styles.suggestionItem}
    >
      <TouchableOpacity
        style={styles.suggestionContent}
        onPress={() => handleSelectPlace(item.place_id, item.description)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="location-outline" 
          size={18} 
          color={COLORS.text.secondary} 
          style={styles.itemIcon} 
        />
        <Text style={styles.suggestionText} numberOfLines={1}>
          {item.description}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        containerStyle,
        { opacity: containerOpacity }
      ]}
    >
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={COLORS.text.secondary} 
          style={styles.searchIcon} 
        />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder || t('search.placeholder')}
          placeholderTextColor={COLORS.text.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggerimenti */}
      <Animated.View 
        style={[
          styles.suggestionsContainer,
          { 
            opacity: suggestionsHeight,
            transform: [{ 
              scaleY: suggestionsHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
              })
            }],
            height: suggestionsHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.min((predictions.length + filteredHistory.length) * 50, 300)]
            })
          }
        ]}
      >
        {/* Loader */}
        {(isPredictionsLoading || isHistoryLoading) && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}

        {/* Cronologia */}
        {filteredHistory.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t('search.recentSearches')}</Text>
            <FlatList
              data={filteredHistory}
              renderItem={renderHistoryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Predizioni */}
        {predictions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t('search.suggestions')}</Text>
            <FlatList
              data={predictions}
              renderItem={renderPredictionItem}
              keyExtractor={item => item.place_id}
              scrollEnabled={true}
              style={styles.predictionsList}
            />
          </View>
        )}

        {/* Nessun risultato */}
        {isFocused && shouldShowSuggestions && 
          predictions.length === 0 && 
          filteredHistory.length === 0 && 
          !isPredictionsLoading && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>{t('search.noResults')}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SPACING.borderRadius.medium,
    paddingHorizontal: SPACING.padding.medium,
    height: 48,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: SPACING.margin.small,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  clearButton: {
    padding: SPACING.padding.tiny,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SPACING.borderRadius.medium,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
    overflow: 'hidden',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  loaderContainer: {
    padding: SPACING.padding.medium,
    alignItems: 'center',
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.padding.medium,
  },
  itemIcon: {
    marginRight: SPACING.margin.small,
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.text.primary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.padding.medium,
    paddingTop: SPACING.padding.small,
    paddingBottom: SPACING.padding.tiny,
    backgroundColor: COLORS.background.highlight,
  },
  predictionsList: {
    maxHeight: 200,
  },
  noResults: {
    padding: SPACING.padding.medium,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.text.secondary,
  }
});

export default SearchInput; 