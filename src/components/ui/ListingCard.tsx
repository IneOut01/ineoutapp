import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/LanguageContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import FavoritesButton from './FavoritesButton';
import { formatPrice } from '../../utils/formatPrice';
import { truncateText } from '../../utils/textUtils';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  address: string;
  type?: 'stanza' | 'bilocale' | 'monolocale' | 'studio';
  size?: number;
  minStay?: number;
  distance?: number; // Distanza dalla posizione dell'utente in km
  onPress: () => void;
  isSelected?: boolean; // Proprietà per indicare se la card è selezionata
  horizontal?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  imageUrl,
  address,
  type,
  size,
  minStay,
  distance,
  onPress,
  isSelected = false,
  horizontal = false
}) => {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);
  const navigation = useNavigation();
  
  // Mappa per le icone in base al tipo di alloggio
  const typeIcons = {
    'stanza': 'door',
    'bilocale': 'home-floor-2',
    'monolocale': 'home-floor-1',
    'studio': 'home-floor-0'
  };
  
  // Testo per tipo di alloggio
  const getTypeText = (type: string) => {
    switch(type) {
      case 'stanza': return t('listings.roomType', 'Stanza');
      case 'bilocale': return t('listings.twoRoomType', 'Bilocale');
      case 'monolocale': return t('listings.oneRoomType', 'Monolocale');
      case 'studio': return t('listings.studioType', 'Studio');
      default: return '';
    }
  };

  // Gestisci il click sull'icona preferiti
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(id);
  };
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('ListingDetailScreen', { listingId: id });
    }
  };

  const cardWidth = horizontal ? (Dimensions.get('window').width * 0.85) : '100%';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { width: cardWidth, maxWidth: horizontal ? (Dimensions.get('window').width * 0.85) : '100%' },
        isSelected && styles.selectedContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/400x300/e0f7f5/333333?text=In%26Out' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.priceContainer}>
          <Text style={styles.price}>€{formatPrice(price || 0)}</Text>
        </View>
        <View style={styles.favoriteButton}>
          <FavoritesButton listingId={id} size={24} />
        </View>
      </View>
      
      {type && (
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{getTypeText(type)}</Text>
        </View>
      )}
      
      {/* Distanza, se disponibile */}
      {distance !== undefined && (
        <View style={[
          styles.distanceContainer,
          isSelected && styles.selectedDistanceContainer
        ]}>
          <MaterialCommunityIcons name="map-marker-distance" size={12} color={COLORS.white} />
          <Text style={styles.distanceText}>{distance} km</Text>
        </View>
      )}
      
      <View style={styles.detailsContainer}>
        <Text style={[
          styles.title,
          isSelected && styles.selectedTitle
        ]} numberOfLines={1}>{truncateText(title, 30)}</Text>
        
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color={COLORS.primary} />
          <Text style={styles.location} numberOfLines={1}>{address}, {address.split(', ')[1]}</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          {type && (
            <View style={styles.feature}>
              <MaterialCommunityIcons 
                name={typeIcons[type] || 'home'} 
                size={16} 
                color={COLORS.textSecondary} 
              />
              <Text style={styles.featureText}>{getTypeText(type)}</Text>
            </View>
          )}
          
          {size && (
            <View style={styles.feature}>
              <MaterialIcons name="square-foot" size={16} color={COLORS.textSecondary} />
              <Text style={styles.featureText}>{size} m²</Text>
            </View>
          )}
          
          {minStay && (
            <View style={styles.feature}>
              <MaterialIcons name="calendar-month" size={16} color={COLORS.textSecondary} />
              <Text style={styles.featureText}>
                {minStay} {minStay === 1 ? t('listings.month', 'mese') : t('listings.months', 'mesi')}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Indicatore di selezione */}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  priceContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  price: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tagContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  distanceContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedTitle: {
    color: COLORS.primary,
  },
  selectedPrice: {
    color: COLORS.primaryDark,
  },
  selectedDistanceContainer: {
    backgroundColor: COLORS.primaryDark,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
});

export default ListingCard; 