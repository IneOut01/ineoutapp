import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import MiniListingCard from './ui/MiniListingCard';
import ListingMarker from './ui/ListingMarker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface MapAlternativeProps {
  listings: any[];
  isLoadingListings: boolean;
  onMarkerPress?: (listing: any) => void;
}

/**
 * Componente alternativo da utilizzare quando la mappa Google ha problemi
 * Visualizza una lista semplice dei luoghi su uno sfondo grigio
 */
const MapAlternative: React.FC<MapAlternativeProps> = ({
  listings = [],
  isLoadingListings = false,
  onMarkerPress,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  
  // Simuliamo il caricamento della mappa
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filtra solo annunci con coordinate valide
  const validListings = listings.filter(
    listing => 
      listing && 
      listing.latitude && 
      listing.longitude && 
      !isNaN(listing.latitude) && 
      !isNaN(listing.longitude)
  );
  
  // Calcola coordinate centrali per la visualizzazione dei marker
  const calculateMapCenter = () => {
    if (validListings.length === 0) return { lat: 41.9028, lng: 12.4964 }; // Default Roma
    
    // Calcola il centro di tutti i marker
    const sum = validListings.reduce(
      (acc, listing) => ({
        lat: acc.lat + listing.latitude,
        lng: acc.lng + listing.longitude
      }),
      { lat: 0, lng: 0 }
    );
    
    return {
      lat: sum.lat / validListings.length,
      lng: sum.lng / validListings.length
    };
  };
  
  const mapCenter = calculateMapCenter();
  
  // Calcola i bounds della mappa per adattare la visualizzazione
  const calculateMapBounds = () => {
    if (validListings.length === 0) {
      // Default bounds per Roma
      return {
        minLat: 41.7, maxLat: 42.1,
        minLng: 12.3, maxLng: 12.8
      };
    }
    
    let minLat = validListings[0].latitude;
    let maxLat = validListings[0].latitude;
    let minLng = validListings[0].longitude;
    let maxLng = validListings[0].longitude;
    
    validListings.forEach(listing => {
      minLat = Math.min(minLat, listing.latitude);
      maxLat = Math.max(maxLat, listing.latitude);
      minLng = Math.min(minLng, listing.longitude);
      maxLng = Math.max(maxLng, listing.longitude);
    });
    
    // Aggiungi un po' di padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;
    
    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    };
  };
  
  const mapBounds = calculateMapBounds();
  
  const handleMarkerPress = (index: number) => {
    setSelectedMarkerIndex(index);
    // Scroll to the selected item in the list
    if (listRef.current && index !== null) {
      listRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
    if (onMarkerPress && validListings[index]) {
      onMarkerPress(validListings[index]);
    }
  };
  
  const handleNavigateToListing = (listing: any) => {
    navigation.navigate('ListingDetail' as never, { id: listing.id } as never);
  };

  const handleCardPress = (index: number) => {
    setSelectedMarkerIndex(index);
    if (onMarkerPress && validListings[index]) {
      onMarkerPress(validListings[index]);
    }
  };
  
  // Calcola la posizione relativa di un marker sulla mappa
  const calculateMarkerPosition = (latitude: number, longitude: number) => {
    // Normalizza le coordinate nell'intervallo [0,1]
    const normalizedLat = (latitude - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat);
    const normalizedLng = (longitude - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng);
    
    // Inverti la latitudine (0 in alto, 1 in basso)
    const invertedLat = 1 - normalizedLat;
    
    // Converti in percentuali per il posizionamento
    const top = invertedLat * 100;
    const left = normalizedLng * 100;
    
    // Limita i valori all'interno della mappa con più spazio ai bordi
    const clampedTop = Math.min(Math.max(top, 8), 92);
    const clampedLeft = Math.min(Math.max(left, 8), 92);
    
    return { top: clampedTop, left: clampedLeft };
  };
  
  if (isLoadingListings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('search.loadingListings')}</Text>
      </View>
    );
  }
  
  if (validListings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color={COLORS.error} />
        <Text style={styles.emptyText}>
          {t('map.noListingsInArea')}
        </Text>
        <Text style={styles.emptySubText}>
          {t('map.tryExpandingSearch')}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[
        styles.miniCardContainer,
        selectedMarkerIndex === index && styles.selectedMiniCardContainer
      ]}
      onPress={() => handleCardPress(index)}
      activeOpacity={0.7}
    >
      <MiniListingCard
        imageUrl={item.images?.[0] || ''}
        title={item.title}
        price={item.price}
        address={item.address}
        isSelected={selectedMarkerIndex === index}
        onPress={() => handleNavigateToListing(item)}
      />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {isMapLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('map.loadingMap')}</Text>
        </View>
      ) : (
        <>
          {/* Mappa visiva alternativa */}
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['#E6F7FF', '#B3E0FF', '#80C9FF']}
              style={styles.mapBackground}
            />
            
            {/* Punti cardinali */}
            <View style={[styles.compassMarker, styles.northMarker]}>
              <Text style={styles.compassText}>N</Text>
            </View>
            <View style={[styles.compassMarker, styles.eastMarker]}>
              <Text style={styles.compassText}>E</Text>
            </View>
            <View style={[styles.compassMarker, styles.southMarker]}>
              <Text style={styles.compassText}>S</Text>
            </View>
            <View style={[styles.compassMarker, styles.westMarker]}>
              <Text style={styles.compassText}>O</Text>
            </View>
            
            {/* Indicatore posizione */}
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationRing} />
            </View>
            
            {/* Marker degli annunci - usiamo una griglia distanziata */}
            {validListings.map((listing, index) => {
              const { top, left } = calculateMarkerPosition(listing.latitude, listing.longitude);
              const isSelected = selectedMarkerIndex === index;
              
              return (
                <TouchableOpacity
                  key={listing.id}
                  style={[
                    styles.marker,
                    {
                      top: `${top}%`,
                      left: `${left}%`,
                      zIndex: isSelected ? 2 : 1
                    },
                    isSelected && styles.selectedMarkerContainer
                  ]}
                  onPress={() => handleMarkerPress(index)}
                  activeOpacity={0.8}
                >
                  <ListingMarker 
                    price={listing.price} 
                    isSelected={isSelected} 
                  />
                </TouchableOpacity>
              );
            })}
            
            {/* Watermark/Overlay */}
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>{t('map.fallbackMessage')}</Text>
            </View>
          </View>
          
          {/* Lista orizzontale degli annunci */}
          <View style={styles.listingsCarouselContainer}>
            <FlatList
              ref={listRef}
              data={validListings}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listingsCarouselContent}
              style={styles.listingsCarousel}
              initialNumToRender={4}
              maxToRenderPerBatch={8}
              windowSize={5}
              onScrollToIndexFailed={(info) => {
                console.warn('Scroll to index fallito:', info);
                setTimeout(() => {
                  if (listRef.current && info.index < validListings.length) {
                    listRef.current.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5
                    });
                  }
                }, 500);
              }}
            />
          </View>
          
          {/* Informazioni */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {t('map.tapToView')}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.cardBg,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    height: '70%',
    borderRadius: 12,
    margin: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  compassMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  northMarker: {
    top: 10,
    left: '50%',
    marginLeft: -14,
  },
  eastMarker: {
    top: '50%',
    right: 10,
    marginTop: -14,
  },
  southMarker: {
    bottom: 10,
    left: '50%',
    marginLeft: -14,
  },
  westMarker: {
    top: '50%',
    left: 10,
    marginTop: -14,
  },
  compassText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  currentLocationMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    zIndex: 2,
  },
  currentLocationDot: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  currentLocationRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.5,
  },
  marker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{translateX: -20}, {translateY: -20}],
  },
  selectedMarkerContainer: {
    transform: [{translateX: -22}, {translateY: -22}, {scale: 1.1}],
  },
  watermark: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  watermarkText: {
    color: COLORS.white,
    fontSize: 10,
  },
  listingsCarouselContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  listingsCarousel: {
    maxHeight: 130,
  },
  listingsCarouselContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  miniCardContainer: {
    marginHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedMiniCardContainer: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MapAlternative; 