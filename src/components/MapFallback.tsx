import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Listing } from '../types/listing';
import ListingCard from './ui/ListingCard';

interface MapFallbackProps {
  latitude: number;
  longitude: number;
  zoomLevel?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onGetDirections?: () => void;
  listings?: Listing[];
  onMarkerPress?: (listing: Listing) => void;
  selectedId?: string;
  width?: string | number;
  height?: string | number;
}

const MapFallback: React.FC<MapFallbackProps> = ({
  latitude,
  longitude,
  zoomLevel = 15,
  errorMessage = "Impossibile caricare la mappa",
  onRetry,
  onGetDirections,
  listings = [],
  onMarkerPress,
  selectedId,
  width = "100%",
  height = "100%"
}) => {
  // Function to open location in external map app
  const openInExternalMap = () => {
    if (onGetDirections) {
      onGetDirections();
      return;
    }

    // Default implementation if no onGetDirections provided
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to browser if maps app not available
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      }
    }).catch(err => console.error('Error opening directions:', err));
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <MaterialIcons name="map" size={64} color={COLORS.grey} />
      <Text style={styles.errorText}>{errorMessage}</Text>
      <Text style={styles.coordsText}>
        Posizione: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
      
      {/* Show listings in list format if available */}
      {listings && listings.length > 0 && (
        <View style={styles.listingsContainer}>
          <Text style={styles.listingsTitle}>Annunci disponibili in questa zona:</Text>
          <ScrollView style={styles.listingsScroll}>
            {listings.map(listing => (
              <TouchableOpacity 
                key={listing.id}
                onPress={() => onMarkerPress && onMarkerPress(listing)}
                style={[
                  styles.listingItem,
                  selectedId === listing.id && styles.selectedListingItem
                ]}
              >
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {listing.title || 'Annuncio senza titolo'}
                </Text>
                <Text style={styles.listingPrice}>
                  {listing.price}€
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <MaterialIcons name="refresh" size={18} color={COLORS.white} />
            <Text style={styles.buttonText}>Riprova</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.directionsButton} onPress={openInExternalMap}>
          <Ionicons name="navigate" size={18} color={COLORS.white} />
          <Text style={styles.buttonText}>Apri in Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  coordsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  directionsButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  listingsContainer: {
    width: '100%',
    marginTop: 20,
    maxHeight: 200,
  },
  listingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  listingsScroll: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
  },
  listingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedListingItem: {
    backgroundColor: COLORS.primaryLight,
  },
  listingTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  }
});

export default MapFallback; 