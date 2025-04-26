import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { COLORS } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface CustomMarkerProps {
  latitude?: number;
  longitude?: number;
  coordinate?: LatLng;
  price: number;
  distance?: number; // Distanza dall'utente in km
  onPress: () => void;
  identifier: string;
  isSelected?: boolean;
  scaleAnim?: Animated.Value; // Nuovo prop per l'animazione
  title?: string; // Titolo dell'annuncio
  imageUrl?: string; // URL dell'immagine
  address?: string; // Indirizzo dell'annuncio
  type?: string; // Tipo di alloggio
}

const isValidCoordinate = (coord: any): boolean => {
  if (!coord) return false;
  
  const lat = coord.latitude || coord?.lat;
  const lng = coord.longitude || coord?.lng;
  
  // Verifica che le coordinate siano numeri validi (non NaN, non undefined, non null)
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  
  // Verifica che le coordinate siano nel range valido
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  
  return true;
};

const CustomMarker: React.FC<CustomMarkerProps> = ({
  latitude,
  longitude,
  coordinate,
  price,
  distance,
  onPress,
  identifier,
  isSelected = false,
  scaleAnim,
  title,
  imageUrl,
  address,
  type
}) => {
  // Usa coordinate se disponibile, altrimenti usa latitude e longitude
  const markerCoordinate = coordinate || { latitude, longitude };
  
  // Verifica di sicurezza per le coordinate
  if (!isValidCoordinate(markerCoordinate)) {
    console.warn(`Invalid coordinates for marker with id: ${identifier}`, markerCoordinate);
    return null;
  }
  
  // Usa l'animazione fornita come prop o crea una nuova istanza
  const [localScaleAnim] = useState(new Animated.Value(1));
  const animValue = scaleAnim || localScaleAnim;
  const [showCallout, setShowCallout] = useState(false);
  
  // Animazione al press
  const handlePress = () => {
    // Usa l'animazione locale solo se non è fornita come prop
    if (!scaleAnim) {
      Animated.sequence([
        Animated.timing(localScaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(localScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
    
    onPress();
  };
  
  // Traccia il rendering del marker per debug
  useEffect(() => {
    if (isSelected) {
      console.log(`Rendering selected marker: ${identifier} at position:`, markerCoordinate);
    }
  }, [isSelected, identifier, markerCoordinate]);
  
  return (
    <Marker
      coordinate={markerCoordinate}
      identifier={identifier}
      tracksViewChanges={false}
      onPress={() => {
        console.log(`Marker pressed: ${identifier}`);
        setShowCallout(true);
        handlePress();
      }}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View 
          style={[
            styles.markerContainer,
            {transform: [{scale: animValue}]},
            isSelected && styles.selectedMarkerContainer
          ]}
        >
          <View style={[
            styles.bubble,
            isSelected && styles.selectedBubble
          ]}>
            <Text style={[
              styles.priceText,
              isSelected && styles.selectedPriceText
            ]}>€{price}</Text>
            {distance !== undefined && (
              <View style={[
                styles.distanceBadge,
                isSelected && styles.selectedDistanceBadge
              ]}>
                <MaterialCommunityIcons 
                  name="map-marker-distance" 
                  size={10} 
                  color={isSelected ? COLORS.primary : COLORS.white} 
                />
                <Text style={[
                  styles.distanceText,
                  isSelected && { color: COLORS.primary }
                ]}>{distance}km</Text>
              </View>
            )}
          </View>
          <View style={[
            styles.arrowBorder,
            isSelected && styles.selectedArrowBorder
          ]} />
          <View style={[
            styles.arrow,
            isSelected && styles.selectedArrow
          ]} />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Tooltip/card riassuntiva */}
      <Callout tooltip style={styles.calloutContainer} onPress={handlePress}>
        <View style={styles.callout}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.calloutImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.calloutImagePlaceholder}>
              <MaterialCommunityIcons name="home" size={24} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle} numberOfLines={1}>{title || 'Annuncio'}</Text>
            <Text style={styles.calloutPrice}>€{price}/mese</Text>
            {address && (
              <Text style={styles.calloutAddress} numberOfLines={1}>{address}</Text>
            )}
            {type && (
              <View style={styles.calloutTypeContainer}>
                <MaterialCommunityIcons name="home" size={12} color={COLORS.primary} />
                <Text style={styles.calloutType}>{type}</Text>
              </View>
            )}
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 90,
    height: 60,
    alignItems: 'center',
    zIndex: 1,
  },
  selectedMarkerContainer: {
    zIndex: 2,
    height: 64,
  },
  bubble: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 12,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedBubble: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    transform: [{scale: 1.05}],
  },
  priceText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedPriceText: {
    color: COLORS.white,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  selectedDistanceBadge: {
    backgroundColor: COLORS.white,
  },
  distanceText: {
    color: COLORS.white,
    fontSize: 10,
    marginLeft: 2,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: COLORS.white,
    borderWidth: 8,
    alignSelf: 'center',
    marginTop: -1,
  },
  selectedArrow: {
    borderTopColor: COLORS.primary,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 8,
    alignSelf: 'center',
    marginTop: -0.5,
  },
  selectedArrowBorder: {
    borderTopColor: COLORS.white,
  },
  calloutContainer: {
    // Stile per il contenitore del tooltip
  },
  callout: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.lightGrey,
  },
  calloutContent: {
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calloutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  calloutImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomMarker; 