import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, startAfter, getCountFromServer, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { LocationData } from './useLocation';
import { Listing, MapBounds } from '../types/listing';
import { calculateDistance } from '../utils/distanceUtils';
import { MOCK_LISTINGS } from '../data/mockListings';
import { ListingFilters } from '../types/filters';
import { processQueryResults } from '../utils/listingUtils';
import { applyClientFilters } from '../utils/filterUtils';
import { useSafeTimeout } from './useSafeTimeout';

// Definizione dell'interfaccia per i filtri di ricerca
export interface ListingFilters {
  query?: string;
  types?: string[];
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sortByDistance?: boolean;
  nearbyRadius?: number;
  minMonths?: number;     // Numero minimo di mesi di permanenza
  minSize?: number;       // Metratura minima in m²
  recentOnly?: boolean;   // Annunci recenti (ultimi 30 giorni)
  mapBounds?: {           // Per il filtro "Disegna zona"
    northEast: {latitude: number, longitude: number},
    southWest: {latitude: number, longitude: number}
  };
}

// Hook personalizzato per ottenere gli annunci con filtraggio client-side
export const useListings = (
  bounds: MapBounds | null = null,
  filters: ListingFilters = {},
  userLocation: LocationData | null = null,
  pageSize: number = 20
) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const MAX_FETCH_ATTEMPTS = 3;
  
  // Add a ref to track if a fetch is already in progress to prevent simultaneous requests
  const isRefetchingRef = useRef<boolean>(false);
  // Add a ref to track if initial data load is complete
  const initialLoadCompleteRef = useRef<boolean>(false);
  
  const { setTimeout, clearTimeout } = useSafeTimeout();
  
  // Fallback per caricare annunci demo se il fetch fallisce
  const loadDemoListings = useCallback(async () => {
    console.log('⚠️ Attivato fallback di caricamento annunci demo');
    try {
      console.log('Caricamento annunci demo...');
      
      // Applica filtri clientside agli annunci demo
      const filteredMockListings = applyClientFilters(MOCK_LISTINGS, filters, bounds, userLocation);
      
      setAllListings(MOCK_LISTINGS);
      setListings(filteredMockListings);
      setFilteredListings(filteredMockListings);
      setHasMore(false); // Non ci sono più dati da caricare
      
      console.log(`✅ Caricati ${filteredMockListings.length} annunci demo`);
      
    } catch (err) {
      console.error('❌ Errore nel caricamento degli annunci demo:', err);
      setError('Impossibile caricare gli annunci');
    } finally {
      setLoading(false);
      setFetchAttempts(0); // Reset del contatore di tentativi
    }
  }, [filters, bounds, userLocation]);
  
  // Funzione principale per caricare gli annunci con protezione da errori
  const fetchListingsInView = useCallback(async () => {
    // Evita di avviare una nuova richiesta se è già in corso un caricamento
    if ((loading && !loadingMore) || isRefetchingRef.current) {
      console.log('⚠️ Caricamento già in corso, richiesta ignorata');
      return;
    }
    
    isRefetchingRef.current = true;
    
    // Controlla il numero di tentativi per evitare cicli infiniti
    if (fetchAttempts >= MAX_FETCH_ATTEMPTS) {
      console.log(`⚠️ Raggiunto il numero massimo di tentativi (${MAX_FETCH_ATTEMPTS}), utilizzo dati demo`);
      setLoading(false);
      setError('Troppi tentativi di caricamento. Utilizzo dati di esempio.');
      await loadDemoListings();
      isRefetchingRef.current = false;
      return;
    }
    
    console.log(`🔄 Avvio caricamento annunci - tentativo ${fetchAttempts + 1}/${MAX_FETCH_ATTEMPTS}`);
    setLoading(true);
    setError(null);
    setFetchAttempts(prev => prev + 1);
    
    // Aggiungi un timeout di sicurezza per prevenire caricamenti infiniti
    const timeoutId = setTimeout(() => {
      if (loading && isRefetchingRef.current) {
        console.log('⏱️ Timeout di sicurezza attivato: caricamento annullato');
        setLoading(false);
        setError('Il caricamento sta impiegando troppo tempo. Riprova più tardi.');
        loadDemoListings();
        isRefetchingRef.current = false;
      }
    }, 15000); // 15 secondi di timeout
    
    try {
      console.log('📊 Caricamento di tutti gli annunci dal database...');
      const listingsRef = collection(db, 'listings');
      
      // Query semplice senza limit per recuperare tutti gli annunci
      // Ordina per data di creazione (dal più recente)
      let q = query(listingsRef, orderBy('timestamp', 'desc'));
      
      try {
        console.log('🔄 Esecuzione query Firestore...');
        const querySnapshot = await getDocs(q);
        
        // Cancella il timeout di sicurezza
        clearTimeout(timeoutId);
        
        if (querySnapshot.empty) {
          console.log('⚠️ Nessun annuncio trovato nel database');
          await loadDemoListings();
          return;
        }
        
        console.log(`🔄 Elaborazione di ${querySnapshot.docs.length} annunci...`);
        const fetchedListings = processQueryResults(querySnapshot);
        
        // Salva tutti gli annunci non filtrati
        setAllListings(fetchedListings);
        
        // Applica i filtri client-side
        const filtered = applyClientFilters(fetchedListings, filters, bounds, userLocation);
        console.log(`📋 Dopo il filtraggio: ${filtered.length} annunci corrispondono ai criteri`);
        
        // Aggiorna lo stato con gli annunci filtrati
        setListings(filtered.slice(0, pageSize));
        setFilteredListings(filtered);
        setHasMore(filtered.length > pageSize);
        setFetchAttempts(0); // Reset del contatore di tentativi dopo un caricamento riuscito
        console.log(`✅ Caricati ${fetchedListings.length} annunci con successo`);
        
        // At the end of successful fetch:
        initialLoadCompleteRef.current = true;
        setInitialLoadComplete(true);
        
      } catch (queryError) {
        // Cancella il timeout di sicurezza
        clearTimeout(timeoutId);
        console.error('❌ Errore durante la query Firestore:', queryError);
        await loadDemoListings();
      }
    } catch (err) {
      // Cancella il timeout di sicurezza
      clearTimeout(timeoutId);
      console.error('❌ Errore durante il recupero degli annunci:', err);
      setError('Errore durante il recupero degli annunci. Riprova più tardi.');
      await loadDemoListings();
    } finally {
      // Garantiamo che lo stato di loading venga sempre impostato a false
      setLoading(false);
      isRefetchingRef.current = false;
    }
  }, [loadDemoListings, loading, loadingMore, fetchAttempts, MAX_FETCH_ATTEMPTS, pageSize, filters, bounds, userLocation, setTimeout, clearTimeout]);
  
  // Carica più risultati per la paginazione
  const fetchMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      // Calcola il numero di annunci già visualizzati
      const currentLength = listings.length;
      
      // Carica la prossima "pagina" di annunci dai listing filtrati
      const nextPageItems = filteredListings.slice(currentLength, currentLength + pageSize);
      
      if (nextPageItems.length === 0) {
        setHasMore(false);
        return;
      }
      
      // Aggiorna lo stato con i nuovi risultati
      setListings(prev => [...prev, ...nextPageItems]);
      setHasMore(currentLength + nextPageItems.length < filteredListings.length);
      
    } catch (err) {
      console.error('Errore durante il caricamento di più annunci:', err);
      setError('Errore durante il caricamento di più annunci');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, listings, filteredListings, pageSize]);
  
  // Aggiorna i listing filtrati quando cambiano i filtri
  useEffect(() => {
    if (allListings.length > 0) {
      console.log('Applicazione filtri agli annunci già caricati');
      const filtered = applyClientFilters(allListings, filters, bounds, userLocation);
      setFilteredListings(filtered);
      setListings(filtered.slice(0, pageSize));
      setHasMore(filtered.length > pageSize);
    }
  }, [filters, bounds, userLocation, allListings, pageSize]);
  
  // Effetto per caricare gli annunci quando il componente viene montato
  useEffect(() => {
    console.log('Caricamento iniziale degli annunci');
    
    // Se c'è già un caricamento in corso, evitiamo di iniziarne un altro
    if (isRefetchingRef.current) {
      console.log('Richiesta ignorata: caricamento già in corso');
      return;
    }
    
    fetchListingsInView();
  }, [fetchListingsInView]);
  
  return { 
    listings, 
    loading, 
    loadingMore, 
    hasMore, 
    error, 
    fetchMore,
    refetch: fetchListingsInView,
    setListings,
    initialLoadComplete
  };
};

export default useListings; 