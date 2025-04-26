import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import useAutoCorrect from '../../hooks/useAutoCorrect';
import useSearchHistory from '../../hooks/useSearchHistory';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { GOOGLE_MAPS_API_KEY, isGoogleConfigValid } from '../../config/apiKeys';

// Verifica che la chiave API sia disponibile
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Places API key non trovata. La funzionalità di autocompletamento potrebbe non funzionare correttamente.');
}

interface SearchInputWithAutoCompleteProps {
  placeholder?: string;
  onSearch: (query: string, placeDetails?: any) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  initialQuery?: string;
  showRecentSearches?: boolean;
  showSuggestions?: boolean;
  style?: any;
}

const SearchInputWithAutoComplete = ({
  placeholder,
  onSearch,
  onLocationSelect,
  initialQuery = '',
  showRecentSearches = true,
  showSuggestions = true,
  style
}: SearchInputWithAutoCompleteProps) => {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const autocompleteRef = useRef<any>(null);

  // Get auto-correct functionality
  const { suggestions, getSuggestions } = useAutoCorrect();
  
  // Get search history
  const { 
    searchHistory, 
    addToHistory, 
    removeFromHistory, 
    isLoading: isHistoryLoading 
  } = useSearchHistory();

  // Generate suggestions based on user input
  useEffect(() => {
    if (query && query.length > 2 && showSuggestions) {
      getSuggestions(query);
      setShowSuggestionPanel(true);
    } else {
      setShowSuggestionPanel(false);
    }
  }, [query, getSuggestions, showSuggestions]);

  // Handle search submission
  const handleSearch = useCallback((text: string, details?: any) => {
    if (text.trim()) {
      setQuery(text);
      addToHistory({ query: text, timestamp: new Date().toISOString() });
      
      if (details && details.geometry) {
        const { lat, lng } = details.geometry.location;
        if (onLocationSelect) {
          onLocationSelect({ 
            lat, 
            lng, 
            address: details.formatted_address || text 
          });
        }
      }
      
      onSearch(text, details);
      setShowHistory(false);
      setShowSuggestionPanel(false);
      setIsFocused(false);
    }
  }, [addToHistory, onLocationSelect, onSearch]);

  // Handle suggestion selection
  const handleSuggestionPress = useCallback((suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Handle history item selection
  const handleHistoryPress = useCallback((historyItem: string) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  }, [handleSearch]);

  // Handle removing history item
  const handleRemoveHistory = useCallback((item: { query: string; timestamp: string }) => {
    removeFromHistory(item);
  }, [removeFromHistory]);

  // Clear the search input
  const handleClearSearch = useCallback(() => {
    setQuery('');
    if (autocompleteRef.current) {
      autocompleteRef.current.clear();
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.inputContainer,
        { backgroundColor: colors.background, borderColor: colors.border },
        isFocused && { borderColor: colors.primary }
      ]}>
        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          placeholder={placeholder || t('search.placeholderText')}
          onPress={(data, details = null) => {
            handleSearch(data.description, details);
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'it',
            components: 'country:it',
          }}
          fetchDetails={true}
          onFail={(error) => console.error(error)}
          onNotFound={() => console.log('No results found')}
          textInputProps={{
            value: query,
            onChangeText: (text) => {
              setQuery(text);
              setIsTyping(true);
              // Imposta un timeout per considerare la digitazione come completata
              setTimeout(() => setIsTyping(false), 500);
            },
            onFocus: () => {
              setIsFocused(true);
              if (showRecentSearches && searchHistory.length > 0) {
                setShowHistory(true);
              }
            },
            onBlur: () => {
              // Delay hiding elements to allow taps to register
              setTimeout(() => {
                setIsFocused(false);
                setShowHistory(false);
                setShowSuggestionPanel(false);
              }, 150);
            },
            autoCapitalize: 'none',
            autoCorrect: false,
            style: styles.input,
          }}
          onPredefinedPlacesAlwaysVisible={false}
          enablePoweredByContainer={false}
          styles={{
            container: styles.placesContainer,
            textInputContainer: styles.placesInputContainer,
            textInput: styles.placesInput,
            poweredContainer: { display: 'none' },
            predefinedPlacesDescription: { color: colors.primary },
            separator: { backgroundColor: colors.border, height: 0.5 },
            description: { color: colors.text },
            row: {
              backgroundColor: colors.background,
              padding: spacing.sm,
            },
            listView: {
              position: 'absolute',
              top: 50,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderRadius: 5,
              elevation: 3,
              zIndex: 1000,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 1.5,
              display: isFocused && (isTyping || isPlacesLoading) ? 'flex' : 'none',
            },
          }}
          renderLeftButton={() => (
            <View style={styles.iconContainer}>
              <Ionicons name="search" size={20} color={colors.text} />
            </View>
          )}
          renderRightButton={() => 
            query ? (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearSearch}
              >
                <Ionicons name="close-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null
          }
          listEmptyComponent={() => (
            isPlacesLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : null
          )}
          onLoadingStart={() => setIsPlacesLoading(true)}
          onLoadingComplete={() => setIsPlacesLoading(false)}
        />
      </View>

      {/* Panel per la cronologia delle ricerche */}
      {showHistory && searchHistory.length > 0 && (
        <View style={[
          styles.panel,
          { backgroundColor: colors.background, borderColor: colors.border }
        ]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            {t('search.recentSearches')}
          </Text>
          {isHistoryLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            searchHistory.slice(0, 5).map((item, index) => (
              <View key={`${item.query}-${index}`} style={styles.historyItem}>
                <TouchableOpacity 
                  style={styles.historyTextContainer}
                  onPress={() => handleHistoryPress(item.query)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.secondaryText} />
                  <Text style={[styles.historyText, { color: colors.secondaryText }]}>
                    {item.query}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveHistory(item)}>
                  <Ionicons name="close" size={16} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* Panel per i suggerimenti */}
      {showSuggestionPanel && suggestions.length > 0 && (
        <View style={[
          styles.panel,
          { backgroundColor: colors.background, borderColor: colors.border }
        ]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            {t('search.suggestions')}
          </Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Ionicons name="compass-outline" size={16} color={colors.primary} />
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  placesContainer: {
    flex: 1,
  },
  placesInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  placesInput: {
    height: 48,
    margin: 0,
    borderRadius: 5,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingLeft: 0,
  },
  iconContainer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  historyTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    marginLeft: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default SearchInputWithAutoComplete; 