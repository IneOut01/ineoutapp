import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  TextInput,
  Switch,
  Dimensions
} from 'react-native';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTranslation } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const { width, height } = Dimensions.get('window');

// Tipi di proprietà disponibili
const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Appartamento' },
  { id: 'house', label: 'Casa' },
  { id: 'villa', label: 'Villa' },
  { id: 'studio', label: 'Monolocale' },
  { id: 'room', label: 'Stanza' },
  { id: 'loft', label: 'Loft' },
  { id: 'penthouse', label: 'Attico' },
];

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApplyFilters: (filters: any) => void;
  userLocation: any;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  userLocation
}) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // State per i filtri
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange || [0, 5000]
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    filters.types || []
  );
  const [minMonths, setMinMonths] = useState<string>(
    filters.minMonths ? filters.minMonths.toString() : ''
  );
  const [minSize, setMinSize] = useState<string>(
    filters.minSize ? filters.minSize.toString() : ''
  );
  const [recentOnly, setRecentOnly] = useState<boolean>(
    filters.recentOnly || false
  );

  // Aggiorna gli stati quando cambiano i filtri
  useEffect(() => {
    setPriceRange(filters.priceRange || [0, 5000]);
    setSelectedTypes(filters.types || []);
    setMinMonths(filters.minMonths ? filters.minMonths.toString() : '');
    setMinSize(filters.minSize ? filters.minSize.toString() : '');
    setRecentOnly(filters.recentOnly || false);
  }, [filters]);

  // Animazione panel
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Gestori dei cambiamenti
  const handlePriceRangeChange = (values: [number, number]) => {
    setPriceRange(values);
  };

  const handlePropertyTypeSelect = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleMinMonthsChange = (text: string) => {
    // Assicurati che sia un numero valido
    if (text === '' || /^[0-9]+$/.test(text)) {
      setMinMonths(text);
    }
  };

  const handleMinSizeChange = (text: string) => {
    // Assicurati che sia un numero valido
    if (text === '' || /^[0-9]+$/.test(text)) {
      setMinSize(text);
    }
  };

  const handleRecentOnlyChange = (value: boolean) => {
    setRecentOnly(value);
  };

  // Applica i filtri
  const applyFilters = () => {
    const newFilters = {
      priceRange,
      types: selectedTypes,
      minMonths: minMonths !== '' ? parseInt(minMonths) : undefined,
      minSize: minSize !== '' ? parseInt(minSize) : undefined,
      recentOnly: recentOnly,
    };

    onApplyFilters(newFilters);
    onClose();
  };

  // Resetta tutti i filtri
  const resetFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedTypes([]);
    setMinMonths('');
    setMinSize('');
    setRecentOnly(false);
  };

  // Funzione per renderizzare i filtri aggiuntivi
  function renderAdditionalFilters() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('filters.additional', 'Filtri aggiuntivi')}</Text>
        
        {/* Minimo mesi */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('filters.minMonths', 'Mesi minimi')}</Text>
          <TextInput
            style={styles.textInput}
            value={minMonths}
            onChangeText={handleMinMonthsChange}
            placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
        
        {/* Minima metratura */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('filters.minSize', 'Metratura minima')}</Text>
          <TextInput
            style={styles.textInput}
            value={minSize}
            onChangeText={handleMinSizeChange}
            placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Checkbox per annunci recenti */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('filters.recentOnly', 'Solo annunci recenti')}</Text>
          <Switch
            value={recentOnly}
            onValueChange={handleRecentOnlyChange}
            trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>
    );
  }

  // Render del componente
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('filters.title', 'Filtri')}</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
              <Text style={styles.resetText}>{t('filters.reset', 'Reset')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Sezione prezzo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('filters.price', 'Prezzo')}</Text>
              <View style={styles.priceLabels}>
                <Text style={styles.priceLabel}>€{priceRange[0]}</Text>
                <Text style={styles.priceLabel}>€{priceRange[1]}</Text>
              </View>
              <MultiSlider
                values={[priceRange[0], priceRange[1]]}
                min={0}
                max={5000}
                step={50}
                sliderLength={width - 60}
                onValuesChange={handlePriceRangeChange}
                selectedStyle={styles.selectedSlider}
                unselectedStyle={styles.unselectedSlider}
                containerStyle={styles.sliderContainer}
                markerStyle={styles.marker}
                trackStyle={styles.track}
              />
            </View>

            {/* Tipologia immobili */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('filters.propertyType', 'Tipologia immobile')}</Text>
              <View style={styles.propertyTypesContainer}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.propertyTypeButton,
                      selectedTypes.includes(type.id) && styles.propertyTypeSelected,
                    ]}
                    onPress={() => handlePropertyTypeSelect(type.id)}
                  >
                    <Text 
                      style={[
                        styles.propertyTypeText,
                        selectedTypes.includes(type.id) && styles.propertyTypeTextSelected
                      ]}
                    >
                      {t(`propertyTypes.${type.id}`, type.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtri aggiuntivi */}
            {renderAdditionalFilters()}
          </ScrollView>

          {/* Footer con pulsante per applicare */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>
                {t('filters.apply', 'Applica filtri')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sliderContainer: {
    alignItems: 'center',
    height: 50,
  },
  selectedSlider: {
    backgroundColor: COLORS.primary,
  },
  unselectedSlider: {
    backgroundColor: COLORS.lightGrey,
  },
  marker: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 2,
    height: 20,
    width: 20,
    borderRadius: 10,
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  propertyTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propertyTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
    marginRight: 8,
    marginBottom: 8,
  },
  propertyTypeSelected: {
    backgroundColor: COLORS.primary,
  },
  propertyTypeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  propertyTypeTextSelected: {
    color: COLORS.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});

export default FilterPanel; 