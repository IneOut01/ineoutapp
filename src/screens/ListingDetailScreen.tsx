import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  Share,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Image } from 'expo-image';
import { useTranslation } from '../contexts/LanguageContext';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Listing } from '../types/listing';
import { useListing } from '../hooks/useListing';
import StreetViewContainer from '../components/StreetViewContainer';
import MapFallback from '../components/MapFallback';
import { GOOGLE_MAPS_API_KEY } from '../config/apiKeys';
import ReportListingModal from '../components/ReportListingModal';
import { BlurView } from 'expo-blur';
import { formatCurrency, formatDistanceToNow } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { geocodeAddress, getDirectionsUrl } from '../utils/location';
import Carousel from 'react-native-reanimated-carousel';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  ListingDetail: {
    id: string;
  };
};

const ListingDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ListingDetail'>>();
  const { id } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapError, setMapError] = useState(false);
  
  // Caricamento dati annuncio
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In un'app reale, qui faresti una richiesta a Firestore
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setListing({
            id: docSnap.id,
            title: data.title || 'Annuncio senza titolo',
            description: data.description || 'Nessuna descrizione disponibile',
            price: data.price || 0,
            address: data.address || 'Indirizzo non disponibile',
            city: data.city || 'Città non specificata',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            images: Array.isArray(data.images) ? data.images : 
                    (data.image ? [data.image] : 
                    ['https://via.placeholder.com/400x300/cccccc/333333?text=Immagine+non+disponibile']),
            ownerId: data.ownerUid || data.ownerId || 'proprietario sconosciuto',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            available: data.available !== false,
            type: data.type || 'non specificato',
            size: data.size || data.m2 || 0,
            rooms: data.rooms || 0,
            bathrooms: data.bathrooms || 0,
            months: data.months || 0,
          });
          
          // Verifica se l'annuncio è tra i preferiti dell'utente
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setIsFavorite(userData.favorites?.includes(id) || false);
            }
          }
        } else {
          setError("Annuncio non trovato o potrebbe essere stato rimosso.");
        }
      } catch (err) {
        console.error('Errore nel caricamento dell\'annuncio:', err);
        setError("Si è verificato un errore nel caricamento dell'annuncio. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id, user]);

  // Verifica se l'utente corrente è il proprietario dell'annuncio
  const isOwner = (): boolean => {
    return user && listing && (listing.ownerId === user.uid);
  };

  // Gestisce l'eliminazione dell'annuncio
  const handleDeleteListing = () => {
    Alert.alert(
      "Elimina annuncio",
      "Sei sicuro di voler eliminare questo annuncio? Questa azione non può essere annullata.",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        { 
          text: "Elimina", 
          onPress: () => {
            // In un'app reale, qui elimineresti l'annuncio da Firestore
            Alert.alert("Funzionalità in arrivo", "La funzione di eliminazione sarà disponibile presto.");
            // navigation.goBack();
          },
          style: "destructive"
        }
      ]
    );
  };

  // Gestisce la modifica dell'annuncio
  const handleEditListing = () => {
    // In un'app reale, qui navigheresti alla schermata di modifica
    Alert.alert("Funzionalità in arrivo", "La funzione di modifica sarà disponibile presto.");
    // navigation.navigate('EditListing', { id: listing.id });
  };

  // Geocoding dell'indirizzo al caricamento dell'annuncio
  useEffect(() => {
    if (!listing) return;
    
    const getCoordinates = async () => {
      // Se sono già presenti coordinate nell'annuncio, usale direttamente
      if (listing.latitude && listing.longitude) {
        setCoordinates({
          latitude: listing.latitude,
          longitude: listing.longitude
        });
        return;
      }
      
      // Altrimenti, prova a fare geocoding dell'indirizzo
      if (listing.address && listing.city) {
        try {
          setIsGeocoding(true);
          setLocationError(null);
          
          const fullAddress = `${listing.address}, ${listing.city}`;
          const results = await Location.geocodeAsync(fullAddress);
          
          if (results && results.length > 0) {
            setCoordinates({
              latitude: results[0].latitude,
              longitude: results[0].longitude
            });
          } else {
            // Se il geocoding dell'indirizzo completo fallisce, prova solo con la città
            const cityResults = await Location.geocodeAsync(listing.city);
            
            if (cityResults && cityResults.length > 0) {
              setCoordinates({
                latitude: cityResults[0].latitude,
                longitude: cityResults[0].longitude
              });
            } else {
              // Se fallisce anche il geocoding della città, usa coordinate di default per l'Italia (Roma)
              setLocationError("Impossibile trovare la posizione esatta.");
              setCoordinates({
                latitude: 41.9028,
                longitude: 12.4964
              });
            }
          }
        } catch (error) {
          console.error('Errore durante il geocoding:', error);
          setLocationError("Errore durante la localizzazione dell'indirizzo.");
          // Usa coordinate di default
          setCoordinates({
            latitude: 41.9028,
            longitude: 12.4964
          });
        } finally {
          setIsGeocoding(false);
        }
      } else {
        // Se non ci sono né indirizzo né città, usa Roma come default
        setLocationError("Indirizzo non disponibile.");
        setCoordinates({
          latitude: 41.9028,
          longitude: 12.4964
        });
      }
    };
    
    getCoordinates();
  }, [listing]);

  // Visualizza le indicazioni su Google Maps
  const openDirections = () => {
    if (!coordinates || !listing) return;
    
    const url = Platform.select({
      ios: `maps://app?daddr=${coordinates.latitude},${coordinates.longitude}`,
      android: `google.navigation:q=${coordinates.latitude},${coordinates.longitude}`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback al browser se l'app di mappe non è disponibile
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`);
      }
    }).catch(err => console.error('Errore nell\'apertura delle indicazioni:', err));
  };

  // Condividi annuncio
  const handleShare = async () => {
    if (!listing) return;
    
    try {
      const result = await Share.share({
        message: `Dai un'occhiata a questo annuncio: "${listing.title}" a ${listing.price}€/mese - ${listing.address}, ${listing.city}`,
        // In un'app reale, qui useresti un URL dell'app o del sito web
        url: `https://ineout.app/listings/${id}`,
        title: `${listing.title} - ${listing.price}€/mese`,
      });
    } catch (error) {
      console.error('Errore durante la condivisione:', error);
      Alert.alert("Errore", "Impossibile condividere l'annuncio");
    }
  };

  // Aggiungi/rimuovi dai preferiti
  const toggleFavorite = async () => {
    if (!user || !listing) {
      Alert.alert(
        "Accesso richiesto", 
        "Devi effettuare l'accesso per salvare gli annunci tra i preferiti"
      );
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (isFavorite) {
        // Rimuovi dai preferiti
        await setDoc(userRef, {
          favorites: arrayRemove(id)
        }, { merge: true });
        setIsFavorite(false);
      } else {
        // Aggiungi ai preferiti
        await setDoc(userRef, {
          favorites: arrayUnion(id)
        }, { merge: true });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Errore nel gestire i preferiti:', error);
      Alert.alert("Errore", "Impossibile aggiornare i preferiti");
    }
  };

  // Contact owner
  const contactOwner = () => {
    if (!listing) return;
    
    Alert.alert(
      "Contatta il proprietario",
      "Vuoi contattare il proprietario di questo immobile?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        { 
          text: "Contatta", 
          onPress: () => {
            // In un'app reale, qui apriresti una chat o una funzione di chiamata
            Alert.alert("Funzionalità in arrivo", "La funzione di contatto sarà disponibile presto.");
          }
        }
      ]
    );
  };

  // Formatta il prezzo
  const formatPrice = (price) => {
    return `€ ${price.toLocaleString('it-IT')}/mese`;
  };

  // Renderizza il contenuto in base allo stato
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Caricamento annuncio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Ops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="search-off" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Annuncio non trovato</Text>
        <Text style={styles.errorMessage}>L'annuncio potrebbe essere stato rimosso o non è più disponibile.</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header con pulsanti */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerRightButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? COLORS.secondary : COLORS.white} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setReportModalVisible(true)}
          >
            <MaterialIcons name="flag" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Contenuto principale */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Carosello immagini */}
        <Carousel
          loop
          width={width}
          height={300}
          autoPlay={false}
          data={listing.images}
          scrollAnimationDuration={1000}
          renderItem={({ item, index }) => (
            <Image
              source={{ uri: item }}
              style={styles.carouselImage}
              contentFit="cover"
              transition={300}
            />
          )}
        />
        
        {/* Contenitore info principale */}
        <View style={styles.contentContainer}>
          {/* Prezzo e titolo */}
          <View style={styles.mainInfoContainer}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.address}>{listing.address}, {listing.city}</Text>
            
            {/* Data pubblicazione */}
            <Text style={styles.publishedDate}>
              Pubblicato {formatDistanceToNow(new Date(listing.createdAt))}
            </Text>
          </View>
          
          {/* Caratteristiche principali */}
          <View style={styles.featuresContainer}>
            {listing.type && (
              <View style={styles.featureItem}>
                <MaterialIcons name="home" size={22} color={COLORS.primary} />
                <Text style={styles.featureText}>{listing.type}</Text>
              </View>
            )}
            
            {listing.size > 0 && (
              <View style={styles.featureItem}>
                <MaterialIcons name="straighten" size={22} color={COLORS.primary} />
                <Text style={styles.featureText}>{listing.size} m²</Text>
              </View>
            )}
            
            {listing.rooms > 0 && (
              <View style={styles.featureItem}>
                <MaterialIcons name="hotel" size={22} color={COLORS.primary} />
                <Text style={styles.featureText}>{listing.rooms} {listing.rooms === 1 ? 'stanza' : 'stanze'}</Text>
              </View>
            )}
            
            {listing.bathrooms > 0 && (
              <View style={styles.featureItem}>
                <FontAwesome5 name="bath" size={18} color={COLORS.primary} />
                <Text style={styles.featureText}>{listing.bathrooms} {listing.bathrooms === 1 ? 'bagno' : 'bagni'}</Text>
              </View>
            )}
            
            {listing.months > 0 && (
              <View style={styles.featureItem}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                <Text style={styles.featureText}>Min. {listing.months} {listing.months === 1 ? 'mese' : 'mesi'}</Text>
              </View>
            )}
          </View>
          
          {/* Descrizione */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Descrizione</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
          
          {/* Posizione e mappa */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Posizione</Text>
            
            {isGeocoding ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mapPlaceholderText}>Caricamento mappa...</Text>
              </View>
            ) : (
              <>
                {locationError && (
                  <Text style={styles.locationErrorText}>{locationError}</Text>
                )}
                
                {coordinates && (
                  <View style={styles.mapContainer}>
                    <MapView
                      provider={PROVIDER_GOOGLE}
                      style={styles.map}
                      initialRegion={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        latitudeDelta: 0.008,
                        longitudeDelta: 0.008,
                      }}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      scrollEnabled={false}
                      pitchEnabled={false}
                    >
                      <Marker
                        coordinate={{
                          latitude: coordinates.latitude,
                          longitude: coordinates.longitude,
                        }}
                        title={listing.title}
                        description={listing.address}
                      />
                    </MapView>
                    
                    {/* Overlay con pulsante per direzioni */}
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={openDirections}
                    >
                      <MaterialIcons name="directions" size={18} color={COLORS.white} />
                      <Text style={styles.directionsButtonText}>Indicazioni</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <Text style={styles.addressText}>{listing.address}, {listing.city}</Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Pulsante di contatto fisso in basso */}
      <View style={styles.bottomContainer}>
        {isOwner() ? (
          <View style={styles.ownerActionsContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditListing}
            >
              <MaterialIcons name="edit" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Modifica</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteListing}
            >
              <MaterialIcons name="delete" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Elimina</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={contactOwner}
          >
            <Text style={styles.contactButtonText}>Contatta il proprietario</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Modal di segnalazione */}
      <ReportListingModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        listingId={id}
        listingTitle={listing.title}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerRightButtons: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  carouselImage: {
    width: '100%',
    height: 300,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: COLORS.white,
  },
  mainInfoContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  publishedDate: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    marginVertical: 6,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  directionsButtonText: {
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 300,
    width: '100%',
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  mapPlaceholderText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  locationErrorText: {
    color: COLORS.error,
    marginBottom: 12,
    fontSize: 14,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ownerActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default ListingDetailScreen; 