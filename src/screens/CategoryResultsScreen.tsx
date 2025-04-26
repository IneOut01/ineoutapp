import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Listing } from '../types/listing';
import ListingCard from '../components/ui/ListingCard';
import EmptyState from '../components/EmptyState';

type CategoryResultsRouteParams = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
};

const CategoryResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName, categoryIcon } = route.params as CategoryResultsRouteParams;
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCategoryListings();
  }, [categoryId]);
  
  const fetchCategoryListings = async () => {
    setLoading(true);
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(
        listingsRef,
        where('type', '==', categoryId),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedListings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.titolo || 'Annuncio senza titolo',
          description: data.descrizione || '',
          price: data.prezzo || 0,
          address: data.indirizzo || '',
          city: data.città || '',
          latitude: data.latitudine || 0,
          longitude: data.longitudine || 0,
          images: data.immagine ? [data.immagine] : [],
          ownerId: data.userId || 'system',
          createdAt: data.timestamp || Date.now(),
          updatedAt: data.timestamp || Date.now(),
          available: true,
          type: data.tipo || categoryId
        };
      });
      
      setListings(fetchedListings);
    } catch (error) {
      console.error('Errore nel caricamento degli annunci per categoria:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderEmptyState = () => (
    <EmptyState
      icon={categoryIcon}
      title="Nessun annuncio ancora"
      message="Puoi essere tu il primo! Let's go"
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name={categoryIcon as any} 
            size={26} 
            color={COLORS.primary} 
            style={styles.titleIcon}
          />
          <Text style={styles.title}>{categoryName}</Text>
        </View>
        
        <View style={styles.placeholderButton} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Caricamento annunci...</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  placeholderButton: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
});

export default CategoryResultsScreen; 