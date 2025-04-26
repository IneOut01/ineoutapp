import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
  Alert,
  ScrollView,
  RefreshControl,
  StatusBar,
  Modal,
  PermissionsAndroid
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import ListingCard from '../components/ListingCard';
import FilterBar from '../components/FilterBar';
import { Listing } from '../types/listing';
import { useListings } from '../hooks/useListings';
import { useCities } from '../hooks/useCities';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from '../contexts/LanguageContext';
import Geolocation from 'react-native-geolocation-service';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import debounce from 'lodash.debounce';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { FilterOptions, SortByOption, SortOrderOption } from '../types/filters';
import { calculateDistance } from '../utils/locationUtils';
import StatusBarManager from '../components/StatusBarManager';
import NoResults from '../components/NoResults';
import ErrorView from '../components/ErrorView';
import FilterPanel from '../components/FilterPanel';
import CategorySelector from '../components/CategorySelector';
import DrawMapZone from '../components/DrawMapZone';
import { DEFAULT_LOCATION } from '../constants/locations';
import { ListingFilters } from '../hooks/useListings';
import Dropdown from '../components/Dropdown';
import FiltersModal, { FilterOptions as AdvancedFilterOptions } from '../components/FiltersModal';

const { width, height } = Dimensions.get('window');
const DEFAULT_RADIUS = 10; // km

type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;

const DEFAULT_FILTERS: FilterOptions = {
  priceRange: [0, 10000],
  bedrooms: null,
  bathrooms: null,
  amenities: [],
  propertyTypes: [],
  sortBy: 'createdAt' as SortByOption,
  sortOrder: 'desc' as SortOrderOption,
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const SearchScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<SearchScreenRouteProp>();
  const categoryFromParams = route.params?.categoryId || null;
  const categoryNameFromParams = route.params?.categoryName || null;
  const searchFromParams = route.params?.search || '';
  
  const [searchQuery, setSearchQuery] = useState(searchFromParams);
  const [activeSearchQuery, setActiveSearchQuery] = useState(searchFromParams);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromParams);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isAdvancedFilterModalVisible, setIsAdvancedFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>({
    ...DEFAULT_FILTERS,
    ...(route.params?.filters || {}),
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const { categories, loading: categoriesLoading } = useCategories();
  const [userLocation, setUserLocation] = useState<Geolocation.Position | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterOptions>({
    priceMin: 0,
    priceMax: 5000,
    propertyType: 'all',
    minMonths: 0,
    minSquareMeters: 0,
    recentOnly: false
  });
  
  const { 
    listings, 
    loading, 
    error, 
    refetch: refetchListings,
    hasMore,
    loadMore,
    loadingMore,
    initialLoadComplete
  } = useListings(
    selectedAreaBounds,
    {
      ...filters,
      query: activeSearchQuery,
      priceMin: advancedFilters.priceMin,
      priceMax: advancedFilters.priceMax,
      types: advancedFilters.propertyType !== 'all' ? [advancedFilters.propertyType] : undefined,
      minMonths: advancedFilters.minMonths,
      minSize: advancedFilters.minSquareMeters,
      recentOnly: advancedFilters.recentOnly,
    },
    userLocation?.coords ? {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude
    } : null
  );
  
  const { cities } = useCities();
  
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  
  // Draw map zone state
  const [showDrawMap, setShowDrawMap] = useState(false);
  const [selectedAreaBounds, setSelectedAreaBounds] = useState<any>(null);

  // Prevenire refetch multipli usando un ref per tracking
  const isRefetchingRef = useRef(false);
  
  // Funzione per richiedere i permessi di localizzazione
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permesso di localizzazione',
          message: 'Questa app ha bisogno di accedere alla tua posizione',
          buttonNeutral: 'Chiedimelo più tardi',
          buttonNegative: 'Annulla',
          buttonPositive: 'OK'
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  };

  useEffect(() => {
    (async () => {
      setIsLoadingLocation(true);
      const granted = await requestLocationPermission();
      setLocationPermissionGranted(granted);
      
      if (granted) {
        try {
          Geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed
                },
                timestamp: position.timestamp
              });
              setIsLoadingLocation(false);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Fallback to default location
              setUserLocation({
                coords: {
                  latitude: DEFAULT_LOCATION.latitude,
                  longitude: DEFAULT_LOCATION.longitude,
                  altitude: null,
                  accuracy: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
              setIsLoadingLocation(false);
            },
            { 
              enableHighAccuracy: false, 
              timeout: 15000, 
              maximumAge: 10000 
            }
          );
        } catch (error) {
          console.error('Error getting location:', error);
          // Fallback to default location
          setUserLocation({
            coords: {
              latitude: DEFAULT_LOCATION.latitude,
              longitude: DEFAULT_LOCATION.longitude,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
          setIsLoadingLocation(false);
        }
      } else {
        // Use default location if permission not granted
        setUserLocation({
          coords: {
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
        setIsLoadingLocation(false);
      }
    })();
  }, []);
  
  useEffect(() => {
    if (categoryFromParams) {
      setSelectedCategory(categoryFromParams);
    }
    if (searchFromParams) {
      setSearchQuery(searchFromParams);
      setActiveSearchQuery(searchFromParams);
    }
  }, [categoryFromParams, searchFromParams]);
  
  const handleSearch = () => {
    Keyboard.dismiss();
    setActiveSearchQuery(searchQuery.trim());
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };
  
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setIsFilterModalVisible(false);
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
  };
  
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAdvancedFilters({
      priceMin: 0,
      priceMax: 5000,
      propertyType: 'all',
      minMonths: 0,
      minSquareMeters: 0,
      recentOnly: false
    });
    setSelectedCategory(null);
    setSelectedAreaBounds(null);
    setSearchQuery('');
    setActiveSearchQuery('');
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        setRefreshing(false);
        isRefetchingRef.current = false;
      });
    } else {
      setRefreshing(false);
    }
  }, [refetchListings]);
  
  const handleListingPress = (id) => {
    navigation.navigate('ListingDetail', { id });
  };
  
  const hasActiveFilters = () => {
    return (
      selectedCategory !== null ||
      activeSearchQuery !== '' ||
      filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
      filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1] ||
      filters.bedrooms !== DEFAULT_FILTERS.bedrooms ||
      filters.bathrooms !== DEFAULT_FILTERS.bathrooms ||
      filters.amenities.length > 0 ||
      filters.propertyTypes.length > 0 ||
      filters.sortBy !== DEFAULT_FILTERS.sortBy ||
      filters.sortOrder !== DEFAULT_FILTERS.sortOrder ||
      Object.keys(advancedFilters).length > 0 ||
      selectedAreaBounds !== null
    );
  };
  
  const renderCategories = () => {
    if (categoriesLoading) {
      return (
        <View style={[styles.categoriesContainer, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {categories && categories.length > 0 ? categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={[
                  styles.categoryIconContainer,
                  isSelected && styles.selectedCategoryIconContainer
                ]}>
                  <FontAwesome5
                    name={category.icon || 'home'}
                    size={24}
                    color={isSelected ? COLORS.white : COLORS.primary}
                  />
                </View>
                <Text 
                  style={[
                    styles.categoryText, 
                    isSelected && styles.selectedCategoryText
                  ]}
                  numberOfLines={1}
                >
                  {category.name || t(`categories.${category.id}`, category.id)}
                </Text>
              </TouchableOpacity>
            );
          }) : null}
        </ScrollView>
      </View>
    );
  };
  
  const renderContent = () => {
    // Mostra il loader durante il caricamento
    if (loading && !initialLoadComplete) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Caricamento annunci in corso...</Text>
        </View>
      );
    }
    
    // Mostra l'errore se presente
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Oops! Qualcosa è andato storto.</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refetchListings}
          >
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Mostra il messaggio di nessun risultato
    if (listings.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={COLORS.grey} />
          <Text style={styles.emptyTitle}>Nessun annuncio trovato</Text>
          <Text style={styles.emptyMessage}>
            {hasActiveFilters() 
              ? "Nessun annuncio corrisponde ai filtri selezionati. Prova a modificare i filtri."
              : "Non ci sono annunci disponibili al momento."}
          </Text>
          {hasActiveFilters() && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearFiltersButtonText}>Cancella tutti i filtri</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <AnimatedFlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => handleListingPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingMoreText}>Caricamento altri annunci...</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    );
  };
  
  // Handle save from drawing on map
  const handleSaveDrawnArea = (bounds: any) => {
    setSelectedAreaBounds(bounds);
    setShowDrawMap(false);
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };

  // Toggle draw map mode
  const toggleDrawMap = () => {
    if (!locationPermissionGranted) {
      Alert.alert(
        t('location.permissionNeeded', 'Permesso di posizione necessario'),
        t('location.enableDrawZone', 'Per utilizzare la funzione Disegna Zona, consenti l\'accesso alla tua posizione nelle impostazioni.'),
        [{ text: 'OK' }]
      );
      return;
    }
    setShowDrawMap(true);
  };

  // Reset drawn area
  const resetDrawnArea = () => {
    setSelectedAreaBounds(null);
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };

  const handleAdvancedFiltersApply = (newAdvancedFilters: AdvancedFilterOptions) => {
    setAdvancedFilters(newAdvancedFilters);
    setIsAdvancedFilterModalVisible(false);
    
    // Previene refetch multipli
    if (!isRefetchingRef.current) {
      isRefetchingRef.current = true;
      refetchListings().finally(() => {
        isRefetchingRef.current = false;
      });
    }
  };

  // Componente per il pulsante di filtri avanzati 
  const FiltersButton = ({ onPress }) => (
    <TouchableOpacity 
      style={styles.filtersButton} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.filtersButtonInner}>
        <Ionicons name="options" size={20} color="#FFFFFF" />
        <Text style={styles.filtersButtonText}>{t('filters.title')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['right', 'left', 'bottom']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} translucent={true} />
      
      <View style={[styles.searchContainer, { marginTop: insets.top }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder', 'Cerca per zona, indirizzo...')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            Object.keys(advancedFilters).length > 0 && styles.activeActionButton
          ]}
          onPress={() => setIsAdvancedFilterModalVisible(true)}
        >
          <Feather 
            name="sliders" 
            size={18} 
            color={Object.keys(advancedFilters).length > 0 ? COLORS.white : COLORS.primary} 
          />
          <Text style={[
            styles.actionButtonText,
            Object.keys(advancedFilters).length > 0 && styles.activeActionButtonText
          ]}>
            {t('search.filters', 'Filtri')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton,
            selectedCategory && styles.activeActionButton
          ]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Feather 
            name="grid" 
            size={18} 
            color={selectedCategory ? COLORS.white : COLORS.primary} 
          />
          <Text style={[
            styles.actionButtonText,
            selectedCategory && styles.activeActionButtonText
          ]}>
            {t('search.category', 'Categoria')}
          </Text>
        </TouchableOpacity>
        
        {locationPermissionGranted && (
          <TouchableOpacity 
            style={[styles.actionButton, selectedAreaBounds && styles.activeActionButton]}
            onPress={toggleDrawMap}
          >
            <Feather 
              name="map" 
              size={18} 
              color={selectedAreaBounds ? COLORS.white : COLORS.primary} 
            />
            <Text style={[
              styles.actionButtonText, 
              selectedAreaBounds && styles.activeActionButtonText
            ]}>
              {t('search.drawZone', 'Disegna zona')}
            </Text>
          </TouchableOpacity>
        )}
        
        {hasActiveFilters() && (
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearFiltersText}>{t('search.clearAll', 'Pulisci tutto')}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderCategories()}
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Pulsante dei filtri fisso in basso a destra */}
      <FiltersButton 
        onPress={() => setIsAdvancedFilterModalVisible(true)} 
      />

      {/* Modifica qui: utilizzo di Modal diretto invece di componente personalizzato */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('search.selectCategory', 'Seleziona categoria')}</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity 
                style={styles.categoryOption}
                onPress={() => handleCategorySelect('all')}
              >
                <FontAwesome5 name="home" size={22} color={COLORS.primary} />
                <Text style={styles.categoryOptionText}>{t('categories.all', 'Tutte le categorie')}</Text>
              </TouchableOpacity>
              
              {categories && categories.map(category => (
                <TouchableOpacity 
                  key={category.id}
                  style={styles.categoryOption}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <FontAwesome5 name={category.icon || 'home'} size={22} color={COLORS.primary} />
                  <Text style={styles.categoryOptionText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DrawMapZone
        visible={showDrawMap}
        onClose={() => setShowDrawMap(false)}
        onApplyArea={handleSaveDrawnArea}
        userLocation={userLocation}
      />

      <FiltersModal
        visible={isAdvancedFilterModalVisible}
        onClose={() => setIsAdvancedFilterModalVisible(false)}
        onApplyFilters={handleAdvancedFiltersApply}
        initialFilters={advancedFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 8,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    position: 'relative',
  },
  activeActionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 6,
  },
  activeActionButtonText: {
    color: COLORS.white,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listingsContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  listingCard: {
    marginBottom: 15,
    width: '100%',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    zIndex: 9,
  },
  categoriesScrollContent: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  selectedCategoryItem: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategoryIconContainer: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 10,
  },
  clearFiltersText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Stili per il modal delle categorie
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalScrollView: {
    paddingHorizontal: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 10,
    paddingBottom: 80,
  },
  filtersButton: {
    position: 'absolute',
    bottom: 20 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
  filtersButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SearchScreen; 