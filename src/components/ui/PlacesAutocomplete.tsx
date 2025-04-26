import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import usePlacesAutocomplete from '../../hooks/usePlacesAutocomplete';
import useSearchPrediction from '../../hooks/useSearchPrediction';
import { PlacePrediction } from '../../types/placePrediction';
import { COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTranslation } from '../../contexts/LanguageContext';
import { SearchHistoryItem } from '../../hooks/useSearchHistory';

interface PlacesAutocompleteProps {
  onSelectPlace: (place: PlacePrediction) => void;
  placeholder?: string;
  initialValue?: string;
  onChangeText?: (text: string) => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  language?: string;
  country?: string;
  showClearButton?: boolean;
  maxResults?: number;
  disabled?: boolean;
  showPredictions?: boolean;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onSelectPlace,
  placeholder,
  initialValue = '',
  onChangeText,
  containerStyle,
  inputStyle,
  language = 'it',
  country = 'it',
  showClearButton = true,
  maxResults = 5,
  disabled = false,
  showPredictions = true
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(initialValue);
  const [showResults, setShowResults] = useState(false);
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const {
    predictions: apiPredictions,
    isLoading,
    error,
    fetchPredictions,
    clearPredictions
  } = usePlacesAutocomplete({
    debounceMs: 300,
    language,
    country
  });

  const { getPredictions } = useSearchPrediction({
    maxPredictions: maxResults,
    recentWeight: 0.8,
    frequencyWeight: 0.2
  });

  const userPredictions = showPredictions ? getPredictions(inputValue) : [];

  const filteredApiPredictions = apiPredictions.slice(0, maxResults);

  const formattedApiPredictions: PlacePrediction[] = filteredApiPredictions.map(prediction => ({
    placeId: prediction.place_id,
    description: prediction.description,
    mainText: prediction.structured_formatting?.main_text || '',
    secondaryText: prediction.structured_formatting?.secondary_text || '',
    types: prediction.types || []
  }));

  const formattedUserPredictions: PlacePrediction[] = userPredictions.map(item => ({
    placeId: item.data?.placeId || `user_prediction_${item.id}`,
    description: item.query,
    mainText: item.query.split(',')[0] || item.query,
    secondaryText: item.query.split(',').slice(1).join(',').trim() || '',
    types: ['history'],
    isPrediction: true
  }));

  const combinedPredictions = [
    ...formattedUserPredictions,
    ...formattedApiPredictions.filter(apiPred => 
      !formattedUserPredictions.some(userPred => 
        userPred.description.toLowerCase() === apiPred.description.toLowerCase()
      )
    )
  ].slice(0, maxResults);

  useEffect(() => {
    if (initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    Animated.timing(resultsOpacity, {
      toValue: showResults && combinedPredictions.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, [showResults, combinedPredictions.length, resultsOpacity]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    if (onChangeText) {
      onChangeText(text);
    }
    
    if (text.trim().length > 2) {
      fetchPredictions(text);
      setShowResults(true);
    } else {
      clearPredictions();
      setShowResults(false);
    }
  };

  const handlePlaceSelect = (place: PlacePrediction) => {
    setInputValue(place.description);
    
    onSelectPlace(place);
    
    clearPredictions();
    setShowResults(false);
    
    Keyboard.dismiss();
  };

  const handleClearInput = () => {
    setInputValue('');
    
    if (onChangeText) {
      onChangeText('');
    }
    
    clearPredictions();
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder || t('search.enterLocationPlaceholder')}
          placeholderTextColor={COLORS.text.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          onFocus={() => inputValue.trim().length > 2 && setShowResults(true)}
          onBlur={handleBlur}
          returnKeyType="search"
        />
        {showClearButton && inputValue.length > 0 && (
          <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.resultsContainer,
          { opacity: resultsOpacity, display: showResults ? 'flex' : 'none' }
        ]}
        pointerEvents={showResults ? 'auto' : 'none'}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('search.errorLoadingPlaces')}</Text>
          </View>
        )}
        
        {!error && combinedPredictions.length === 0 && !isLoading && inputValue.trim().length > 2 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{t('search.noPlacesFound')}</Text>
          </View>
        )}
        
        {showPredictions && formattedUserPredictions.length > 0 && (
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>{t('search.personalSuggestions')}</Text>
          </View>
        )}
        
        <FlatList
          data={combinedPredictions}
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => (
            <Animatable.View 
              animation="fadeIn" 
              duration={300} 
              style={styles.resultItem}
            >
              <TouchableOpacity 
                style={styles.resultContent}
                onPress={() => handlePlaceSelect(item)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={item.isPrediction ? "star-outline" : "location-outline"} 
                  size={16} 
                  color={item.isPrediction ? COLORS.secondary : COLORS.text.secondary} 
                  style={styles.locationIcon} 
                />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.secondaryText || (item.isPrediction ? t('search.frequentSearch') : '')}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          )}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.borderRadius.medium,
    backgroundColor: COLORS.background.card,
    paddingHorizontal: SPACING.padding.medium,
    paddingVertical: SPACING.padding.small,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.margin.small,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.padding.tiny,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  clearButton: {
    padding: SPACING.padding.tiny,
  },
  loadingContainer: {
    position: 'absolute',
    right: SPACING.padding.large,
    top: 14,
    zIndex: 2,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.card,
    borderRadius: SPACING.borderRadius.medium,
    marginTop: SPACING.margin.tiny,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultsList: {
    borderRadius: SPACING.borderRadius.medium,
    overflow: 'hidden',
  },
  resultsContent: {
    flexGrow: 1,
  },
  predictionSection: {
    paddingVertical: SPACING.padding.tiny,
    paddingHorizontal: SPACING.padding.medium,
    backgroundColor: COLORS.background.highlight,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.text.secondary,
  },
  resultItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.padding.medium,
    paddingHorizontal: SPACING.padding.medium,
  },
  locationIcon: {
    marginRight: SPACING.margin.medium,
  },
  resultTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.text.primary,
  },
  secondaryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  errorContainer: {
    padding: SPACING.padding.medium,
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.error,
  },
  noResultsContainer: {
    padding: SPACING.padding.medium,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.text.secondary,
  },
});

export default PlacesAutocomplete; 