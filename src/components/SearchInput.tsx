import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Keyboard,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete';
import useSearchHistory from '../hooks/useSearchHistory';
import useAutoCorrect from '../hooks/useAutoCorrect';
import * as Animatable from 'react-native-animatable';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onPlaceSelect?: (placeId: string, description: string) => void;
  autoFocus?: boolean;
  showHistory?: boolean;
  showAutoComplete?: boolean;
  showAutoCorrect?: boolean;
  style?: any;
  inputStyle?: any;
  iconColor?: string;
  placeholderColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSubmit,
  onPlaceSelect,
  autoFocus = false,
  showHistory = true,
  showAutoComplete = true,
  showAutoCorrect = true,
  style,
  inputStyle,
  iconColor = COLORS.textSecondary,
  placeholderColor = COLORS.textTertiary,
  backgroundColor = COLORS.white,
  borderColor = COLORS.border,
  clearButtonMode = 'while-editing',
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [showClearButton, setShowClearButton] = useState(!!value);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Hook per la cronologia di ricerca
  const {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoading: isHistoryLoading
  } = useSearchHistory();

  // Hook per l'autocomplete dei luoghi
  const {
    predictions,
    isLoading: isPredictionsLoading,
    getPlaceDetails,
    clearPredictions
  } = usePlacesAutocomplete();

  // Hook per la correzione automatica
  const { correctQuery } = useAutoCorrect();

  // Effetto per l'animazione di entrata/uscita dei suggerimenti
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSuggestions ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [showSuggestions, slideAnim]);

  // Gestisci il cambio del testo di input
  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    onChangeText(text);
    setShowClearButton(!!text);
    
    // Mostra i suggerimenti solo se c'è testo nell'input
    if (text) {
      setShowSuggestions(true);
    } else {
      // Se il campo è vuoto, nascondi i suggerimenti con un piccolo ritardo
      // per permettere all'utente di vedere i suggerimenti della cronologia
      setTimeout(() => {
        if (!inputRef.current?.isFocused()) {
          setShowSuggestions(false);
        }
      }, 300);
    }
  };

  // Gestisci il submit della ricerca
  const handleSubmit = () => {
    if (!searchQuery.trim()) return;
    
    // Aggiungi alla cronologia
    addToHistory(searchQuery);
    
    // Nascondi i suggerimenti
    setShowSuggestions(false);
    
    // Dismetti la tastiera
    Keyboard.dismiss();
    
    // Invia il valore al genitore
    if (onSubmit) {
      onSubmit(searchQuery);
    }
  };

  // Gestisci la selezione di un luogo dai suggerimenti
  const handlePlaceSelect = (placeId: string, description: string) => {
    if (onPlaceSelect) {
      onPlaceSelect(placeId, description);
    } else {
      // Se non c'è una callback specifica, tratta come una normale ricerca
      setSearchQuery(description);
      onChangeText(description);
      handleSubmit();
    }
    
    // Nascondi i suggerimenti e pulisci l'elenco
    setShowSuggestions(false);
    clearPredictions();
  };

  // Gestisci la selezione di un elemento dalla cronologia
  const handleHistorySelect = (historyItem: string) => {
    setSearchQuery(historyItem);
    onChangeText(historyItem);
    
    // Dismetti la tastiera ma mantieni i suggerimenti visibili
    Keyboard.dismiss();
    
    // Invia subito la ricerca
    if (onSubmit) {
      onSubmit(historyItem);
    }
  };

  // Gestisci la correzione automatica
  const handleAutocorrect = (suggested: string) => {
    setSearchQuery(suggested);
    onChangeText(suggested);
    
    // Focus sull'input ma non inviare subito la ricerca
    inputRef.current?.focus();
  };

  // Pulisci il campo di ricerca
  const handleClear = () => {
    setSearchQuery('');
    onChangeText('');
    setShowClearButton(false);
    inputRef.current?.focus();
    clearPredictions();
  };

  // Gestisci il focus sull'input
  const handleFocus = () => {
    setIsFocused(true);
    if (searchQuery) {
      setShowSuggestions(true);
    }
    containerRef.current?.animate('pulse', 300);
  };

  // Gestisci la perdita di focus
  const handleBlur = () => {
    setIsFocused(false);
    // Ritardo per permettere la selezione dei suggerimenti
    setTimeout(() => {
      // Se stiamo facendo tap su un suggerimento, non nasconderli subito
      if (!inputRef.current?.isFocused()) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  // Cerca suggerimenti per la correzione automatica
  const autocorrection = showAutoCorrect ? correctQuery(searchQuery) : null;
  
  // Tutti i suggerimenti da mostrare
  const allSuggestions = [
    // Suggerimento di correzione (se esiste e ci sono correzioni)
    ...(autocorrection && autocorrection.hasCorrections
      ? [{ id: 'autocorrect', type: 'correction', text: autocorrection.corrected }]
      : []),
    
    // Suggerimenti di luoghi (se abilitati)
    ...(showAutoComplete && predictions && predictions.length > 0
      ? predictions.map(prediction => ({
          id: prediction.place_id,
          type: 'place',
          text: prediction.description,
          structured: prediction.structured_formatting
        }))
      : []),
    
    // Elementi dalla cronologia (se abilitati e ci sono risultati)
    ...(showHistory && searchHistory && searchHistory.length > 0
      ? searchHistory
          .filter(item => 
            item.toLowerCase().includes(searchQuery.toLowerCase()) &&
            // Evita duplicati con i luoghi suggeriti
            !predictions?.some(p => p.description.toLowerCase() === item.toLowerCase())
          )
          .map(item => ({
            id: `history-${item}`,
            type: 'history',
            text: item
          }))
      : [])
  ];

  // Renderizza un elemento della lista dei suggerimenti
  const renderSuggestionItem = ({ item }: any) => {
    if (item.type === 'correction') {
      // Suggerimento di correzione automatica
      return (
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => handleAutocorrect(item.text)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionContent}>
            <Ionicons name="flash" size={16} color={COLORS.primary} style={styles.suggestionIcon} />
            <View>
              <Text style={styles.suggestionText}>{item.text}</Text>
              <Text style={styles.suggestionSubtext}>{t('search.didYouMean')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'place') {
      // Suggerimento di luogo (Google Places)
      return (
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => handlePlaceSelect(item.id, item.text)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionContent}>
            <Ionicons name="location" size={16} color={COLORS.secondary} style={styles.suggestionIcon} />
            <View>
              {item.structured ? (
                <>
                  <Text style={styles.suggestionText}>{item.structured.main_text}</Text>
                  <Text style={styles.suggestionSubtext}>{item.structured.secondary_text}</Text>
                </>
              ) : (
                <Text style={styles.suggestionText}>{item.text}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      // Elemento dalla cronologia
      return (
        <TouchableOpacity
          style={styles.suggestionItem}
          onPress={() => handleHistorySelect(item.text)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionContent}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} style={styles.suggestionIcon} />
            <Text style={styles.suggestionText}>{item.text}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeFromHistory(item.text)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={[styles.containerWrapper, style]}>
      <Animatable.View
        ref={containerRef}
        animation="fadeInDown"
        duration={800}
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: isFocused ? COLORS.primary : borderColor,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={isFocused ? COLORS.primary : iconColor}
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder || t('search.placeholder')}
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode={Platform.OS === 'ios' ? clearButtonMode : 'never'}
        />
        
        {isPredictionsLoading && (
          <Animatable.View animation="fadeIn" duration={200}>
            <ActivityIndicator 
              size="small" 
              color={COLORS.primary} 
              style={styles.loadingIndicator} 
            />
          </Animatable.View>
        )}
        
        {Platform.OS === 'android' && showClearButton && !isPredictionsLoading && (
          <Animatable.View animation="fadeIn" duration={200}>
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={handleClear}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={18} 
                color={COLORS.textTertiary} 
              />
            </TouchableOpacity>
          </Animatable.View>
        )}
      </Animatable.View>
      
      {/* Contenitore animato per i suggerimenti */}
      <Animated.View 
        style={[
          styles.suggestionsContainer, 
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }
            ],
            display: showSuggestions ? 'flex' : 'none'
          }
        ]}
      >
        {/* Correzione automatica */}
        {showAutoCorrect && searchQuery && searchQuery.length > 2 && (
          <View>
            {/* Implementazione della correzione automatica */}
          </View>
        )}
        
        {/* Autocomplete luoghi */}
        {showAutoComplete && predictions && predictions.length > 0 && (
          <Animatable.View animation="fadeIn" duration={300}>
            <FlatList
              data={predictions}
              keyExtractor={(item) => `place_${item.placeId}`}
              renderItem={renderSuggestionItem}
              scrollEnabled={predictions.length > 3}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              contentContainerStyle={styles.suggestionsContent}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </Animatable.View>
        )}
        
        {/* Cronologia ricerche */}
        {showHistory && searchHistory && searchHistory.length > 0 && predictions && predictions.length === 0 && (
          <Animatable.View animation="fadeIn" duration={300}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{t('search.recentSearches')}</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>{t('search.clearHistory')}</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={searchHistory.slice(0, 5)}  // Mostra solo le ultime 5 ricerche
              keyExtractor={(item, index) => `history_${index}`}
              renderItem={renderHistoryItem}
              scrollEnabled={searchHistory.length > 3}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              contentContainerStyle={styles.suggestionsContent}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </Animatable.View>
        )}
      </Animated.View>
    </View>
  );

  // Renderizza un elemento della cronologia
  function renderHistoryItem({ item, index }: { item: string; index: number }) {
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleHistorySelect(item)}
        activeOpacity={0.6}
      >
        <View style={styles.historyIconContainer}>
          <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.historyText}>{item}</Text>
        <TouchableOpacity
          style={styles.historyRemoveButton}
          onPress={() => removeFromHistory(index)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  suggestionSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  clearHistoryText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  historyIconContainer: {
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  historyRemoveButton: {
    padding: 4,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  suggestionIconContainer: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default SearchInput; 