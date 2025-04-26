import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

export interface FilterOptions {
  priceMin: number;
  priceMax: number;
  propertyType: string;
  minMonths: number;
  minSquareMeters: number;
  recentOnly: boolean;
}

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handlePropertyTypeSelect = (type: string) => {
    setFilters(prev => ({ ...prev, propertyType: type }));
  };

  const handleSliderChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, priceMin: value[0], priceMax: value[1] }));
  };

  const handlePriceMinChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({ ...prev, priceMin: numValue }));
  };

  const handlePriceMaxChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({ ...prev, priceMax: numValue }));
  };

  const handleMinMonthsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({ ...prev, minMonths: numValue }));
  };

  const handleMinSquareMetersChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({ ...prev, minSquareMeters: numValue }));
  };

  const handleRecentOnlyToggle = () => {
    setFilters(prev => ({ ...prev, recentOnly: !prev.recentOnly }));
  };

  const clearFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 5000,
      propertyType: 'all',
      minMonths: 0,
      minSquareMeters: 0,
      recentOnly: false
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const propertyTypes = [
    { id: 'apartment', label: 'Appartamento', icon: 'building' },
    { id: 'house', label: 'Casa', icon: 'home' },
    { id: 'room', label: 'Stanza', icon: 'door-open' },
    { id: 'studio', label: 'Monolocale', icon: 'cube' },
    { id: 'villa', label: 'Villa', icon: 'landmark' },
    { id: 'loft', label: 'Loft', icon: 'warehouse' }
  ];

  const isSelected = (type: string) => {
    return filters.propertyType === type;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtri</Text>
          <TouchableOpacity onPress={clearFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Ripristina</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Fascia di Prezzo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fascia di prezzo (€)</Text>
            <View style={styles.priceInputsContainer}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>Min</Text>
                <View style={styles.euroInputContainer}>
                  <Text style={styles.euroSign}>€</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="number-pad"
                    value={filters.priceMin.toString()}
                    onChangeText={handlePriceMinChange}
                    placeholder="0"
                  />
                </View>
              </View>
              
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>Max</Text>
                <View style={styles.euroInputContainer}>
                  <Text style={styles.euroSign}>€</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="number-pad"
                    value={filters.priceMax.toString()}
                    onChangeText={handlePriceMaxChange}
                    placeholder="5000"
                  />
                </View>
              </View>
            </View>
            
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5000}
              step={100}
              value={[filters.priceMin, filters.priceMax]}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="#DDDDDD"
              thumbTintColor={COLORS.primary}
            />
          </View>

          {/* Tipologia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipologia</Text>
            <View style={styles.propertyTypesContainer}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.propertyTypeButton,
                    isSelected(type.id) && styles.selectedPropertyType
                  ]}
                  onPress={() => handlePropertyTypeSelect(type.id)}
                >
                  <Text 
                    style={[
                      styles.propertyTypeText,
                      isSelected(type.id) && styles.selectedPropertyTypeText
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Permanenza minima */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permanenza minima (mesi)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={filters.minMonths > 0 ? filters.minMonths.toString() : ''}
              onChangeText={handleMinMonthsChange}
              placeholder="Inserisci il numero minimo di mesi"
              placeholderTextColor="#999"
            />
          </View>

          {/* Metratura minima */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metratura minima (m²)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={filters.minSquareMeters > 0 ? filters.minSquareMeters.toString() : ''}
              onChangeText={handleMinSquareMetersChange}
              placeholder="Inserisci la metratura minima"
              placeholderTextColor="#999"
            />
          </View>

          {/* Solo annunci recenti */}
          <View style={styles.switchSection}>
            <Text style={styles.switchLabel}>Solo annunci recenti</Text>
            <Switch
              value={filters.recentOnly}
              onValueChange={handleRecentOnlyToggle}
              trackColor={{ false: "#D9D9D9", true: `${COLORS.primary}80` }}
              thumbColor={filters.recentOnly ? COLORS.primary : "#F4F3F4"}
              ios_backgroundColor="#D9D9D9"
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.applyButton, { marginBottom: insets.bottom > 0 ? insets.bottom : 20 }]}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Applica filtri</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  priceInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceInputWrapper: {
    width: '45%',
  },
  priceInputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  euroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    height: 50,
  },
  euroSign: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  propertyTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  propertyTypeButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  selectedPropertyType: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  propertyTypeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPropertyTypeText: {
    color: 'white',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
    height: 50,
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    margin: 16,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FiltersModal; 