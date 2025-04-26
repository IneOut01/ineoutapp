import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Dimensions, ActivityIndicator, Text } from 'react-native';
import MapView, { Region, MapEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import { Listing } from '../types/listing';
import CustomMarker from './ui/CustomMarker';
import debounce from 'lodash.debounce';
import { mapsKeys } from '../config/mapsKeys';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { COLORS } from '../theme/colors';
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";
import { GeoPoint, QueryConstraint } from "firebase/firestore";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import MapFallback from './MapFallback';

interface ClusteredMapProps {
  listings: Listing[];
  initialRegion?: Region;
  onRegionChangeComplete?: (bounds: { 
    northEast: { latitude: number; longitude: number },
    southWest: { latitude: number; longitude: number } 
  }) => void;
  onMarkerPress?: (listing: Listing) => void;
  selectedListingId?: string | null;
  showUserLocation?: boolean;
  clusteringEnabled?: boolean;
  containerStyle?: object;
  minZoom?: number;
  maxZoom?: number;
  clusteringThreshold?: number;
  onListingsUpdate?: (listings: Listing[]) => void;
  isLoadingListings?: boolean;
  setIsLoadingListings?: (loading: boolean) => void;
  onFitBoundsCheck?: (areAllMarkersVisible: boolean) => void;
  fitToMarkersOnLoad?: boolean;
  onError?: (error: any) => void;
  customMapStyle?: any[];
  mapRef?: React.RefObject<MapView>;
  fetchListingsInView?: (bounds: { 
    northEast: { latitude: number; longitude: number },
    southWest: { latitude: number; longitude: number } 
  }) => Promise<void>;
  userLocation?: Location.LocationObject | null;
}

// Regione di default (Roma, Italia)
const DEFAULT_REGION: Region = {
  latitude: 41.9028,
  longitude: 12.4964,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const { width, height } = Dimensions.get('window');
const MARKER_ANIMATION_DURATION = 300;

// Modifico il componente SafeMapView per renderlo più sicuro in modalità Bridgeless
const SafeMapView = React.forwardRef((props, ref) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [bubblingEventTypesError, setBubblingEventTypesError] = useState(false);
  
  // Gestore dell'evento onMapReady
  const handleMapReady = () => {
    setIsReady(true);
    if (props.onMapReady) {
      props.onMapReady();
    }
  };

  // Verifica se l'errore è il bug "bubblingEventTypes"
  useEffect(() => {
    const checkForBubblingEventTypesError = () => {
      try {
        // Prova ad accedere alla proprietà problematica che causa l'errore
        const mapComponent = require('react-native-maps/lib/MapView');
        if (mapComponent && !mapComponent.default?.bubblingEventTypes) {
          console.log('Detected potential bubblingEventTypes issue');
          setBubblingEventTypesError(true);
          return true;
        }
      } catch (err) {
        if (err.toString().includes('bubblingEventTypes')) {
          console.log('Caught bubblingEventTypes error during check:', err);
          setBubblingEventTypesError(true);
          return true;
        }
      }
      return false;
    };

    // Esegui il controllo proattivo
    checkForBubblingEventTypesError();
  }, []);

  // Verifica errori esistenti
  useEffect(() => {
    if (error && 
        (error.message?.includes('bubblingEventTypes') || 
         error.toString().includes('bubblingEventTypes'))) {
      console.log('Detected bubblingEventTypes error from caught error');
      setBubblingEventTypesError(true);
    }
  }, [error]);

  // Gestore degli errori
  try {
    // Se abbiamo l'errore specifico di bubblingEventTypes, mostro il MapFallback
    if (bubblingEventTypesError) {
      const region = props.initialRegion || props.region;
      return (
        <MapFallback
          latitude={region ? region.latitude : 41.9028}
          longitude={region ? region.longitude : 12.4964}
          zoomLevel={15}
          errorMessage="Impossibile caricare Google Maps. Visualizzazione alternativa."
          onRetry={() => {
            console.log('Ritentativo richiesto, reset errore bubblingEventTypes');
            setBubblingEventTypesError(false);
            setError(null);
          }}
        />
      );
    }
    
    // Se la mappa precedentemente ha dato altri errori, mostra la fallback UI
    if (error && !bubblingEventTypesError) {
      throw error;
    }
    
    // Determina se usare il clustering
    const useCluster = props.clusteringEnabled && !!props.children;
    
    // Mostra un contenitore vuoto finché la mappa non è pronta per il rendering
    if (!isReady && Platform.OS === 'android') {
      return (
        <View style={[styles.map, props.style]} />
      );
    }
    
    // Renderizza il componente della mappa appropriato
    return useCluster ? (
      <MapViewClustering {...props} ref={ref} onMapReady={handleMapReady} />
    ) : (
      <MapView {...props} ref={ref} onMapReady={handleMapReady}>
        {isReady && props.children}
      </MapView>
    );
  } catch (error) {
    console.error('Error rendering map component:', error);
    setError(error as Error);
    
    // Verifica se è l'errore bubblingEventTypes
    if (error && error.toString().includes('bubblingEventTypes')) {
      setBubblingEventTypesError(true);
      // Renderizziamo direttamente il MapFallback quando catturiamo l'errore qui
      const region = props.initialRegion || props.region;
      return (
        <MapFallback
          latitude={region ? region.latitude : 41.9028}
          longitude={region ? region.longitude : 12.4964}
          zoomLevel={15}
          errorMessage="Problema rilevato con Google Maps. Utilizzo mappa alternativa."
          onRetry={() => {
            setBubblingEventTypesError(false);
            setError(null);
          }}
        />
      );
    }
    
    // Propagare l'errore al genitore se abbiamo onError disponibile
    if (props.onError) {
      props.onError(error);
    }
    
    // UI per errori generici
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Errore nel caricamento della mappa</Text>
        <Text style={styles.errorSubtext}>{error.toString()}</Text>
      </View>
    );
  }
});

// Tipo per il ref del componente mappa
interface MapRef extends MapView {
  fitToMarkers: () => void;
  areAllListingsVisible: () => Promise<boolean>;
}

// Definiamo una interfaccia per i metodi che esponiamo attraverso il ref
export interface ClusteredMapRefMethods {
  fitToMarkers: () => void;
  areAllListingsVisible: () => Promise<boolean>;
}

// Definizione del componente con forwardRef
const ClusteredMap = forwardRef<ClusteredMapRefMethods, ClusteredMapProps>((props, ref) => {
  const {
    listings,
    initialRegion = DEFAULT_REGION,
    onRegionChangeComplete,
    onMarkerPress,
    selectedListingId,
    showUserLocation = false,
    clusteringEnabled = true,
    containerStyle,
    minZoom = 5,
    maxZoom = 19,
    clusteringThreshold = 50,
    onListingsUpdate,
    isLoadingListings = false,
    setIsLoadingListings,
    onFitBoundsCheck,
    fitToMarkersOnLoad = false,
    onError,
    customMapStyle,
    mapRef: externalMapRef,
    fetchListingsInView: propsFetchListingsInView,
    userLocation
  } = props;
  
  const internalMapRef = useRef<MapView>(null);
  const mapRef = externalMapRef || internalMapRef;
  const [region, setRegion] = useState<Region>(initialRegion);
  const [clusteringActive, setClusteringActive] = useState<boolean>(
    clusteringEnabled && listings.length > clusteringThreshold
  );
  const markerScaleAnims = useRef<{ [key: string]: Animated.Value }>({});
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [visibleListings, setVisibleListings] = useState<Listing[]>([]);
  const [lastBounds, setLastBounds] = useState<{ 
    northEast: { latitude: number; longitude: number },
    southWest: { latitude: number; longitude: number } 
  } | null>(null);

  // Effetto per aggiornare lo stato di clustering in base al numero di listing
  useEffect(() => {
    setClusteringActive(clusteringEnabled && listings.length > clusteringThreshold);
  }, [listings.length, clusteringEnabled, clusteringThreshold]);

  // Prepara le animazioni per tutti i marker
  useEffect(() => {
    // Inizializza le animazioni per ogni marker
    listings.forEach(listing => {
      if (!markerScaleAnims.current[listing.id]) {
        markerScaleAnims.current[listing.id] = new Animated.Value(1);
      }
    });

    // Anima il marker selezionato
    if (selectedListingId) {
      Animated.sequence([
        Animated.timing(markerScaleAnims.current[selectedListingId] || new Animated.Value(1), {
          toValue: 1.3,
          duration: MARKER_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(markerScaleAnims.current[selectedListingId] || new Animated.Value(1), {
          toValue: 1,
          duration: MARKER_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Centra la mappa sul marker selezionato
      const selectedListing = listings.find(l => l.id === selectedListingId);
      if (selectedListing && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: selectedListing.latitude,
          longitude: selectedListing.longitude,
          latitudeDelta: region.latitudeDelta / 2,
          longitudeDelta: region.longitudeDelta / 2,
        }, 500);
      }
    }
  }, [selectedListingId, listings]);

  // Funzione per caricare gli annunci in base ai bounds attuali della mappa
  const fetchListingsInView = useCallback(async (bounds: { 
    northEast: { latitude: number; longitude: number }, 
    southWest: { latitude: number; longitude: number } 
  }) => {
    if (!onListingsUpdate) return;
    
    try {
      if (setIsLoadingListings) {
        setIsLoadingListings(true);
      }
      
      const db = getFirestore();
      const listingsRef = collection(db, "listings");
      
      // Calcola l'area visibile per log
      const visibleArea = {
        latDelta: bounds.northEast.latitude - bounds.southWest.latitude,
        lngDelta: bounds.northEast.longitude - bounds.southWest.longitude,
        centerLat: (bounds.northEast.latitude + bounds.southWest.latitude) / 2,
        centerLng: (bounds.northEast.longitude + bounds.southWest.longitude) / 2
      };
      
      // Log dettagliato dei bounds e area visibile
      console.log("=== FETCHLISTINGSINVIEW DEBUG ===");
      console.log("Fetching listings in visible area:", JSON.stringify(visibleArea, null, 2));
      console.log("Map bounds:", JSON.stringify(bounds, null, 2));
      
      // Prepara le query constraints per il filtraggio geografico
      const constraints: QueryConstraint[] = [
        where("latitudine", "<=", bounds.northEast.latitude),
        where("latitudine", ">=", bounds.southWest.latitude),
        // Non possiamo filtrare su più campi di disuguaglianza, quindi gestiamo la longitudine lato client
        limit(100) // Limita il numero di risultati
      ];
      
      console.log("Query constraints:", constraints);
      
      const q = query(listingsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      console.log(`Firestore query returned ${querySnapshot.docs.length} raw documents`);
      
      // Se non ci sono risultati, mostra un messaggio appropriato
      if (querySnapshot.docs.length === 0) {
        console.log("No listings found in Firestore within the current latitude range");
        if (onListingsUpdate) {
          onListingsUpdate([]);
        }
        return;
      }
      
      // Log dei documenti trovati per debugging
      console.log("First 3 documents from Firestore:", querySnapshot.docs.slice(0, 3).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          latitudine: data.latitudine,
          longitudine: data.longitudine,
          titolo: data.titolo
        };
      }));
      
      // Filtra qui per longitudine dato che non possiamo farlo in Firestore direttamente
      const mappedListings = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          
          // Verifica che i dati geografici esistano
          if (data.latitudine === undefined || data.longitudine === undefined) {
            console.warn(`Listing ${doc.id} missing geographic data:`, data);
            return null;
          }
          
          return {
            id: doc.id,
            title: data.titolo || "Annuncio senza titolo",
            description: data.descrizione || "",
            price: data.prezzo || 0,
            address: data.indirizzo || "Indirizzo non disponibile",
            city: data.città || "",
            latitude: data.latitudine,
            longitude: data.longitudine,
            images: Array.isArray(data.immagini) ? data.immagini : (data.immagine ? [data.immagine] : []), 
            ownerId: data.ownerId || "owner", 
            createdAt: data.timestamp || Date.now(),
            updatedAt: data.timestamp || Date.now(),
            available: data.disponibile !== false, // Default a true se non specificato
            type: data.tipo || "Appartamento",
            distance: data.distance || 0 // Inizializza sempre la proprietà distance
          } as Listing;
        })
        .filter(listing => 
          listing !== null && 
          listing.longitude <= bounds.northEast.longitude && 
          listing.longitude >= bounds.southWest.longitude
        );
      
      console.log(`Filtered to ${mappedListings.length} valid listings within complete bounds`);
      
      // Log degli annunci dopo il filtraggio
      if (mappedListings.length > 0) {
        console.log("Sample listings after filtering:", 
          mappedListings.slice(0, 3).map(l => ({
            id: l.id,
            title: l.title,
            lat: l.latitude,
            lng: l.longitude
          }))
        );
      } else {
        console.log("No listings match the longitude filter criteria");
      }
      
      // Aggiorna la lista di annunci nel componente padre
      onListingsUpdate(mappedListings);
      
    } catch (error) {
      console.error("Errore durante il recupero degli annunci:", error);
      // In caso di errore, comunica che non ci sono risultati
      if (onListingsUpdate) {
        onListingsUpdate([]);
      }
    } finally {
      if (setIsLoadingListings) {
        setIsLoadingListings(false);
      }
    }
  }, [onListingsUpdate, setIsLoadingListings]);

  // Gestisci cambio della regione della mappa con debounce
  const updateMapBounds = useCallback(debounce(async () => {
    if (!mapRef.current) return;
    
    setMapLoading(true);

    try {
      const bounds = await mapRef.current.getMapBoundaries();
      console.log("Map boundaries updated:", bounds);
      
      // Passa i nuovi confini al componente padre
      if (onRegionChangeComplete) {
        onRegionChangeComplete({
          northEast: {
            latitude: bounds.northEast.latitude,
            longitude: bounds.northEast.longitude
          },
          southWest: {
            latitude: bounds.southWest.latitude,
            longitude: bounds.southWest.longitude
          }
        });
      }
      
      // Carica gli annunci nella nuova area visibile
      await fetchListingsInView({
        northEast: {
          latitude: bounds.northEast.latitude,
          longitude: bounds.northEast.longitude
        },
        southWest: {
          latitude: bounds.southWest.latitude,
          longitude: bounds.southWest.longitude
        }
      });
      
      // Verifica se i marker sono visibili
      if (onFitBoundsCheck) {
        const allVisible = await areAllListingsVisible();
        onFitBoundsCheck(allVisible);
      }
      
    } catch (error) {
      console.error('Errore nel recupero dei confini della mappa o degli annunci:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setMapLoading(false);
    }
  }, 300), [onRegionChangeComplete, fetchListingsInView, onFitBoundsCheck, areAllListingsVisible, onError]);

  // Handler per il cambio di regione
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    updateMapBounds();
    
    // Verifica la visibilità degli annunci con un piccolo ritardo per permettere alla mappa di aggiornarsi
    if (onFitBoundsCheck) {
      setTimeout(async () => {
        const allVisible = await areAllListingsVisible();
        onFitBoundsCheck(allVisible);
      }, 300);
    }
  };

  // Gestore dell'evento di press su un cluster
  const handleClusterPress = (cluster: any) => {
    const { coordinate, properties } = cluster;
    const { point_count } = properties;

    // Calcola il nuovo zoom in base al numero di punti nel cluster
    // Più punti = più zoom per suddividerli meglio
    const zoomLevel = Math.min(
      20,
      Math.floor(16 * Math.log(380 / point_count) / Math.log(380)) + 1
    );

    // Nuova regione con zoom adattato
    const newRegion = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: region.latitudeDelta / zoomLevel,
      longitudeDelta: region.longitudeDelta / zoomLevel,
    };

    // Anima la mappa alla nuova regione
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  // Handler per il press su un marker
  const handleMarkerPress = (listing: Listing) => {
    if (onMarkerPress) {
      onMarkerPress(listing);
    }
  };

  // API key in base alla piattaforma
  const apiKey = Platform.OS === 'ios'
    ? mapsKeys.ios
    : Platform.OS === 'android'
      ? mapsKeys.android
      : mapsKeys.web;

  // Miglioramento per il rendering dei marker con più dettagli
  const renderMarkers = () => {
    if (!listings || listings.length === 0) {
      console.log("No listings to render markers for");
      return null;
    }
    
    console.log(`Rendering ${listings.length} markers on the map`);
    
    return listings.map(listing => {
      // Verifica che le coordinate siano valide
      if (!listing.latitude || !listing.longitude) {
        console.warn(`Invalid coordinates for listing ${listing.id}:`, listing);
        return null;
      }
      
      return (
        <CustomMarker
          key={listing.id}
          coordinate={{
            latitude: listing.latitude,
            longitude: listing.longitude
          }}
          price={listing.price}
          distance={listing.distance !== undefined ? listing.distance : undefined}
          identifier={listing.id}
          isSelected={selectedListingId === listing.id}
          onPress={() => handleMarkerPress(listing)}
          scaleAnim={markerScaleAnims.current[listing.id]}
          // Informazioni aggiuntive per il tooltip/callout
          title={listing.title}
          imageUrl={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
          address={`${listing.address}, ${listing.city}`}
          type={listing.type}
        />
      );
    }).filter(marker => marker !== null); // Filtra eventuali marker null
  };

  // Funzione per calcolare i bounds di tutti gli annunci
  const calculateListingsBounds = useCallback(() => {
    if (!listings || listings.length === 0) return null;
    
    // Inizializza con i valori del primo annuncio
    let minLat = listings[0].latitude;
    let maxLat = listings[0].latitude;
    let minLng = listings[0].longitude;
    let maxLng = listings[0].longitude;
    
    // Calcola i bounds considerando tutti gli annunci
    listings.forEach(listing => {
      minLat = Math.min(minLat, listing.latitude);
      maxLat = Math.max(maxLat, listing.latitude);
      minLng = Math.min(minLng, listing.longitude);
      maxLng = Math.max(maxLng, listing.longitude);
    });
    
    // Aggiungi un padding del 10%
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;
    
    return {
      northEast: {
        latitude: maxLat + latPadding,
        longitude: maxLng + lngPadding
      },
      southWest: {
        latitude: minLat - latPadding,
        longitude: minLng - lngPadding
      }
    };
  }, [listings]);
  
  // Funzione per verificare se tutti gli annunci sono visibili nella mappa
  const areAllListingsVisible = useCallback(async () => {
    if (!mapRef.current || !listings || listings.length === 0) return true;
    
    try {
      // Ottieni i bounds attuali della mappa
      const currentBounds = await mapRef.current.getMapBoundaries();
      
      // Verifica se ogni annuncio è contenuto nei bounds attuali
      return listings.every(listing => 
        listing.latitude <= currentBounds.northEast.latitude &&
        listing.latitude >= currentBounds.southWest.latitude &&
        listing.longitude <= currentBounds.northEast.longitude &&
        listing.longitude >= currentBounds.southWest.longitude
      );
    } catch (error) {
      console.error('Errore nel controllo dei bounds:', error);
      return false;
    }
  }, [listings]);
  
  // Funzione per zoomare la mappa per includere tutti gli annunci
  const fitToMarkers = useCallback(() => {
    if (!mapRef.current || !listings || listings.length === 0) return;
    
    try {
      const bounds = calculateListingsBounds();
      if (!bounds) return;
      
      // React Native Maps non ha un fitBounds diretto, quindi calcoliamo una regione che include tutti gli annunci
      const centerLat = (bounds.northEast.latitude + bounds.southWest.latitude) / 2;
      const centerLng = (bounds.northEast.longitude + bounds.southWest.longitude) / 2;
      const latDelta = Math.abs(bounds.northEast.latitude - bounds.southWest.latitude) * 1.1; // 10% in più
      const lngDelta = Math.abs(bounds.northEast.longitude - bounds.southWest.longitude) * 1.1; // 10% in più
      
      mapRef.current.animateToRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta
      }, 500);
      
      console.log('Zooming to include all listings');
    } catch (error) {
      console.error('Errore nell\'adattamento ai marker:', error);
    }
  }, [listings, calculateListingsBounds]);
  
  // Verifica se tutti gli annunci sono visibili dopo un cambio di regione
  useEffect(() => {
    if (onFitBoundsCheck) {
      const checkVisibility = async () => {
        const allVisible = await areAllListingsVisible();
        onFitBoundsCheck(allVisible);
      };
      
      checkVisibility();
    }
  }, [region, listings, onFitBoundsCheck, areAllListingsVisible]);
  
  // Zooma per includere tutti gli annunci al caricamento se richiesto
  useEffect(() => {
    if (fitToMarkersOnLoad && listings && listings.length > 0) {
      // Ritardo leggero per assicurarsi che la mappa sia caricata completamente
      setTimeout(() => {
        fitToMarkers();
      }, 500);
    }
  }, [fitToMarkersOnLoad, listings, fitToMarkers]);
  
  // Esporta i metodi attraverso il ref
  useImperativeHandle(ref, () => ({
    fitToMarkers: () => {
      // Implementa la funzione fitToMarkers
      console.log("fitToMarkers called");
    },
    areAllListingsVisible: async () => {
      // Implementa la funzione areAllListingsVisible
      console.log("areAllListingsVisible called");
      return true;
    }
  }));

  // Funzione per deselezionare il marker attualmente selezionato
  const clearSelection = useCallback(() => {
    if (onMarkerPress && selectedListingId) {
      // Possiamo chiamare onMarkerPress con null per indicare deselection
      onMarkerPress(null as any);
    }
  }, [onMarkerPress, selectedListingId]);

  // Funzione per il rendering sicuro della mappa con fallback
  const renderMap = () => {
    try {
      // Su iOS senza Google Maps, usa un MapView normale
      return (
        <View style={[styles.map, containerStyle]}>
          {mapReady || Platform.OS === 'ios' ? (
            <SafeMapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              provider={clusteringActive ? undefined : PROVIDER_GOOGLE}
              customMapStyle={customMapStyle}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={showUserLocation}
              clusteringEnabled={clusteringActive}
              onPress={clearSelection}
              onError={onError}
              minZoom={minZoom}
              maxZoom={maxZoom}
              onMapReady={() => setMapReady(true)}
              listings={listings}
              selectedListingId={selectedListingId}
              onMarkerPress={onMarkerPress}
            >
              {mapReady && renderMarkers()}
            </SafeMapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Caricamento mappa...</Text>
            </View>
          )}
        </View>
      );
    } catch (error) {
      console.error('Error rendering map:', error);
      
      // Se è l'errore bubblingEventTypes, usa il MapFallback
      if (error.toString && error.toString().includes('bubblingEventTypes')) {
        return (
          <MapFallback
            latitude={initialRegion.latitude}
            longitude={initialRegion.longitude}
            zoom={15}
            height="100%"
            width="100%"
            errorMessage="Problema con la mappa. Utilizzo alternativa OpenStreetMap."
            listings={listings}
            onMarkerPress={onMarkerPress}
            selectedId={selectedListingId}
          />
        );
      }
      
      // Per altri errori, mostra la fallback UI
      return (
        <View style={[styles.map, containerStyle, styles.errorContainer]}>
          <Text style={styles.errorText}>Errore nel caricamento della mappa</Text>
          <Text style={styles.errorSubtext}>{error.toString ? error.toString() : 'Errore sconosciuto'}</Text>
        </View>
      );
    }
  };

  return renderMap();
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  noDataOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ClusteredMap; 