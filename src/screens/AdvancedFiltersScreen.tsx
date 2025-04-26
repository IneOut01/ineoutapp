import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Platform
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { useTranslation } from '../contexts/LanguageContext';

// Definizione dei tipi di alloggio disponibili
const housingTypes = [
  { id: 'stanza', label: 'Stanza' },
  { id: 'monolocale', label: 'Monolocale' },
  { id: 'bilocale', label: 'Bilocale' },
  { id: 'studio', label: 'Studio' },
];

const AdvancedFiltersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  
  // Recupera i filtri esistenti dai parametri di navigazione
  const existingFilters = route.params?.filters || {};
  
  // Stati per tutti i filtri
  const [selectedTypes, setSelectedTypes] = useState<string[]>(existingFilters.types || []);
  const [priceRange, setPriceRange] = useState({
    min: existingFilters.priceMin || 0,
    max: existingFilters.priceMax || 2000
  });
  const [sizeRange, setSizeRange] = useState({
    min: existingFilters.sizeMin || 0,
    max: existingFilters.sizeMax || 200
  });
  const [minStay, setMinStay] = useState(existingFilters.minStay || 1);
  const [instantBooking, setInstantBooking] = useState(existingFilters.instantBooking || false);
  const [onlyVerified, setOnlyVerified] = useState(existingFilters.onlyVerified || false);
  
  // Gestione selezione tipo alloggio
  const toggleHousingType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter(id => id !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };
  
  // Applica i filtri e torna alla schermata di ricerca
  const applyFilters = () => {
    const filters = {
      types: selectedTypes,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      sizeMin: sizeRange.min,
      sizeMax: sizeRange.max,
      minStay: minStay,
      instantBooking,
      onlyVerified
    };
    
    // Passa i filtri alla schermata di ricerca
    navigation.navigate('SearchStack', { 
      screen: 'Search',
      params: { filters }
    });
  };
  
  // Resetta tutti i filtri
  const resetFilters = () => {
    setSelectedTypes([]);
    setPriceRange({ min: 0, max: 2000 });
    setSizeRange({ min: 0, max: 200 });
    setMinStay(1);
    setInstantBooking(false);
    setOnlyVerified(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('filters.title', 'Filtri Avanzati')}</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetFilters}
          activeOpacity={0.8}
        >
          <Text style={styles.resetText}>{t('filters.reset', 'Reset')}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo di alloggio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters.housingType', 'Tipo di alloggio')}</Text>
          <View style={styles.typeContainer}>
            {housingTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedTypes.includes(type.id) && styles.typeButtonSelected
                ]}
                onPress={() => toggleHousingType(type.id)}
                activeOpacity={0.8}
              >
                <Text 
                  style={[
                    styles.typeButtonText,
                    selectedTypes.includes(type.id) && styles.typeButtonTextSelected
                  ]}
                >
                  {t(`filters.types.${type.id}`, type.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Fascia di prezzo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters.priceRange', 'Fascia di prezzo')}</Text>
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeValue}>€{priceRange.min}</Text>
            <Text style={styles.rangeValue}>€{priceRange.max}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2000}
            step={50}
            value={priceRange.max}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.gray}
            thumbTintColor={COLORS.primary}
            onValueChange={(value) => setPriceRange({...priceRange, max: value})}
          />
        </View>
        
        {/* Dimensioni */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters.sizeRange', 'Dimensioni (m²)')}</Text>
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeValue}>{sizeRange.min} m²</Text>
            <Text style={styles.rangeValue}>{sizeRange.max} m²</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={200}
            step={5}
            value={sizeRange.max}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.gray}
            thumbTintColor={COLORS.primary}
            onValueChange={(value) => setSizeRange({...sizeRange, max: value})}
          />
        </View>
        
        {/* Soggiorno minimo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters.minStay', 'Soggiorno minimo (mesi)')}</Text>
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeValue}>{minStay} {minStay === 1 ? t('filters.month', 'mese') : t('filters.months', 'mesi')}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={12}
            step={1}
            value={minStay}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.gray}
            thumbTintColor={COLORS.primary}
            onValueChange={(value) => setMinStay(value)}
          />
        </View>
        
        {/* Opzioni aggiuntive */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('filters.additionalOptions', 'Opzioni aggiuntive')}</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color={COLORS.primary} />
              <Text style={styles.switchText}>{t('filters.instantBooking', 'Prenotazione istantanea')}</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.gray, true: COLORS.primaryLight }}
              thumbColor={instantBooking ? COLORS.primary : COLORS.lightGray}
              ios_backgroundColor={COLORS.gray}
              onValueChange={() => setInstantBooking(!instantBooking)}
              value={instantBooking}
            />
          </View>
          
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.primary} />
              <Text style={styles.switchText}>{t('filters.verifiedOnly', 'Solo alloggi verificati')}</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.gray, true: COLORS.primaryLight }}
              thumbColor={onlyVerified ? COLORS.primary : COLORS.lightGray}
              ios_backgroundColor={COLORS.gray}
              onValueChange={() => setOnlyVerified(!onlyVerified)}
              value={onlyVerified}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Pulsante di applicazione filtri */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={applyFilters}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>{t('filters.applyFilters', 'Applica filtri')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginHorizontal: 5,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  typeButtonTextSelected: {
    color: COLORS.white,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rangeValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdvancedFiltersScreen; 