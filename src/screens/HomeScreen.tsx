import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  Image,
  Keyboard,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useTranslation } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Listing } from '../types/listing';
import { useToast } from 'react-native-toast-notifications';
import StatusBarManager from '../components/StatusBarManager';

// Larghezza dello schermo per il calcolo responsive
const { width, height } = Dimensions.get('window');

// Tipologie di alloggio disponibili
const TIPOLOGIE_ALLOGGIO = [
  { id: 'ROOM', nome: 'Stanze singole', icon: 'bed-empty' },
  { id: 'APARTMENT', nome: 'Appartamenti', icon: 'home' },
  { id: 'STUDIO', nome: 'Monolocali', icon: 'home-city' },
  { id: 'OFFICE', nome: 'Uffici', icon: 'office-building' },
];

// Lista completa delle categorie per il menu a tendina (per affitto classico)
const CATEGORIE_AFFITTO_CLASSICO = [
  { id: 'SINGLE_ROOM', nome: 'Stanza singola', icon: 'bed-empty' },
  { id: 'DOUBLE_ROOM', nome: 'Stanza matrimoniale', icon: 'bed-queen' },
  { id: 'TRIPLE_ROOM', nome: 'Stanza tripla', icon: 'bed-queen-outline' },
  { id: 'STUDIO', nome: 'Monolocale', icon: 'home-city' },
  { id: 'TWO_ROOMS', nome: 'Bilocale', icon: 'door' },
  { id: 'THREE_ROOMS', nome: 'Trilocale', icon: 'door-sliding' },
  { id: 'OFFICE_ROOM', nome: 'Stanza uso ufficio', icon: 'desk' },
  { id: 'ATTIC', nome: 'Mansarda', icon: 'home-roof' },
  { id: 'BASEMENT', nome: 'Seminterrato', icon: 'home-floor-negative-1' },
  { id: 'LAND', nome: 'Terreni', icon: 'grass' },
  { id: 'BOX', nome: 'Box', icon: 'package-variant-closed' },
  { id: 'GARAGE', nome: 'Garage', icon: 'garage' },
];

// Categorie per affitto turistico
const CATEGORIE_AFFITTO_TURISTICO = [
  { id: 'HOTEL_ROOM', nome: 'Stanza Hotel', icon: 'bed-empty' },
  { id: 'BB_ROOM', nome: 'Stanza B&B', icon: 'bed-king' },
  { id: 'RENTAL_ROOM', nome: 'Stanza Affittacamere', icon: 'bed-queen' },
  { id: 'TOURIST_APARTMENT', nome: 'Appartamento Turistico', icon: 'home-city' },
  { id: 'VILLA_APARTMENT', nome: 'Appartamento in Villa', icon: 'home-modern' },
  { id: 'VILLA_ROOM', nome: 'Stanza in Villa', icon: 'door-open' },
];

// Categorie per vendita
const CATEGORIE_VENDITA = [
  { id: 'APARTMENT_SALE', nome: 'Appartamento', icon: 'home' },
  { id: 'HOUSE_SALE', nome: 'Casa indipendente', icon: 'home-modern' },
  { id: 'VILLA_SALE', nome: 'Villa', icon: 'home-floor-1' },
  { id: 'LAND_SALE', nome: 'Terreno', icon: 'grass' },
  { id: 'COMMERCIAL_SALE', nome: 'Locale commerciale', icon: 'store' },
  { id: 'OFFICE_SALE', nome: 'Ufficio', icon: 'office-building' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const statusBarHeight = getStatusBarHeight(true);
  
  // Stati per navigazione e input
  const [selectedType, setSelectedType] = useState('SINGLE_ROOM');
  const [searchLocation, setSearchLocation] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [categorieDropdownVisible, setCategorieDropdownVisible] = useState(false);
  
  // Stato per gli annunci
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const toast = useToast();
  
  // Aggiungo stato per il tipo di ricerca
  const [searchType, setSearchType] = useState('affitto-classico');
  
  // Carica gli annunci quando il componente viene montato
  useEffect(() => {
    fetchListings();
  }, []);

  // Aggiorna il tipo selezionato quando cambia il tipo di ricerca
  useEffect(() => {
    // Reset del tipo selezionato quando cambia il tipo di ricerca
    if (searchType === 'affitto-classico') {
      setSelectedType(CATEGORIE_AFFITTO_CLASSICO[0].id);
    } else if (searchType === 'affitto-turistico') {
      setSelectedType(CATEGORIE_AFFITTO_TURISTICO[0].id);
    } else if (searchType === 'vendita') {
      setSelectedType(CATEGORIE_VENDITA[0].id);
    }
  }, [searchType]);
  
  const fetchListings = async () => {
    setLoading(true);
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, limit(50));
      const querySnapshot = await getDocs(q);
      
      // Immagine di fallback da usare se un annuncio non ha immagini
      const fallbackImage = 'https://via.placeholder.com/400x300/cccccc/333333?text=Annuncio+In%26Out';
      
      const fetchedListings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Assicuriamo che ogni annuncio abbia almeno 2 immagini
        let images = [];
        if (data.immagine) {
          // Se l'annuncio ha un'immagine, la usiamo e aggiungiamo una copia
          images = [data.immagine, data.immagine];
        } else {
          // Se l'annuncio non ha immagini, usiamo l'immagine di fallback
          images = [fallbackImage, fallbackImage];
        }
        
        // Se ci sono più immagini nell'array, le usiamo, altrimenti manteniamo le 2 minime
        if (data.immagini && Array.isArray(data.immagini) && data.immagini.length >= 2) {
          images = data.immagini;
        }
        
        return {
          id: doc.id,
          title: data.titolo || 'Annuncio',
          description: data.descrizione || '',
          price: data.prezzo || 0,
          address: data.indirizzo || '',
          city: data.città || '',
          latitude: data.latitudine || 0,
          longitude: data.longitudine || 0,
          images: images, // Usiamo l'array di immagini preparato
          ownerId: data.userId || 'system',
          createdAt: data.timestamp || Date.now(),
          updatedAt: data.timestamp || Date.now(),
          available: true,
          type: data.tipo || 'ROOM'
        };
      });
      
      setListings(fetchedListings);
      // Seleziona 5 annunci casuali per la sezione "Annunci in evidenza"
      setFeaturedListings(getRandomListings(fetchedListings, 5));
      console.log(`Caricati ${fetchedListings.length} annunci`);
    } catch (error) {
      console.error('Errore nel caricamento degli annunci:', error);
      
      // Mostra un toast in caso di errore
      if (toast) {
        toast.show("Errore nel caricamento degli annunci", {
          type: "error",
          placement: "bottom",
          duration: 4000
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per selezionare annunci casuali
  const getRandomListings = (allListings, count) => {
    if (!allListings || allListings.length === 0) return [];
    
    const shuffled = [...allListings].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };
  
  // Gestisce la visibilità della tastiera
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Ottieni le categorie in base al tipo di ricerca selezionato
  const getCategorieBySearchType = () => {
    switch (searchType) {
      case 'affitto-turistico':
        return CATEGORIE_AFFITTO_TURISTICO;
      case 'vendita':
        return CATEGORIE_VENDITA;
      case 'affitto-classico':
      default:
        return CATEGORIE_AFFITTO_CLASSICO;
    }
  };
  
  // Handler per la ricerca
  const handleSearch = () => {
    // Se è stata selezionata una categoria, ma non è stata inserita una città/posizione
    if (selectedType && !searchLocation.trim()) {
      // Trova la categoria selezionata per ottenere nome e icona
      const categoria = getCategorieBySearchType().find(cat => cat.id === selectedType);
      
      // Naviga alla pagina dedicata della categoria
      navigation.navigate('CategoryResults', {
        categoryId: selectedType,
        categoryName: categoria?.nome || 'Categoria',
        categoryIcon: categoria?.icon || 'home',
        searchType: searchType // Aggiungi il tipo di ricerca per filtrare correttamente
      });
    } 
    // Se sono stati selezionati sia categoria che città/posizione
    else {
      // Naviga alla pagina di ricerca con filtri
      navigation.navigate('SearchStack', {
        screen: 'Search',
        params: {
          query: searchLocation,
          filters: {
            types: [selectedType],
            searchType: searchType // Aggiungi il tipo di ricerca per filtrare correttamente
          }
        }
      });
    }
  };
  
  // Handler per la pubblicazione annuncio
  const handlePubblicaAnnuncio = () => {
    navigation.navigate('PublishStack');
  };
  
  // Seleziona una tipologia
  const selezionaTipologia = (id) => {
    setSelectedType(id);
    setCategorieDropdownVisible(false);
  };

  // Renderizza un singolo annuncio in evidenza
  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.featuredImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.featuredImage} 
            resizeMode="cover"
          />
        ) : (
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x300/cccccc/333333?text=Annuncio+In%26Out' }} 
            style={styles.featuredImage} 
            resizeMode="cover"
          />
        )}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{item.price}€</Text>
        </View>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.featuredLocation} numberOfLines={1}>
          <Ionicons name="location" size={12} color={COLORS.textSecondary} /> 
          {item.city || item.address || 'Località non specificata'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBarManager barStyle="dark-content" backgroundColor="transparent" />
      
      {/* Header con logo */}
      <Header />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sezione ricerca con menu a tendina */}
        <View style={styles.idealistaSearch}>
          <Text style={styles.searchTitle}>
            Trova il tuo spazio
          </Text>
          
          {/* Aggiungo i pulsanti per il tipo di ricerca */}
          <View style={styles.searchTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.searchTypeButton, 
                searchType === 'affitto-classico' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('affitto-classico')}
            >
              <Text style={[
                styles.searchTypeText,
                searchType === 'affitto-classico' && styles.searchTypeTextActive
              ]}>
                Affitto classico
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.searchTypeButton, 
                searchType === 'affitto-turistico' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('affitto-turistico')}
            >
              <Text style={[
                styles.searchTypeText,
                searchType === 'affitto-turistico' && styles.searchTypeTextActive
              ]}>
                Affitto turistico
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.searchTypeButton, 
                searchType === 'vendita' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('vendita')}
            >
              <Text style={[
                styles.searchTypeText,
                searchType === 'vendita' && styles.searchTypeTextActive
              ]}>
                Vendita
              </Text>
            </TouchableOpacity>
          </View>
          
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchGradient}
          >
            <View style={styles.searchCard}>
              {/* Menu a tendina per le categorie */}
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setCategorieDropdownVisible(!categorieDropdownVisible)}
              >
                <View style={styles.dropdownSelectedContainer}>
                  <MaterialCommunityIcons
                    name={getCategorieBySearchType().find(cat => cat.id === selectedType)?.icon || 'home'}
                    size={24}
                    color={COLORS.primary}
                    style={styles.dropdownIcon}
                  />
                  <Text style={styles.dropdownSelectedText}>
                    {getCategorieBySearchType().find(cat => cat.id === selectedType)?.nome || 'Seleziona categoria'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={categorieDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
              
              {/* Modal per il menu a tendina */}
              <Modal
                transparent={true}
                visible={categorieDropdownVisible}
                animationType="fade"
                onRequestClose={() => setCategorieDropdownVisible(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setCategorieDropdownVisible(false)}
                >
                  <View style={[styles.dropdownMenu, {
                    top: Platform.OS === 'android' ? 
                      statusBarHeight + 190 : 190
                  }]}>
                    <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                      {getCategorieBySearchType().map((categoria) => (
                        <TouchableOpacity
                          key={categoria.id}
                          style={[
                            styles.dropdownItem,
                            selectedType === categoria.id && styles.dropdownItemSelected
                          ]}
                          onPress={() => selezionaTipologia(categoria.id)}
                        >
                          <MaterialCommunityIcons
                            name={categoria.icon}
                            size={24}
                            color={selectedType === categoria.id ? COLORS.primary : COLORS.textSecondary}
                            style={styles.dropdownItemIcon}
                          />
                          <Text style={[
                            styles.dropdownItemText,
                            selectedType === categoria.id && styles.dropdownItemTextSelected
                          ]}>
                            {categoria.nome}
                          </Text>
                          {selectedType === categoria.id && (
                            <AntDesign name="check" size={18} color={COLORS.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
              
              {/* Campo ricerca location */}
              <View style={styles.locationInputWrapper}>
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Città, quartiere, indirizzo..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={searchLocation}
                  onChangeText={setSearchLocation}
                />
              </View>
              
              {/* Bottone Cerca */}
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Text style={styles.searchButtonText}>
                  CERCA
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        
        {/* Bottone Pubblica Annuncio */}
        <TouchableOpacity 
          style={styles.pubblicaButton}
          onPress={handlePubblicaAnnuncio}
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pubblicaGradient}
          >
            <FontAwesome5 name="plus" size={16} color={COLORS.black} style={styles.pubblicaIcon} />
            <Text style={styles.pubblicaButtonText}>
              Pubblica il tuo annuncio
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Categorie principali */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>
            Categorie popolari
          </Text>
          
          <View style={styles.categoriesGrid}>
            {/* Quattro categorie con colori diversi */}
            {TIPOLOGIE_ALLOGGIO.map((tipo, index) => {
              // Colori migliorati per categorie con maggiore contrasto
              const backgroundColors = [
                '#7B2CBF', // COLORS.primary
                '#E6A817', // Orange più scuro
                '#3A86FF', // Blu più vibrante
                '#2DC653'  // Verde più vivace
              ];
              
              return (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.categoryCard, 
                    { backgroundColor: backgroundColors[index % backgroundColors.length] }
                  ]}
                  onPress={() => {
                    // Navigate to CategoryResults screen with the category information
                    navigation.navigate('CategoryResults', {
                      categoryId: tipo.id,
                      categoryName: tipo.nome,
                      categoryIcon: tipo.icon
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tipo.icon as any}
                    size={40}
                    color={COLORS.white}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryText}>
                    {tipo.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Annunci in evidenza */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>
            Annunci in evidenza
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Caricamento annunci...</Text>
            </View>
          ) : featuredListings.length > 0 ? (
            <FlatList
              data={featuredListings}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredListContainer}
            />
          ) : (
            <View style={styles.noFeaturedContainer}>
              <MaterialIcons name="search-off" size={40} color={COLORS.grey} />
              <Text style={styles.noFeaturedText}>Nessun annuncio disponibile</Text>
            </View>
          )}
        </View>
        
        {/* Sezione Abbonamenti */}
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionBtnContainer}>
            <Text style={styles.subscriptionTitle}>Vuoi più visibilità per i tuoi annunci?</Text>
            <Text style={styles.subscriptionSubtitle}>Scopri i nostri piani di abbonamento</Text>
            <TouchableOpacity 
              style={styles.subscriptionButton}
              onPress={() => navigation.navigate('PlansStack', { screen: 'Plans' })}
            >
              <Text style={styles.subscriptionButtonText}>Scopri i nostri piani</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aggiunto spazio in fondo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Aumentato per evitare sovrapposizioni con la tab bar
  },
  searchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  searchTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  searchTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  searchTypeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  searchTypeTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  idealistaSearch: {
    marginBottom: 30, // Aumentato lo spazio inferiore
  },
  searchGradient: {
    borderRadius: 16,
    padding: 3, // Bordo del gradiente
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Stili per il menu a tendina
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownMenu: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 50, // Altezza fissa per uniformità
  },
  locationIconContainer: {
    padding: 12,
  },
  locationInput: {
    flex: 1,
    height: 50,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingRight: 10, // Evita che il testo tocchi il bordo destro
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,            // Aggiunta ombra per risalto
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pubblicaButton: {
    borderRadius: 50,
    marginBottom: 40,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  pubblicaGradient: {
    flexDirection: 'row',
    padding: 18, // Aumentato padding per un pulsante più grande
    alignItems: 'center',
    justifyContent: 'center',
  },
  pubblicaIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  pubblicaButtonText: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriesSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24, // Aumentato
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 50) / 2, // Aumentato lo spazio tra le card
    height: 130,            // Aumentato l'altezza
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,       // Aumentato lo spazio in basso
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,          // Aumentata l'ombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryIcon: {
    marginBottom: 12,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 18,           // Aumentato dimensione testo
    fontWeight: 'bold',     // Testo in grassetto per maggiore leggibilità
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Stili per la sezione "Annunci in evidenza"
  featuredSection: {
    marginBottom: 30,
  },
  featuredListContainer: {
    paddingRight: 20,
  },
  featuredCard: {
    width: 220,
    marginRight: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopLeftRadius: 10,
  },
  priceText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  featuredLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  noFeaturedContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
  },
  noFeaturedText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  bottomSpacer: {
    height: 80, // Spazio extra in fondo al contenuto
  },
  subscriptionSection: {
    marginBottom: 30,
  },
  subscriptionBtnContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 5,
    marginTop: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.textSecondary,
  },
  subscriptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  subscriptionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 