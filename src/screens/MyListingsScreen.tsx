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
  Platform,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import ListingCard from '../components/ui/ListingCard';
import { useNavigation } from '@react-navigation/native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import EmptyState from '../components/EmptyState';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { collection, query, where, getDocs, orderBy, Query, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Listing } from '../types/listing';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');

const MyListingsScreen = () => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { modalVisible, authRequiredMessage, canAccess, closeModal } = useAuthGuard();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusBarHeight = getStatusBarHeight();

  // Carica gli annunci dell'utente
  useEffect(() => {
    const loadUserListings = async () => {
      if (!isAuthenticated || isGuest) {
        setMyListings([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const listingsRef = collection(db, 'listings');
        
        // Cerchiamo annunci che abbiano o ownerUid o userId uguali all'uid dell'utente
        // Non possiamo usare OR in una singola query, quindi facciamo due query separate
        const ownerQuery = query(
          listingsRef,
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const userIdQuery = query(
          listingsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        // Esegui entrambe le query
        const [ownerSnapshot, userIdSnapshot] = await Promise.all([
          getDocs(ownerQuery),
          getDocs(userIdQuery)
        ]);
        
        // Unisci i risultati, evitando duplicati usando una Map con l'id come chiave
        const resultsMap = new Map<string, Listing>();
        
        // Aggiungi risultati dalla query ownerUid
        ownerSnapshot.forEach((doc) => {
          const data = doc.data();
          resultsMap.set(doc.id, { id: doc.id, ...data } as Listing);
        });
        
        // Aggiungi risultati dalla query userId (sovrascrivendo eventuali duplicati)
        userIdSnapshot.forEach((doc) => {
          const data = doc.data();
          resultsMap.set(doc.id, { id: doc.id, ...data } as Listing);
        });
        
        // Converti la Map in array
        const fetchedListings = Array.from(resultsMap.values());
        
        // Ordina per data di creazione (decrescente)
        fetchedListings.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setMyListings(fetchedListings);
      } catch (error) {
        console.error('Errore nel caricamento degli annunci dell\'utente:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserListings();
  }, [isAuthenticated, isGuest, user]);

  // Handle per il click su un annuncio
  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail' as never, { id } as never);
  };

  // Handle per navigare alla schermata di login
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  // Verifica accesso
  const checkAccess = () => {
    return canAccess('Per vedere i tuoi annunci devi accedere o registrarti.');
  };

  // Rendering di un elemento della lista
  const renderItem = ({ item }: { item: Listing }) => (
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
      />
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="clipboard-outline"
      title="Nessun annuncio"
      message="Non hai ancora pubblicato annunci. Puoi essere tu il primo!"
      actionLabel="Crea annuncio"
      onAction={() => navigation.navigate('CreateListingTab')}
    />
  );

  const handleDeleteListing = (listing: Listing) => {
    Alert.alert(
      "Elimina annuncio",
      `Sei sicuro di voler eliminare l'annuncio "${listing.title}"?`,
      [
        { text: "Annulla", style: "cancel" },
        { 
          text: "Elimina", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'listings', listing.id));
              // Aggiorna la lista dopo l'eliminazione
              setMyListings(prevListings => prevListings.filter(item => item.id !== listing.id));
              Alert.alert("Successo", "Annuncio eliminato con successo");
            } catch (error) {
              console.error("Errore nell'eliminazione dell'annuncio:", error);
              Alert.alert("Errore", "Non è stato possibile eliminare l'annuncio");
            }
          }
        }
      ]
    );
  };
  
  const handleEditListing = (listing: Listing) => {
    // Per ora mostriamo solo un alert, in futuro navigheremo alla schermata di modifica
    Alert.alert(
      "Modifica annuncio",
      `La funzionalità di modifica dell'annuncio "${listing.title}" sarà disponibile presto.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? getStatusBarHeight() : 0 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>I miei annunci</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateListingTab')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Caricamento annunci...</Text>
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
                ? 'In modalità ospite non è possibile gestire i tuoi annunci.'
                : 'Accedi per visualizzare i tuoi annunci'
              }
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
              <Text style={styles.loginButtonText}>Accedi</Text>
            </TouchableOpacity>
          </View>
        ) : myListings.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={myListings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={width > 768 ? 2 : 1}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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

export default MyListingsScreen; 