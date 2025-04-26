import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { useNavigation } from '@react-navigation/native';
import { useToast } from 'react-native-toast-notifications';

interface UseFavoritesResult {
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  getFavoriteListings: () => Promise<any[]>;
}

/**
 * Hook per la gestione degli annunci preferiti dell'utente
 */
export const useFavorites = (): UseFavoritesResult => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();

  // Carica i preferiti dell'utente
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists() && userDoc.data().favoriteListings) {
        setFavorites(userDoc.data().favoriteListings);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei preferiti:', err);
      setError('Impossibile caricare i preferiti');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Carica i preferiti all'avvio e quando cambia l'utente
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Controlla se un annuncio è tra i preferiti
  const isFavorite = useCallback(
    (listingId: string): boolean => {
      return favorites.includes(listingId);
    },
    [favorites]
  );

  // Aggiunge o rimuove un annuncio dai preferiti
  const toggleFavorite = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!isAuthenticated || !user) {
        // Se l'utente non è autenticato, reindirizza alla schermata di login
        toast.show({
          type: 'warning',
          text1: 'Accesso richiesto',
          text2: 'Effettua il login per salvare questo annuncio nei preferiti'
        });
        navigation.navigate('Login' as never);
        return false;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        
        if (isFavorite(listingId)) {
          // Rimuovi dai preferiti
          await updateDoc(userRef, {
            favoriteListings: arrayRemove(listingId)
          });
          setFavorites(prev => prev.filter(id => id !== listingId));
          toast.show({
            type: 'success',
            text1: 'Rimosso dai preferiti'
          });
          return false;
        } else {
          // Aggiungi ai preferiti
          await updateDoc(userRef, {
            favoriteListings: arrayUnion(listingId)
          });
          setFavorites(prev => [...prev, listingId]);
          toast.show({
            type: 'success',
            text1: 'Aggiunto ai preferiti'
          });
          return true;
        }
      } catch (err) {
        console.error('Errore nella gestione dei preferiti:', err);
        toast.show({
          type: 'error',
          text1: 'Errore',
          text2: 'Impossibile aggiornare i preferiti'
        });
        return isFavorite(listingId);
      }
    },
    [user, isAuthenticated, favorites, isFavorite, navigation, toast]
  );

  // Ottiene i dettagli completi degli annunci preferiti
  const getFavoriteListings = useCallback(async () => {
    if (favorites.length === 0) return [];
    
    try {
      const promises = favorites.map(id => 
        getDoc(doc(db, 'listings', id))
          .then(doc => {
            if (doc.exists()) {
              return { id: doc.id, ...doc.data() };
            }
            return null;
          })
      );
      
      const results = await Promise.all(promises);
      return results.filter(item => item !== null);
    } catch (err) {
      console.error('Errore nel recupero dei dettagli degli annunci preferiti:', err);
      throw new Error('Impossibile recuperare i dettagli degli annunci preferiti');
    }
  }, [favorites]);

  return {
    favorites,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
    getFavoriteListings
  };
};

// Aggiungi questa riga per esportare il hook come default
export default useFavorites; 