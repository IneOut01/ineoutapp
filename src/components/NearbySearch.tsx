import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import Slider from '@react-native-community/slider';
import { useLocation, LocationData } from '../hooks/useLocation';
import { useTranslation } from '../contexts/LanguageContext';

interface NearbySearchProps {
  onLocationChange: (location: LocationData | null) => void;
  onRadiusChange: (radius: number) => void;
  onToggleNearbySearch: (enabled: boolean) => void;
}

const NearbySearch: React.FC<NearbySearchProps> = ({
  onLocationChange,
  onRadiusChange,
  onToggleNearbySearch
}) => {
  const { t } = useTranslation();
  const { 
    location,
    loading,
    error,
    requestLocationPermission,
  } = useLocation();

  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [radius, setRadius] = useState<number>(5); // Raggio di ricerca predefinito: 5km

  // Quando la posizione cambia, notifica il componente padre
  useEffect(() => {
    if (isEnabled) {
      onLocationChange(location);
    } else {
      onLocationChange(null);
    }
  }, [location, isEnabled, onLocationChange]);

  // Gestisce il cambio di raggio
  const handleRadiusChange = (value: number) => {
    setRadius(value);
    onRadiusChange(value);
  };

  // Gestisce l'attivazione/disattivazione della ricerca nelle vicinanze
  const toggleNearbySearch = async () => {
    if (!isEnabled) {
      // Se stiamo attivando la ricerca, richiedi i permessi di localizzazione
      const permissionGranted = await requestLocationPermission();
      if (permissionGranted) {
        setIsEnabled(true);
        onToggleNearbySearch(true);
      }
    } else {
      // Disattiva la ricerca
      setIsEnabled(false);
      onToggleNearbySearch(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.nearbyButton,
          isEnabled && styles.nearbyButtonActive
        ]}
        onPress={toggleNearbySearch}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={22}
              color={COLORS.white}
            />
            <Text style={styles.nearbyButtonText}>
              {isEnabled 
                ? t('search.nearbyActive', 'Nelle vicinanze') 
                : t('search.nearby', 'Cerca vicino a me')}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {isEnabled && (
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>
            {t('search.radius', 'Raggio')}: {radius} km
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={radius}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.gray}
            thumbTintColor={COLORS.primary}
            onValueChange={handleRadiusChange}
          />
          <View style={styles.radiusValues}>
            <Text style={styles.radiusValueText}>1 km</Text>
            <Text style={styles.radiusValueText}>50 km</Text>
          </View>
        </View>
      )}

      {error && isEnabled && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nearbyButtonActive: {
    backgroundColor: COLORS.primary,
  },
  nearbyButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: '500',
  },
  radiusContainer: {
    marginTop: 16,
  },
  radiusLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusValueText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.error,
    marginTop: 8,
    fontSize: 12,
  }
});

export default NearbySearch; 