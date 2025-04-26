import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import MiniListingCard from './MiniListingCard';
import ListingMarker from './ListingMarker';
import { COLORS } from '../../theme/colors';
import { Listing } from '../../types/Listing';

interface MapAlternativeProps {
  listings: Listing[];
  isLoading?: boolean;
  onMarkerPress?: (id: string) => void;
  onCardPress?: (id: string) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_SPACING = 12;

const MapAlternative: React.FC<MapAlternativeProps> = ({
  listings = [],
  isLoading = false,
  onMarkerPress,
  onCardPress,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const initialRegion: Region = {
    latitude: listings.length > 0 ? listings[0].latitude : 41.9028,
    longitude: listings.length > 0 ? listings[0].longitude : 12.4964,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    if (selectedId && listings.length > 0) {
      const index = listings.findIndex(listing => listing.id === selectedId);
      if (index !== -1) {
        scrollViewRef.current?.scrollTo({
          x: index * (CARD_WIDTH + CARD_SPACING),
          animated: true,
        });
        
        const selected = listings[index];
        mapRef.current?.animateToRegion({
          latitude: selected.latitude,
          longitude: selected.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }
  }, [selectedId]);

  const handleMarkerPress = (id: string) => {
    setSelectedId(id);
    if (onMarkerPress) {
      onMarkerPress(id);
    }
  };

  const handleCardPress = (id: string) => {
    setSelectedId(id);
    if (onCardPress) {
      onCardPress(id);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun annuncio trovato in questa zona</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.latitude,
              longitude: listing.longitude,
            }}
            onPress={() => handleMarkerPress(listing.id)}
          >
            <ListingMarker 
              price={listing.price} 
              isSelected={selectedId === listing.id}
            />
          </Marker>
        ))}
      </MapView>

      <View style={styles.cardsContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.scrollViewContent}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
            if (index >= 0 && index < listings.length) {
              setSelectedId(listings[index].id);
            }
          }}
        >
          {listings.map((listing) => (
            <View 
              key={listing.id} 
              style={[
                styles.cardWrapper,
                { width: CARD_WIDTH }
              ]}
            >
              <MiniListingCard
                imageUrl={listing.images?.[0] || ''}
                title={listing.title}
                price={listing.price}
                address={listing.address}
                isSelected={selectedId === listing.id}
                onPress={() => handleCardPress(listing.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 120,
  },
  scrollViewContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    marginHorizontal: CARD_SPACING / 2,
    height: 120,
  },
});

export default MapAlternative; 