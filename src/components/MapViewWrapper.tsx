import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { getGoogleKey, logGoogleKeyStatus } from '../lib/getGoogleKey';
import { getStatusBarHeight } from 'react-native-status-bar-height';

interface MapViewWrapperProps {
  initialRegion: Region;
  children?: React.ReactNode;
  style?: object;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  mapPadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const MapViewWrapper: React.FC<MapViewWrapperProps> = ({
  initialRegion,
  children,
  style,
  onRegionChangeComplete,
  showsUserLocation = false,
  mapPadding,
}) => {
  const [googleMapsAvailable, setGoogleMapsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Check if Google Maps API key is available
  useEffect(() => {
    try {
      const hasGoogleKey = logGoogleKeyStatus();
      setGoogleMapsAvailable(hasGoogleKey);
    } catch (error) {
      console.error('Error checking Google Maps availability:', error);
      setGoogleMapsAvailable(false);
      setErrorMessage((error as Error).message);
    }
  }, []);

  // Se il componente viene smontato, ripulisci il ref
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        // Pulizia del riferimento (se necessario)
      }
    };
  }, []);
  
  const handleMapReady = () => {
    setIsMapReady(true);
  };

  // If still checking, render a blank view
  if (googleMapsAvailable === null) {
    return <View style={[styles.container, style]} />;
  }

  // If Google Maps is available, use it
  if (googleMapsAvailable) {
    return (
      <View style={[styles.container, style]}>
        {isMapReady || Platform.OS === 'ios' ? (
          <MapView
            ref={mapRef}
            style={styles.container}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={showsUserLocation}
            mapPadding={mapPadding}
            onMapReady={handleMapReady}
          >
            {isMapReady && children}
          </MapView>
        ) : (
          <View style={styles.container} />
        )}
      </View>
    );
  }

  // Fallback to OpenStreetMap via WebView
  const { latitude, longitude, latitudeDelta, longitudeDelta } = initialRegion;
  const zoom = Math.log2(360 / longitudeDelta) - 2.5; // Approximate conversion from delta to zoom level
  
  const osmHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Add a marker for the center position
          const marker = L.marker([${latitude}, ${longitude}]).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: osmHtml }}
        style={styles.container}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapViewWrapper; 