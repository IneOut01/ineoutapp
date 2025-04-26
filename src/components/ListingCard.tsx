import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { Listing } from '../types/listing';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import useFavorites from '../hooks/useFavorites';
import { COLORS } from '../theme/colors';
import { Routes } from '../navigation/Routes';
import { RootStackParamList } from '../navigation/types';
import { formatPrice } from '../utils/priceUtils';
import { StackNavigationProp } from '@react-navigation/stack';
import { truncateText } from '../utils/textUtils';

const CARD_WIDTH = Dimensions.get('window').width * 0.9;
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=Nessuna+Immagine';
const FALLBACK_IMAGES = [
  'https://via.placeholder.com/400x300?text=Nessuna+Immagine',
  'https://via.placeholder.com/400x300?text=Casa+Placeholder',
  'https://via.placeholder.com/400x300?text=Appartamento+Placeholder'
];

interface ListingCardProps {
  listing: Listing;
  horizontal?: boolean;
  containerStyle?: object;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  horizontal = false,
  containerStyle = {},
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [fallbackImageIndex, setFallbackImageIndex] = useState(0);
  
  const handleFavoritePress = () => {
    toggleFavorite(listing.id);
  };

  const onImageError = () => {
    // Se l'immagine fallisce e abbiamo esaurito i fallback, non facciamo niente
    if (fallbackImageIndex >= FALLBACK_IMAGES.length - 1) {
      setImageError(true);
      setIsImageLoading(false);
      return;
    }
    
    // Altrimenti, proviamo con il prossimo fallback
    setFallbackImageIndex(fallbackImageIndex + 1);
  };

  const getImageSource = () => {
    if (imageError || !listing.imageUrl) {
      // Se tutte le immagini hanno fallito o non c'è URL, usiamo l'ultimo fallback locale
      return FALLBACK_IMAGES[FALLBACK_IMAGES.length - 1];
    }
    
    if (fallbackImageIndex > 0) {
      // Se fallback index > 0, usiamo l'immagine di fallback corrente
      return FALLBACK_IMAGES[fallbackImageIndex];
    }
    
    // Altrimenti usiamo l'URL originale
    return { uri: listing.imageUrl };
  };

  const navigateToDetail = () => {
    navigation.navigate(Routes.LISTING_DETAIL, { listingId: listing.id });
  };

  const cardContainer = horizontal
    ? { ...styles.cardHorizontal, ...containerStyle }
    : { ...styles.card, ...containerStyle };

  // Adattiamo lo stile del contenuto in base all'orientamento
  const contentContainer = horizontal
    ? styles.contentHorizontal
    : styles.content;

  return (
    <TouchableOpacity
      style={cardContainer}
      onPress={navigateToDetail}
      activeOpacity={0.8}
    >
      <View style={horizontal ? styles.imageContainerHorizontal : styles.imageContainer}>
        <View style={styles.imageWrapper}>
          {isImageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
          <Image
            source={getImageSource()}
            style={styles.image}
            onLoadStart={() => setIsImageLoading(true)}
            onLoad={() => setIsImageLoading(false)}
            onError={onImageError}
            resizeMode="cover"
          />
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
        >
          <FontAwesome
            name={isFavorite(listing.id) ? 'heart' : 'heart-o'}
            size={24}
            color={isFavorite(listing.id) ? COLORS.error : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <View style={contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {truncateText(listing.title, 28)}
        </Text>
        <Text style={styles.price}>
          {formatPrice(listing.price)} {listing.rentalPeriod ? `/ ${t(`listing.${listing.rentalPeriod}`)}` : ''}
        </Text>
        <View style={styles.addressContainer}>
          <MaterialIcons name="location-on" size={16} color={COLORS.textSecondary} />
          <Text style={styles.address} numberOfLines={1}>
            {truncateText(listing.address || t('listing.addressNotAvailable'), 30)}
          </Text>
        </View>
        <View style={styles.featuresContainer}>
          {listing.bedrooms !== undefined && (
            <View style={styles.feature}>
              <Ionicons name="bed-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.featureText}>{listing.bedrooms}</Text>
            </View>
          )}
          {listing.bathrooms !== undefined && (
            <View style={styles.feature}>
              <FontAwesome name="bath" size={14} color={COLORS.textSecondary} />
              <Text style={styles.featureText}>{listing.bathrooms}</Text>
            </View>
          )}
          {listing.size !== undefined && (
            <View style={styles.feature}>
              <MaterialIcons name="square-foot" size={16} color={COLORS.textSecondary} />
              <Text style={styles.featureText}>{listing.size} m²</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginVertical: 8,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  cardHorizontal: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginVertical: 8,
    marginHorizontal: 10,
    overflow: 'hidden',
    width: '95%',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  imageContainerHorizontal: {
    width: 120,
    height: '100%',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: COLORS.lightGrey,
  },
  content: {
    padding: 12,
  },
  contentHorizontal: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.text,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    marginTop: 6,
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
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ListingCard; 