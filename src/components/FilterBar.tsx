import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import FilterPanel from './FilterPanel';
import { ListingFilters } from '../hooks/useListings';
import { useTranslation } from '../contexts/LanguageContext';

interface FilterBarProps {
  filters: ListingFilters;
  onFilterChange: (filters: ListingFilters) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  userLocation: any;
}

const { width } = Dimensions.get('window');

// Tipologie di alloggio disponibili
const TIPOLOGIE_ALLOGGIO = [
  { id: 'ROOM', name: 'Stanze singole', icon: 'bed-empty' },
  { id: 'APARTMENT', name: 'Appartamenti', icon: 'home' },
  { id: 'STUDIO', name: 'Monolocali', icon: 'home-city' },
  { id: 'OFFICE', name: 'Uffici', icon: 'office-building' },
];

// Filtri rapidi
const QUICK_FILTERS = [
  { id: 'price_asc', name: 'Prezzo (min)', icon: 'arrow-up', filter: { sortBy: 'price_asc' } },
  { id: 'price_desc', name: 'Prezzo (max)', icon: 'arrow-down', filter: { sortBy: 'price_desc' } },
  { id: 'newest', name: 'Più recenti', icon: 'clock-outline', filter: { sortBy: 'date_desc' } },
  { id: 'closest', name: 'Più vicini', icon: 'map-marker', filter: { sortByDistance: true } },
];

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  selectedType,
  onTypeChange,
  userLocation
}) => {
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const { t } = useTranslation();
  
  // Gestisce la selezione di un tipo di alloggio
  const handleTypeSelect = (typeId: string) => {
    onTypeChange(typeId);
  };

  // Gestisce l'applicazione di un filtro rapido
  const handleQuickFilter = (filterOption: any) => {
    // Combina i filtri esistenti con quelli del filtro rapido
    const newFilters = { ...filters, ...filterOption.filter };
    onFilterChange(newFilters);
  };

  // Verifica se un filtro rapido è attivo
  const isQuickFilterActive = (filter: any) => {
    if (filter.id === 'price_asc' && filters.sortBy === 'price_asc') return true;
    if (filter.id === 'price_desc' && filters.sortBy === 'price_desc') return true;
    if (filter.id === 'newest' && filters.sortBy === 'date_desc') return true;
    if (filter.id === 'closest' && filters.sortByDistance) return true;
    return false;
  };

  // Conta il numero di filtri attivi
  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Conta filtri di prezzo
    if (filters.priceMin || filters.priceMax) count++;
    
    // Conta altri filtri 
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    
    return count;
  };

  // Opzioni di tipo di alloggio
  const housingTypes = [
    { id: 'APARTMENT', icon: 'home-city', label: t('filters.apartment') },
    { id: 'ROOM', icon: 'bed', label: t('filters.room') },
    { id: 'HOUSE', icon: 'home', label: t('filters.house') },
    { id: 'STUDIO', icon: 'door', label: t('filters.studio') }
  ];
  
  // Quick filters
  const quickFilters = [
    { id: 'price_low', icon: 'sort-amount-down', label: t('filters.priceLow'), iconLib: FontAwesome5 },
    { id: 'price_high', icon: 'sort-amount-up', label: t('filters.priceHigh'), iconLib: FontAwesome5 },
    { id: 'recent', icon: 'access-time', label: t('filters.recent'), iconLib: MaterialIcons },
    { id: 'distance', icon: 'map-marker-distance', label: t('filters.nearest'), iconLib: MaterialCommunityIcons, disabled: !userLocation },
  ];

  return (
    <View style={styles.container}>
      {/* Filtri per tipo di alloggio */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesContainer}>
        {housingTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              selectedType === type.id && styles.typeButtonSelected
            ]}
            onPress={() => handleTypeSelect(type.id)}
          >
            <MaterialCommunityIcons
              name={type.icon as any}
              size={22}
              color={selectedType === type.id ? COLORS.white : COLORS.textSecondary}
            />
            <Text 
              style={[
                styles.typeLabel, 
                selectedType === type.id && styles.typeLabelSelected
              ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Quick filters (ordinamento e filtri rapidi) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersContainer}>
        {quickFilters.map((filter) => {
          const IconComponent = filter.iconLib;
          const isSelected = filters.orderBy === filter.id;
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.quickFilterButton,
                isSelected && styles.quickFilterButtonSelected,
                filter.disabled && styles.quickFilterDisabled
              ]}
              onPress={() => !filter.disabled && handleQuickFilter(filter)}
              disabled={filter.disabled}
            >
              <IconComponent
                name={filter.icon}
                size={16}
                color={isSelected ? COLORS.white : filter.disabled ? COLORS.textTertiary : COLORS.textSecondary}
              />
              <Text 
                style={[
                  styles.quickFilterLabel,
                  isSelected && styles.quickFilterLabelSelected,
                  filter.disabled && styles.quickFilterLabelDisabled
                ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {/* Pulsante filtri avanzati */}
        <TouchableOpacity 
          style={styles.advancedFilterButton}
          onPress={() => setFilterPanelVisible(true)}
        >
          <MaterialIcons name="tune" size={16} color={COLORS.primary} />
          <Text style={styles.advancedFilterLabel}>{t('filters.more')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pannello filtri avanzati */}
      <FilterPanel
        visible={filterPanelVisible}
        onClose={() => setFilterPanelVisible(false)}
        filters={filters}
        onApplyFilters={onFilterChange}
        userLocation={userLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  typesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: COLORS.textSecondary,
  },
  typeLabelSelected: {
    color: COLORS.white,
  },
  quickFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickFilterButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickFilterDisabled: {
    opacity: 0.6,
  },
  quickFilterLabel: {
    fontSize: 13,
    marginLeft: 4,
    color: COLORS.textSecondary,
  },
  quickFilterLabelSelected: {
    color: COLORS.white,
  },
  quickFilterLabelDisabled: {
    color: COLORS.textTertiary,
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  advancedFilterLabel: {
    fontSize: 13,
    marginLeft: 4,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default FilterBar; 