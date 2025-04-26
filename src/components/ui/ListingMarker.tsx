import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

interface ListingMarkerProps {
  price: number;
  isSelected?: boolean;
}

const ListingMarker: React.FC<ListingMarkerProps> = ({ price, isSelected = false }) => {
  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      <Text style={styles.priceText}>€{price >= 1000 ? `${Math.floor(price / 1000)}k` : price}</Text>
      <View style={[styles.triangle, isSelected && styles.selectedTriangle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedContainer: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    transform: [{ scale: 1.1 }],
  },
  priceText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  triangle: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
  selectedTriangle: {
    borderTopColor: COLORS.secondary,
  },
});

export default ListingMarker; 