import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';
import { DEFAULT_LOCATION } from '../constants/locations';

interface DrawMapZoneProps {
  visible: boolean;
  onClose: () => void;
  onApplyArea: (coordinates: any[]) => void;
  initialCoordinates?: any[] | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

const DrawMapZone: React.FC<DrawMapZoneProps> = ({
  visible,
  onClose,
  onApplyArea,
  initialCoordinates,
  userLocation,
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const [coordinates, setCoordinates] = useState<any[]>(initialCoordinates || []);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset coordinates when the component becomes visible
  useEffect(() => {
    if (visible) {
      setCoordinates(initialCoordinates || []);
      setIsDrawing(false);
    }
  }, [visible, initialCoordinates]);

  // Center map on initial position
  useEffect(() => {
    if (visible && mapRef.current) {
      const initialRegion = {
        latitude: userLocation?.latitude || DEFAULT_LOCATION.latitude,
        longitude: userLocation?.longitude || DEFAULT_LOCATION.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      mapRef.current.animateToRegion(initialRegion, 300);
    }
  }, [visible, userLocation]);

  // Handle map click to add points
  const handleMapPress = (e: any) => {
    if (!isDrawing) return;
    
    const { coordinate } = e.nativeEvent;
    setCoordinates([...coordinates, coordinate]);
  };

  // Start drawing mode
  const startDrawing = () => {
    setCoordinates([]);
    setIsDrawing(true);
  };

  // Complete drawing and apply
  const completeDrawing = () => {
    if (coordinates.length < 3) {
      Alert.alert(
        t('drawZone.error', 'Errore'),
        t('drawZone.notEnoughPoints', 'Seleziona almeno 3 punti per definire un\'area')
      );
      return;
    }
    
    // Close the polygon by duplicating the first point
    const closedPolygon = [...coordinates];
    if (coordinates.length > 0 && 
        (coordinates[0].latitude !== coordinates[coordinates.length - 1].latitude ||
         coordinates[0].longitude !== coordinates[coordinates.length - 1].longitude)) {
      closedPolygon.push(coordinates[0]);
    }
    
    setIsDrawing(false);
    onApplyArea(closedPolygon);
  };

  // Reset drawing
  const resetDrawing = () => {
    setCoordinates([]);
    setIsDrawing(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('drawZone.title', 'Disegna zona di ricerca')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            onPress={handleMapPress}
            initialRegion={{
              latitude: userLocation?.latitude || DEFAULT_LOCATION.latitude,
              longitude: userLocation?.longitude || DEFAULT_LOCATION.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                pinColor={COLORS.primary}
              />
            )}

            {/* Drawing points */}
            {coordinates.map((coordinate, index) => (
              <Marker
                key={`marker-${index}`}
                coordinate={coordinate}
                pinColor={COLORS.accent}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.pointMarker}>
                  <Text style={styles.pointText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}

            {/* Polygon */}
            {coordinates.length >= 3 && (
              <Polygon
                coordinates={coordinates}
                strokeWidth={2}
                strokeColor={COLORS.primary}
                fillColor={`${COLORS.primary}40`} // 25% opacity
              />
            )}
          </MapView>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {isDrawing ? (
            <>
              <Text style={styles.instructions}>
                {t('drawZone.instructions', 'Tocca la mappa per aggiungere punti e definire la zona di ricerca')}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={resetDrawing}>
                  <Text style={styles.buttonText}>{t('drawZone.reset', 'Cancella')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={completeDrawing}
                  disabled={coordinates.length < 3}
                >
                  <Text style={styles.primaryButtonText}>{t('drawZone.complete', 'Completa')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.instructions}>
                {coordinates.length > 0 
                  ? t('drawZone.areaSelected', 'Area selezionata con successo')
                  : t('drawZone.startInstructions', 'Premi il pulsante per disegnare una zona di ricerca')}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={onClose}>
                  <Text style={styles.buttonText}>{t('drawZone.cancel', 'Annulla')}</Text>
                </TouchableOpacity>
                {coordinates.length > 0 ? (
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => onApplyArea(coordinates)}
                  >
                    <Text style={styles.primaryButtonText}>{t('drawZone.apply', 'Applica')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={startDrawing}
                  >
                    <MaterialIcons name="edit-location" size={20} color={COLORS.white} />
                    <Text style={styles.primaryButtonText}>{t('drawZone.start', 'Disegna zona')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pointMarker: {
    backgroundColor: COLORS.accent,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pointText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  primaryButtonText: {
    fontWeight: '500',
    color: COLORS.white,
    textAlign: 'center',
    marginLeft: 4,
  },
});

export default DrawMapZone; 