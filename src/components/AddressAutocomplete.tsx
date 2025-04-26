import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Modal,
  Text,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import { PlacePredictionsList } from './PlacePredictionsList';
import { PlacePrediction } from '../types/placePrediction';
import { PlaceStorage } from '../services/PlaceStorage';
import { COLORS } from '../theme/colors';

interface AddressAutocompleteProps {
  placeholder?: string;
  apiKey?: string;
  onSelectPlace: (place: PlacePrediction) => void;
  initialValue?: string;
  containerStyle?: object;
  inputStyle?: object;
  modalTitle?: string;
  searchInProgress?: boolean;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
}

export const AddressAutocomplete = ({
  placeholder = 'Cerca un indirizzo',
  apiKey,
  onSelectPlace,
  initialValue = '',
  containerStyle,
  inputStyle,
  modalTitle = 'Cerca indirizzo',
  searchInProgress = false,
  showCurrentLocation = true,
  autoFocus = false,
}: AddressAutocompleteProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState(initialValue);
  const [showClearButton, setShowClearButton] = useState(false);
  const [lastUsedPlace, setLastUsedPlace] = useState<PlacePrediction | null>(null);
  const inputRef = useRef<TextInput>(null);
  const modalAnimation = useRef(new Animated.Value(0)).current;

  const {
    predictions,
    loading,
    fetchPredictions,
    clearPredictions,
    getPlaceDetails,
  } = usePlacesAutocomplete({
    apiKey,
    debounceMs: 300,
    minLengthToSearch: 3,
  });

  useEffect(() => {
    // Load last used place
    const loadLastUsedPlace = async () => {
      const place = await PlaceStorage.getLastUsedPlace();
      if (place) {
        setLastUsedPlace(place);
      }
    };
    
    loadLastUsedPlace();
  }, []);

  useEffect(() => {
    setShowClearButton(inputText.length > 0);
  }, [inputText]);

  const handleOpenModal = () => {
    setModalVisible(true);
    animateModal(1);
    
    // Allow input to properly focus on modal appear
    setTimeout(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);
  };

  const handleCloseModal = () => {
    // First animate out
    animateModal(0);
    // Then close the modal after animation
    setTimeout(() => {
      setModalVisible(false);
      clearPredictions();
      Keyboard.dismiss();
    }, 200);
  };

  const animateModal = (toValue: number) => {
    Animated.timing(modalAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (text.length > 0) {
      fetchPredictions(text);
    } else {
      clearPredictions();
    }
  };

  const handleClearInput = () => {
    setInputText('');
    clearPredictions();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectPlace = async (place: PlacePrediction) => {
    const placeDetails = await getPlaceDetails(place.placeId);
    
    onSelectPlace(placeDetails || place);
    setInputText(place.structuredFormatting?.mainText || place.description);
    
    handleCloseModal();
  };

  const handleUseLastPlace = () => {
    if (lastUsedPlace) {
      onSelectPlace(lastUsedPlace);
    }
  };

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const modalBackdropOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const MainInput = () => (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handleOpenModal}
      activeOpacity={0.7}
    >
      <View style={[styles.inputContainer, inputStyle]}>
        <Ionicons name="search" size={20} color={COLORS.darkGrey} style={styles.searchIcon} />
        <Text
          style={[
            styles.inputDisplayText,
            !initialValue && !lastUsedPlace && { color: COLORS.grey }
          ]}
          numberOfLines={1}
        >
          {initialValue || (lastUsedPlace ? lastUsedPlace.description : placeholder)}
        </Text>
      </View>
      
      {lastUsedPlace && !initialValue && (
        <TouchableOpacity
          style={styles.useLastButton}
          onPress={handleUseLastPlace}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.useLastText}>Usa</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <MainInput />
      
      {/* Modal for search and results */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
          keyboardVerticalOffset={40}
        >
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: modalBackdropOpacity }
            ]}
            onTouchEnd={handleCloseModal}
          />
          
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={styles.closeButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.black} />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>{modalTitle}</Text>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.darkGrey} style={styles.searchIcon} />
              
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                value={inputText}
                onChangeText={handleInputChange}
                placeholder={placeholder}
                placeholderTextColor={COLORS.grey}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="never"
                autoCorrect={false}
              />
              
              {showClearButton && (
                <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={COLORS.darkGrey} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.listContainer}>
              <PlacePredictionsList
                predictions={predictions}
                loading={loading || searchInProgress}
                onSelectPlace={handleSelectPlace}
                showHistory={true}
                showFavorites={true}
                emptyMessage={inputText.length > 0 ? 'Nessun risultato trovato' : 'Cerca un indirizzo o seleziona dai preferiti'}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDisplayText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingLeft: 8,
  },
  useLastButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  useLastText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 14,
  },
  searchIcon: {
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
  },
}); 