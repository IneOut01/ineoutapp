import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import ListingCard from '../components/ui/ListingCard';
import { useNavigation } from '@react-navigation/native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import EmptyState from '../components/EmptyState';
import AuthRequiredModal from '../components/AuthRequiredModal';

const { width } = Dimensions.get('window');

const FavoritesScreen = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isGuest } = useAuth();
  const { favorites, isLoading, getFavoriteListings } = useFavorites();
  const [favoriteListings, setFavoriteListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const navigation = useNavigation();
  const { modalVisible, authRequiredMessage, canAccess, closeModal } = useAuthGuard();

  // Carica i dettagli degli annunci preferiti
  useEffect(() => {
    const loadListings = async () => {
      if (!isAuthenticated || isGuest) {
        setFavoriteListings([]);
        return;
      }
      
      if (favorites.length === 0) {
        setFavoriteListings([]);
        return;
      }
      
      try {
        setLoadingListings(true);
        const listings = await getFavoriteListings();
        setFavoriteListings(listings);
      } catch (error) {
        console.error('Errore nel caricamento degli annunci preferiti:', error);
      } finally {
        setLoadingListings(false);
      }
    };
    
    loadListings();
  }, [favorites, isAuthenticated, isGuest, getFavoriteListings]);

  // Handle per il click su un annuncio
  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail' as never, { id } as never);
  };

  // Handle per navigare alla schermata di login
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  // Verifica accesso e mostra messaggio modalità ospite
  const checkAccess = () => {
    return canAccess('Per salvare gli annunci tra i preferiti devi accedere o registrarti.');
  };

  // Rendering di un elemento della lista
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <ListingCard
        id={item.id}
        title={item.title}
        price={item.price}
        imageUrl={item.images?.[0] || 'https://via.placeholder.com/400x300/cccccc/666666?text=No+Image'}
        address={`${item.city || ''}`}
        type={item.type}
        size={item.m2}
        minStay={item.months}
        onPress={() => handleListingPress(item.id)}
        onToggleFavorite={checkAccess}
        isFavorite={true}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? getStatusBarHeight() : 0 }]}>
        <Text style={styles.title}>I miei preferiti</Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {isLoading || loadingListings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Caricamento preferiti...</Text>
          </View>
        ) : (!isAuthenticated || isGuest) ? (
          <View style={styles.notLoggedInContainer}>
            <MaterialCommunityIcons 
              name={isGuest ? "account-question" : "account-lock"} 
              size={80} 
              color={COLORS.primary} 
            />
            <Text style={styles.notLoggedInText}>
              {isGuest 
                ? 'In modalità ospite non è possibile salvare annunci preferiti.'
                : 'Accedi per visualizzare i tuoi annunci preferiti'
              }
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
              <Text style={styles.loginButtonText}>Accedi</Text>
            </TouchableOpacity>
          </View>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="Non c'è ancora nulla"
            message="Cerca tra gli annunci e trova i tuoi preferiti!"
          />
        ) : (
          <FlatList
            data={favoriteListings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={width > 768 ? 2 : 1}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modale per avviso autenticazione richiesta */}
      <AuthRequiredModal 
        visible={modalVisible} 
        onClose={closeModal}
        message={authRequiredMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notLoggedInText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
});

export default FavoritesScreen; 