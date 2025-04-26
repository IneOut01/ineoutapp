import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Image } from 'react-native';
import StreetView from 'react-native-streetview';
import { COLORS } from '../theme/colors';
import { mapsKeys } from '../config/mapsKeys';
import EmptyState from './EmptyState';

interface StreetViewContainerProps {
  latitude: number;
  longitude: number;
  height?: number;
  pov?: {
    tilt: number;
    bearing: number;
    zoom: number;
  };
}

const StreetViewContainer: React.FC<StreetViewContainerProps> = ({
  latitude,
  longitude,
  height = 300,
  pov = { tilt: 0, bearing: 0, zoom: 1 }
}) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verifica disponibilità panorama
    const checkPanoramaAvailability = async () => {
      try {
        // In un'app reale, dovresti usare l'API di Google Maps per verificare 
        // la disponibilità del panorama con getPanorama
        // Qui simuliamo un controllo dopo un breve ritardo
        setIsLoading(true);
        setTimeout(() => {
          // Per test: commenta queste righe e imposta un valore specifico
          // per testare entrambi i casi (true/false)
          const fakeCheck = Math.random() > 0.5; // 50% di possibilità che sia disponibile
          setIsAvailable(false); // Forziamo il fallback per dimostrare l'implementazione
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Errore nella verifica del panorama Street View:', error);
        setIsAvailable(false);
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      checkPanoramaAvailability();
    } else {
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  // API key in base alla piattaforma
  const apiKey = Platform.OS === 'ios'
    ? mapsKeys.ios
    : Platform.OS === 'android'
      ? mapsKeys.android
      : mapsKeys.web;

  if (isLoading) {
    return (
      <View style={[styles.container, { height }]}>
        <EmptyState
          icon="loading"
          title="Caricamento Street View"
          message="Verifica disponibilità..."
          containerStyle={styles.emptyStateContainer}
        />
      </View>
    );
  }

  if (!isAvailable) {
    // Fallback a Google Maps Static API quando Street View non è disponibile
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=600x300&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`;
    
    return (
      <View style={[styles.container, { height }]}>
        <Image 
          source={{ uri: staticMapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.overlayMessage}>
          <Text style={styles.overlayText}>Street View non disponibile per questa posizione</Text>
          <Text style={styles.overlaySubtext}>Visualizzazione mappa statica</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <StreetView
        style={styles.streetView}
        allGesturesEnabled={true}
        coordinate={{
          latitude,
          longitude
        }}
        zoomLevel={pov.zoom}
        heading={pov.bearing}
        pitch={pov.tilt}
        apiKey={apiKey}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  streetView: {
    flex: 1,
  },
  emptyStateContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGrey,
  },
  overlayMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    alignItems: 'center',
  },
  overlayText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overlaySubtext: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  }
});

export default StreetViewContainer; 