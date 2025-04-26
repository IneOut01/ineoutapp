import React, { useCallback, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { PlacePrediction } from '../types/placePrediction';
import { PlaceStorage } from '../services/PlaceStorage';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

type PlacePredictionsListProps = {
  predictions: PlacePrediction[];
  loading: boolean;
  onSelectPlace: (place: PlacePrediction) => void;
  showHistory?: boolean;
  showFavorites?: boolean;
  emptyMessage?: string;
};

export const PlacePredictionsList = ({
  predictions,
  loading,
  onSelectPlace,
  showHistory = true,
  showFavorites = true,
  emptyMessage = 'Nessun risultato trovato'
}: PlacePredictionsListProps) => {
  const [favorites, setFavorites] = useState<PlacePrediction[]>([]);
  const [history, setHistory] = useState<PlacePrediction[]>([]);
  const [displayItems, setDisplayItems] = useState<PlacePrediction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadStoredData = useCallback(async () => {
    setIsLoadingData(true);
    if (showFavorites) {
      const storedFavorites = await PlaceStorage.getFavorites();
      setFavorites(storedFavorites);
    }
    
    if (showHistory) {
      const storedHistory = await PlaceStorage.getHistory();
      setHistory(storedHistory);
    }
    
    setIsLoadingData(false);
  }, [showFavorites, showHistory]);

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  useEffect(() => {
    // Only show history and favorites when no search is active
    if (predictions.length === 0 && !loading) {
      const combinedItems: PlacePrediction[] = [];
      
      // Add favorites with source tag
      if (showFavorites && favorites.length > 0) {
        combinedItems.push(...favorites);
      }
      
      // Add history with source tag (if not already in favorites)
      if (showHistory && history.length > 0) {
        const historyItems = history.filter(
          historyItem => !favorites.some(fav => fav.placeId === historyItem.placeId)
        );
        combinedItems.push(...historyItems);
      }
      
      // Sort by lastUsed
      combinedItems.sort((a, b) => {
        const aTime = a.lastUsed || 0;
        const bTime = b.lastUsed || 0;
        return bTime - aTime;
      });
      
      setDisplayItems(combinedItems);
    } else {
      // When searching, display the predictions
      setDisplayItems(predictions);
    }
  }, [predictions, loading, favorites, history, showFavorites, showHistory]);

  const handleSelectPlace = async (place: PlacePrediction) => {
    // Add to history
    await PlaceStorage.addToHistory(place);
    
    // Save as last used
    await PlaceStorage.saveLastUsedPlace(place);
    
    // Call the parent handler
    onSelectPlace(place);
  };

  const toggleFavorite = async (place: PlacePrediction) => {
    const newIsFavorite = await PlaceStorage.toggleFavorite(place);
    
    // Update local state to reflect changes immediately
    if (newIsFavorite) {
      setFavorites(prev => [...prev, { ...place, isFavorite: true, source: 'favorites', lastUsed: Date.now() }]);
    } else {
      setFavorites(prev => prev.filter(item => item.placeId !== place.placeId));
    }
  };

  const renderSourceIcon = (source?: string) => {
    if (source === 'favorites') {
      return <Ionicons name="star" size={16} color={COLORS.primary} />;
    } else if (source === 'history') {
      return <Ionicons name="time-outline" size={16} color={COLORS.grey} />;
    } else if (source === 'google') {
      return <Image source={require('../assets/images/google_logo.png')} style={styles.googleIcon} />;
    }
    
    return null;
  };

  const renderItem = ({ item }: { item: PlacePrediction }) => {
    const isFavorite = favorites.some(fav => fav.placeId === item.placeId);
    
    return (
      <TouchableOpacity
        style={styles.predictionItem}
        onPress={() => handleSelectPlace(item)}
        activeOpacity={0.7}
      >
        <View style={styles.infoContainer}>
          <View style={styles.iconContainer}>
            {renderSourceIcon(item.source)}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.mainText} numberOfLines={1}>
              {item.structuredFormatting?.mainText || item.description}
            </Text>
            {item.structuredFormatting?.secondaryText && (
              <Text style={styles.secondaryText} numberOfLines={1}>
                {item.structuredFormatting.secondaryText}
              </Text>
            )}
          </View>
        </View>
        
        {showFavorites && (
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={22} 
              color={isFavorite ? COLORS.primary : COLORS.darkGrey} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (displayItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="location-outline" size={40} color={COLORS.grey} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displayItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.placeId}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    width: '100%',
    backgroundColor: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    justifyContent: 'space-between',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  secondaryText: {
    fontSize: 14,
    color: COLORS.darkGrey,
    marginTop: 4,
  },
  favoriteButton: {
    padding: 8,
  },
  googleIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.darkGrey,
    fontSize: 16,
    textAlign: 'center',
  },
}); 