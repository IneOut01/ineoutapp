import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface MiniListingCardProps {
  imageUrl?: string;
  title: string;
  price: number;
  address: string;
  isSelected?: boolean;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

const MiniListingCard: React.FC<MiniListingCardProps> = ({
  imageUrl,
  title,
  price,
  address,
  isSelected = false,
  onPress
}) => {
  // Utilizziamo un placeholder migliore per le immagini mancanti
  const placeholderImage = { uri: 'https://via.placeholder.com/300x200/e0f7f5/333333?text=In%26Out' };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={imageUrl ? { uri: imageUrl } : placeholderImage}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.priceText}>€ {price.toLocaleString()}</Text>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  imageWrapper: {
    width: 120,
    height: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  image: {
    width: 120,
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
});

export default MiniListingCard; 