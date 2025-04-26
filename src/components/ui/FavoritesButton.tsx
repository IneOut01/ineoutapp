import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface FavoritesButtonProps {
  listingId: string;
  size?: number;
  onPress?: () => void;
}

const FavoritesButton: React.FC<FavoritesButtonProps> = ({ 
  listingId, 
  size = 24,
  onPress 
}) => {
  // Mock dell'hook useFavorites, da implementare con l'hook reale
  const isFavorite = (id: string) => {
    // Qui dovrebbe utilizzare l'hook useFavorites per verificare se l'annuncio è tra i preferiti
    return false;
  };

  const toggleFavorite = () => {
    // Logica per aggiungere/rimuovere dai preferiti
    if (onPress) {
      onPress();
    }
  };

  const isFav = isFavorite(listingId);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleFavorite}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={isFav ? "heart" : "heart-outline"}
        size={size}
        color={isFav ? COLORS.secondary : COLORS.textSecondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesButton; 