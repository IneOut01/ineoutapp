import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  ProgressBarAndroid
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebaseConfig';
import { publishListing } from '../hooks/usePublishListing';
import { PublishListingFormData, publishListingSchema } from '../schemas/publishListingSchema';
import { uploadMultipleImages, ImageValidationError } from '../services/storageService';
import { generateTitle, generateDescription } from '../services/openaiService';
import { COLORS } from '../theme/colors';
import { allCities } from '../data/cities';
import { Modalize } from 'react-native-modalize';
import { Menu, Button } from 'react-native-paper';
import PlacesInput from '../components/PlacesInput';
import { PlacePrediction } from '../types/placePrediction';
import PlacesService from '../services/PlacesService';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from '../contexts/LanguageContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Trovo i testi in inglese e li traduco in italiano

// Modifica della costante per i tipi di proprietà
const propertyTypes = [
  { value: 'stanza', label: 'Stanza' },
  { value: 'bilocale', label: 'Bilocale' },
  { value: 'monolocale', label: 'Monolocale' },
  { value: 'studio', label: 'Studio/Ufficio' }
];

// Aggiungo la costante per i tipi di contratto
const tipiContratto = [
  { id: 'breve_termine', nome: 'Breve termine (giorni/settimane)' },
  { id: 'transitorio_1', nome: 'Transitorio 1 mese' },
  { id: 'transitorio_3', nome: 'Transitorio 3 mesi' },
  { id: 'transitorio_6', nome: 'Transitorio 6 mesi' },
  { id: 'transitorio_12', nome: 'Transitorio 12 mesi' },
  { id: 'transitorio_18', nome: 'Transitorio 18 mesi' },
  { id: 'anni_2_2', nome: 'Contratto 2+2 anni' },
  { id: 'anni_3_2', nome: 'Contratto 3+2 anni' },
  { id: 'anni_4_4', nome: 'Contratto 4+4 anni' },
  { id: 'turistico', nome: 'Alloggio turistico' },
];

const PublishListingScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [openCityDropdown, setOpenCityDropdown] = useState(false);
  const [openTypeDropdown, setOpenTypeDropdown] = useState(false);
  const [openMonthsDropdown, setOpenMonthsDropdown] = useState(false);
  const cityModalizeRef = useRef<Modalize>(null);
  const typeModalizeRef = useRef<Modalize>(null);
  const monthsModalizeRef = useRef<Modalize>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<{index: number, progress: number}[]>([]);
  // Aggiungo stato per il tipo contratto
  const [tipoContratto, setTipoContratto] = useState('transitorio_12');
  
  // Setup react-hook-form con validazione Yup
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<PublishListingFormData>({
    resolver: yupResolver(publishListingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: undefined,
      m2: undefined,
      months: 1,
      city: '',
      type: 'stanza',
      images: []
    }
  });
  
  // Accesso ai valori attuali del form (per generazione ChatGPT)
  const watchedType = watch('type');
  const watchedCity = watch('city');
  const watchedPrice = watch('price');
  const watchedM2 = watch('m2');
  const watchedMonths = watch('months');
  
  // Filtra le città in base all'input
  const [cityFilter, setCityFilter] = useState('');
  const filteredCities = cityFilter 
    ? allCities.filter(city => city.toLowerCase().includes(cityFilter.toLowerCase()))
    : allCities;
  
  // Seleziona il numero di mesi da 1 a 12
  const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Stati per l'indirizzo
  const [address, setAddress] = useState('');
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  
  // Apertura e chiusura dei modals
  const openCityModal = () => {
    cityModalizeRef.current?.open();
  };

  const openTypeModal = () => {
    typeModalizeRef.current?.open();
  };

  const openMonthsModal = () => {
    monthsModalizeRef.current?.open();
  };
  
  // Funzione per selezionare immagini dalla galleria
  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite raggiunto', 'Non puoi caricare più di 5 immagini');
      return;
    }
    
    try {
      // Richiedi permesso per accedere alla galleria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'È necessario concedere il permesso per accedere alla galleria');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });
      
      if (!result.canceled && result.assets) {
        // Verifica la dimensione delle immagini (max 5MB)
        const validImages = await Promise.all(
          result.assets.map(async (asset) => {
            try {
              // Verifica che il file sia un'immagine
              if (!asset.type || !asset.type.startsWith('image/')) {
                Alert.alert('File non valido', `${asset.fileName || 'Il file'} non è un'immagine valida`);
                return null;
              }
              
              const fileInfo = await fetch(asset.uri).then(res => {
                const contentLength = res.headers.get('content-length');
                return {
                  size: contentLength ? parseInt(contentLength) : 0,
                  type: asset.type || 'image/jpeg'
                };
              });
              
              const fileSizeInMB = fileInfo.size / (1024 * 1024);
              
              if (fileSizeInMB > 5) {
                Alert.alert('Immagine troppo grande', `L'immagine ${asset.fileName || 'selezionata'} supera il limite di 5MB`);
                return null;
              }
              
              return asset.uri;
            } catch (error) {
              console.error('Errore validazione immagine:', error);
              return null;
            }
          })
        );
        
        // Filtra le immagini valide
        const newImages = validImages.filter(uri => uri !== null) as string[];
        
        // Aggiungi le nuove immagini all'array esistente
        if (newImages.length > 0) {
          const updatedImages = [...images, ...newImages];
          
          // Limita a 5 immagini massimo
          const limitedImages = updatedImages.slice(0, 5);
          
          setImages(limitedImages);
          setValue('images', limitedImages);
        }
      }
    } catch (error) {
      console.error('Errore durante la selezione delle immagini:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la selezione delle immagini');
    }
  };
  
  // Rimuove un'immagine dalla raccolta
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
    setValue('images', updatedImages);
  };
  
  // Funzione per scattare una foto con la fotocamera
  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite raggiunto', 'Non puoi caricare più di 5 immagini');
      return;
    }
    
    try {
      // Richiedi permesso per accedere alla fotocamera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'È necessario concedere il permesso per accedere alla fotocamera');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          const asset = result.assets[0];
          const fileInfo = await fetch(asset.uri).then(res => {
            const contentLength = res.headers.get('content-length');
            return {
              size: contentLength ? parseInt(contentLength) : 0,
              type: asset.type || 'image/jpeg'
            };
          });
          
          const fileSizeInMB = fileInfo.size / (1024 * 1024);
          
          if (fileSizeInMB > 5) {
            Alert.alert('Immagine troppo grande', 'La foto scattata supera il limite di 5MB');
            return;
          }
          
          // Aggiungi la nuova immagine all'array esistente
          const updatedImages = [...images, asset.uri];
          setImages(updatedImages);
          setValue('images', updatedImages);
        } catch (error) {
          console.error('Errore validazione foto:', error);
          Alert.alert('Errore', 'Si è verificato un errore durante la validazione della foto');
        }
      }
    } catch (error) {
      console.error('Errore durante l\'acquisizione della foto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'acquisizione della foto');
    }
  };
  
  // Genera titolo con ChatGPT
  const handleGenerateTitle = async () => {
    // Verifica che ci siano dati sufficienti per generare un titolo
    if (!watchedType || !watchedCity || !watchedPrice || !watchedM2) {
      Alert.alert('Dati insufficienti', 'Compila tipo di immobile, città, prezzo e metri quadri prima di generare un titolo');
      return;
    }
    
    setIsGeneratingTitle(true);
    
    try {
      const generatedTitle = await generateTitle(
        watchedType,
        watchedCity,
        watchedPrice,
        watchedM2
      );
      
      if (generatedTitle) {
        setValue('title', generatedTitle);
      } else {
        Alert.alert('Errore', 'Non è stato possibile generare un titolo. Riprova più tardi.');
      }
    } catch (error) {
      console.error('Errore durante la generazione del titolo:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la generazione del titolo');
    } finally {
      setIsGeneratingTitle(false);
    }
  };
  
  // Genera descrizione con ChatGPT
  const handleGenerateDescription = async () => {
    // Verifica che ci siano dati sufficienti per generare una descrizione
    if (!watchedType || !watchedCity || !watchedPrice || !watchedM2 || !watchedMonths) {
      Alert.alert('Dati insufficienti', 'Compila tutti i campi prima di generare una descrizione');
      return;
    }
    
    setIsGeneratingDescription(true);
    
    try {
      const generatedDescription = await generateDescription(
        watchedType,
        watchedCity,
        watchedPrice,
        watchedM2,
        watchedMonths
      );
      
      if (generatedDescription) {
        setValue('description', generatedDescription);
      } else {
        Alert.alert('Errore', 'Non è stato possibile generare una descrizione. Riprova più tardi.');
      }
    } catch (error) {
      console.error('Errore durante la generazione della descrizione:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la generazione della descrizione');
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  
  // Funzione per gestire la selezione dell'indirizzo
  const handlePlaceSelected = async (place: PlacePrediction, details?: any) => {
    setAddress(place.description);
    
    if (details) {
      setPlaceDetails(details);
      
      // Estrai coordinate
      if (details.geometry?.location) {
        const { lat, lng } = details.geometry.location;
        setValue('latitude', lat);
        setValue('longitude', lng);
      }
      
      // Estrai componenti dell'indirizzo
      if (details.address_components) {
        let city = '';
        let state = '';
        let postalCode = '';
        
        details.address_components.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });
        
        // Aggiorna il formData con le informazioni estratte
        setValue('city', city);
        setValue('state', state);
        setValue('postalCode', postalCode);
      }
    }
  };
  
  // Gestisce l'invio del form
  const onSubmit = async (data: PublishListingFormData) => {
    if (!auth.currentUser) {
      Alert.alert('Errore', 'Devi essere autenticato per pubblicare un annuncio');
      return;
    }
    
    if (images.length === 0) {
      Alert.alert('Immagini mancanti', 'Carica almeno un\'immagine prima di pubblicare');
      return;
    }
    
    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);
    setImageUploadStatus(images.map((_, index) => ({ index, progress: 0 })));
    
    try {
      // Upload immagini su Firebase Storage
      const uid = auth.currentUser.uid;
      const uploadPath = `announcements/${uid}`;
      
      // Carica le immagini con gestione dell'avanzamento
      const imageUrls = await uploadMultipleImages(
        images, 
        uploadPath,
        (totalProgress) => {
          setUploadProgress(totalProgress);
        },
        (index, progress) => {
          setImageUploadStatus(prev => {
            const newStatus = [...prev];
            const statusIndex = newStatus.findIndex(s => s.index === index);
            if (statusIndex !== -1) {
              newStatus[statusIndex].progress = progress;
            }
            return newStatus;
          });
        }
      );
      
      setIsUploading(false);
      
      // Preparazione dati da inviare
      const listingData = {
        title: data.title,
        description: data.description,
        price: data.price!,
        m2: data.m2!,
        months: data.months!,
        city: data.city,
        type: data.type,
        images: imageUrls,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        state: data.state,
        postalCode: data.postalCode,
        tipoContratto: tipoContratto,
      };
      
      // Pubblica annuncio
      const result = await publishListing(uid, listingData);
      
      if (result.success) {
        Alert.alert(
          'Successo',
          'Il tuo annuncio è stato pubblicato!',
          [{ text: 'OK', onPress: () => navigation.navigate('HomeStack' as never) }]
        );
      } else if (result.error === 'plan_required') {
        Alert.alert(
          'Piano richiesto',
          'Hai raggiunto il limite di annunci gratuiti. Vuoi sottoscrivere un piano per pubblicare altri annunci?',
          [
            { text: 'No grazie', style: 'cancel' },
            { text: 'Vedi piani', onPress: () => navigation.navigate('PlansStack', { needed: true } as never) }
          ]
        );
      } else {
        Alert.alert('Errore', 'Si è verificato un errore durante la pubblicazione dell\'annuncio');
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Errore durante la pubblicazione:', error);
      
      let errorMessage = 'Si è verificato un errore durante la pubblicazione dell\'annuncio';
      
      if (error instanceof ImageValidationError) {
        errorMessage = error.message;
      }
      
      Alert.alert('Errore', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Città Modalize content
  const renderCityContent = () => {
    return (
      <View style={styles.modalContent}>
        <TextInput
          style={styles.modalSearchInput}
          placeholder="Cerca città..."
          value={cityFilter}
          onChangeText={setCityFilter}
        />
        <ScrollView style={{ maxHeight: 300 }}>
          {filteredCities.map((city, index) => (
            <TouchableOpacity
              key={index}
              style={styles.modalItem}
              onPress={() => {
                setValue('city', city);
                cityModalizeRef.current?.close();
              }}
            >
              <Text style={styles.modalItemText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Type Modalize content
  const renderTypeContent = () => {
    return (
      <View style={styles.modalContent}>
        <ScrollView>
          {propertyTypes.map((type, index) => (
            <TouchableOpacity
              key={index}
              style={styles.modalItem}
              onPress={() => {
                setValue('type', type.value);
                typeModalizeRef.current?.close();
              }}
            >
              <Text style={styles.modalItemText}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Months Modalize content
  const renderMonthsContent = () => {
    return (
      <View style={styles.modalContent}>
        <ScrollView>
          {monthOptions.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={styles.modalItem}
              onPress={() => {
                setValue('months', parseInt(month, 10));
                monthsModalizeRef.current?.close();
              }}
            >
              <Text style={styles.modalItemText}>{`${month} mese/i`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Handle map ready event
  const handleMapReady = () => {
    setIsMapReady(true);
  };

  // Componente per la visualizzazione dell'avanzamento
  const ProgressBar = ({ progress }: { progress: number }) => {
    return Platform.OS === 'android' 
      ? <ProgressBarAndroid styleAttr="Horizontal" progress={progress / 100} color={COLORS.primary} /> 
      : null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pubblica Annuncio</Text>
      </View>
      
      {/* Overlay di caricamento */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          {isUploading ? (
            <View style={styles.uploadProgressContainer}>
              <Text style={styles.uploadProgressTitle}>Caricamento immagini...</Text>
              <ProgressBar progress={uploadProgress} />
              <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Pubblicazione in corso...</Text>
            </>
          )}
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Titolo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Titolo</Text>
              <View style={styles.inputWithButton}>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[styles.input, errors.title && styles.inputError]}
                      placeholder="Titolo dell'annuncio"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateTitle}
                  disabled={isGeneratingTitle}
                  activeOpacity={0.8}
                >
                  {isGeneratingTitle ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
            </View>
            
            {/* Città */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Città</Text>
              <Controller
                control={control}
                name="city"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity 
                    style={[styles.selectButton, errors.city && styles.inputError]}
                    onPress={openCityModal}
                    activeOpacity={0.8}
                  >
                    <Text style={value ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                      {value || "Seleziona città"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
            </View>
            
            {/* Tipo di immobile */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo di immobile</Text>
              <Controller
                control={control}
                name="type"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity 
                    style={[styles.selectButton, errors.type && styles.inputError]}
                    onPress={openTypeModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectButtonText}>
                      {propertyTypes.find(t => t.value === value)?.label || "Seleziona tipo"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              />
              {errors.type && <Text style={styles.errorText}>{errors.type.message}</Text>}
            </View>
            
            {/* Prezzo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prezzo (€/mese)</Text>
              <Controller
                control={control}
                name="price"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    placeholder="Prezzo mensile"
                    value={value?.toString()}
                    onChangeText={(text) => onChange(text === '' ? undefined : Number(text))}
                    onBlur={onBlur}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
            </View>
            
            {/* Metri quadri */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Metri² (mq)</Text>
              <Controller
                control={control}
                name="m2"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.m2 && styles.inputError]}
                    placeholder="Metri quadri"
                    value={value?.toString()}
                    onChangeText={(text) => onChange(text === '' ? undefined : Number(text))}
                    onBlur={onBlur}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.m2 && <Text style={styles.errorText}>{errors.m2.message}</Text>}
            </View>
            
            {/* Durata minima (mesi) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Durata minima (mesi)</Text>
              <Controller
                control={control}
                name="months"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity 
                    style={[styles.selectButton, errors.months && styles.inputError]}
                    onPress={openMonthsModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectButtonText}>
                      {value ? `${value} mese/i` : "Seleziona durata"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              />
              {errors.months && <Text style={styles.errorText}>{errors.months.message}</Text>}
            </View>
            
            {/* Tipo di contratto */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo di contratto</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tipoContratto}
                  onValueChange={(itemValue) => setTipoContratto(itemValue)}
                  style={styles.picker}
                >
                  {tipiContratto.map((tipo) => (
                    <Picker.Item key={tipo.id} label={tipo.nome} value={tipo.id} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* Descrizione */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrizione</Text>
              <View style={styles.inputWithButton}>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[styles.textArea, errors.description && styles.inputError]}
                      placeholder="Descrizione dettagliata dell'immobile"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                  )}
                />
                <TouchableOpacity
                  style={[styles.generateButton, { top: 10 }]}
                  onPress={handleGenerateDescription}
                  disabled={isGeneratingDescription}
                  activeOpacity={0.8}
                >
                  {isGeneratingDescription ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>
            
            {/* Immagini */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Immagini ({images.length}/5)</Text>
              <Text style={styles.sublabel}>Carica da 1 a 5 immagini, massimo 5MB ciascuna</Text>
              
              <View style={styles.imagesContainer}>
                {/* Miniature delle immagini caricate */}
                {images.map((image, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Pulsanti di caricamento immagini */}
                {images.length < 5 && (
                  <View style={styles.imageButtonsContainer}>
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={pickImages}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="image-plus" size={24} color={COLORS.primary} />
                      <Text style={styles.addImageText}>Galleria</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={takePhoto}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                      <Text style={styles.addImageText}>Fotocamera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {errors.images && <Text style={styles.errorText}>{errors.images.message}</Text>}
            </View>
            
            {/* Sezione indirizzo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('publishListing.locationInfo')}</Text>
              
              <Text style={styles.label}>{t('publishListing.address')}</Text>
              <PlacesInput
                placeholder={t('publishListing.enterAddress')}
                onPlaceSelected={handlePlaceSelected}
                initialValue={address}
                countryRestrict="it"
                useUserLocation={true}
                types={['address']}
                fetchDetails={true}
              />
              
              {/* Mostra mappa se le coordinate sono disponibili */}
              {watch('latitude') && watch('longitude') ? (
                <View style={styles.mapContainer}>
                  {isMapReady || Platform.OS === 'ios' ? (
                    <MapView
                      ref={mapRef}
                      style={styles.map}
                      initialRegion={{
                        latitude: watch('latitude'),
                        longitude: watch('longitude'),
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      onMapReady={handleMapReady}
                    >
                      {isMapReady && (
                        <Marker
                          coordinate={{
                            latitude: watch('latitude'),
                            longitude: watch('longitude'),
                          }}
                        />
                      )}
                    </MapView>
                  ) : (
                    <View style={styles.map} />
                  )}
                </View>
              ) : null}
            </View>
            
            {/* Pulsante Pubblica */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Pubblica Annuncio</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modalize per la selezione città */}
      <Modalize
        ref={cityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalizeContainer}
        HeaderComponent={
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Seleziona città</Text>
          </View>
        }
      >
        {renderCityContent()}
      </Modalize>

      {/* Modalize per la selezione tipo */}
      <Modalize
        ref={typeModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalizeContainer}
        HeaderComponent={
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Seleziona tipo di immobile</Text>
          </View>
        }
      >
        {renderTypeContent()}
      </Modalize>

      {/* Modalize per la selezione mesi */}
      <Modalize
        ref={monthsModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalizeContainer}
        HeaderComponent={
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Seleziona durata minima</Text>
          </View>
        }
      >
        {renderMonthsContent()}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  generateButton: {
    position: 'absolute',
    right: 10,
    height: 36,
    width: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 50,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  selectButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectButtonPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    margin: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 16,
    fontSize: 16,
  },
  modalizeContainer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 1100,
  },
  modalHeader: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 15,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalSearchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
    fontSize: 16,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  mapContainer: {
    height: 200,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  addImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  uploadProgressContainer: {
    width: '80%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.textPrimary,
  },
  uploadProgressText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formGroup: {
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  picker: {
    width: '100%',
    height: 50,
  },
});

export default PublishListingScreen; 