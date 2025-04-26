import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { COLORS } from '../../theme/colors';
import MiniListingCard from '../ui/MiniListingCard';
import ListingMarker from '../ui/ListingMarker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Listing } from '../../types/listing';

interface MapAlternativeProps {
  listings: Listing[];
  isLoading?: boolean;
  onSelectListing?: (listing: Listing) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = 10;

const MapAlternative: React.FC<MapAlternativeProps> = ({
  listings,
  isLoading = false,
  onSelectListing
}) => {
  const insets = useSafeAreaInsets();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Set initial region based on listings or default to Milan
  useEffect(() => {
    if (listings && listings.length > 0) {
      const initialListing = listings[0];
      setMapRegion({
        latitude: initialListing.coordinates.latitude,
        longitude: initialListing.coordinates.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } else {
      // Default to Milan if no listings
      setMapRegion({
        latitude: 45.4642,
        longitude: 9.1900,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [listings]);

  const handleMarkerPress = (listing: Listing, index: number) => {
    setSelectedListing(listing);
    
    // Center map on selected listing
    mapRef.current?.animateToRegion({
      latitude: listing.coordinates.latitude,
      longitude: listing.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 300);
    
    // Scroll flatlist to the selected card
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5
    });
    
    if (onSelectListing) {
      onSelectListing(listing);
    }
  };

  const handleCardPress = (listing: Listing) => {
    setSelectedListing(listing);
    
    // Find the index of the listing
    const index = listings.findIndex(item => item.id === listing.id);
    
    // Center map on selected listing
    mapRef.current?.animateToRegion({
      latitude: listing.coordinates.latitude,
      longitude: listing.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 300);
    
    if (onSelectListing) {
      onSelectListing(listing);
    }
  };

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const centerItem = viewableItems[0].item;
      setSelectedListing(centerItem);
      
      mapRef.current?.animateToRegion({
        latitude: centerItem.coordinates.latitude,
        longitude: centerItem.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 300);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Caricamento mappa...</Text>
      </View>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun annuncio trovato in questa zona</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mapRegion && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {listings.map((listing, index) => (
            <Marker
              key={listing.id}
              coordinate={{
                latitude: listing.coordinates.latitude,
                longitude: listing.coordinates.longitude,
              }}
              onPress={() => handleMarkerPress(listing, index)}
            >
              <ListingMarker 
                price={listing.price}
                isSelected={selectedListing?.id === listing.id}
              />
            </Marker>
          ))}
        </MapView>
      )}

      <View style={[styles.cardsContainer, { bottom: insets.bottom + 10 }]}>
        <FlatList
          ref={flatListRef}
          data={listings}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.cardsList}
          keyExtractor={(item) => item.id.toString()}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <MiniListingCard
              imageUrl={item.photos && item.photos.length > 0 ? item.photos[0] : undefined}
              title={item.title}
              price={item.price}
              address={item.address}
              isSelected={selectedListing?.id === item.id}
              onPress={() => handleCardPress(item)}
            />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  cardsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cardsList: {
    paddingHorizontal: (Dimensions.get('window').width - CARD_WIDTH) / 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.backgroundSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

export default MapAlternative; 