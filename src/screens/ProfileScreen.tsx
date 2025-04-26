import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from '../contexts/LanguageContext';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { auth, storage, db } from '../config/firebaseConfig';
import { signOut, updateProfile } from 'firebase/auth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import SeedListingsButton from '../components/SeedListingsButton';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { useToast } from 'react-native-toast-notifications';
import { AccessibilityInfo } from 'react-native';

// Definisco un'interfaccia estesa per le opzioni del toast che includa onShow
interface ExtendedToastOptions {
  type?: string;
  duration?: number;
  style?: object;
  textStyle?: object;
  onShow?: () => void;
}

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated, isGuest, exitGuestMode, refreshUserData } = useAuth();
  const { modalVisible, authRequiredMessage, canAccess, closeModal } = useAuthGuard();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const toast = useToast();

  // Controlla se l'abbonamento è stato aggiornato dai parametri di navigazione
  const subscriptionUpdated = route.params?.subscriptionUpdated;

  useEffect(() => {
    // Recupera i dati dell'utente dal Firestore
    const getUserData = async () => {
      if (!user || isGuest) {
        setUserData(null);
        return;
      }

      try {
        if (!db) {
          console.error('Firestore not initialized');
          return;
        }
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          
          if (userSnap.data()?.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          console.log('Nessun documento utente trovato');
          setUserData(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Errore recupero dati utente:', error);
        setUserData(null);
        setIsAdmin(false);
      }
    };

    getUserData();
  }, [user, isGuest]);

  // Recupera i dati dell'abbonamento
  useEffect(() => {
    const getSubscriptionData = async () => {
      if (!user || isGuest) {
        setSubscription(null);
        return;
      }

      setLoadingSubscription(true);
      try {
        const activeSubscription = await subscriptionService.getActiveSubscription();
        setSubscription(activeSubscription);
      } catch (error) {
        console.error('Errore nel recupero dell\'abbonamento:', error);
        setSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    getSubscriptionData();
    
    // Se l'abbonamento è stato aggiornato, mostra un messaggio di successo
    if (subscriptionUpdated) {
      Alert.alert(
        'Abbonamento attivato',
        'Il tuo abbonamento è stato attivato con successo!',
        [{ text: 'OK' }]
      );
    }
  }, [user, isGuest, subscriptionUpdated]);

  // Effettua il logout
  const handleLogout = async () => {
    try {
      if (isGuest) {
        // In modalità ospite, termina la sessione ospite
        exitGuestMode();
      } else {
        // Utente autenticato normalmente, effettua il logout da Firebase
        await signOut(auth);
      }
      
      // Naviga alla schermata di login dopo il logout
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il logout');
    }
  };

  // Verifica l'accesso a una funzionalità riservata
  const checkFeatureAccess = (featureName: string) => {
    return canAccess(`Per accedere a "${featureName}" devi effettuare l'accesso.`);
  };

  // Gestisce la selezione dell'immagine di profilo
  const handleImageSelection = async () => {
    setImagePickerVisible(false);
    
    // Richiedi permessi per accedere alla galleria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'È necessario concedere i permessi per accedere alla galleria.');
      return;
    }
    
    // Apri il selettore di immagini
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Gestisci la presa di una foto con la fotocamera
  const handleTakePhoto = async () => {
    setImagePickerVisible(false);
    
    // Richiedi permessi per accedere alla fotocamera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'È necessario concedere i permessi per accedere alla fotocamera.');
      return;
    }
    
    // Apri la fotocamera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Carica l'immagine del profilo su Firebase Storage
  const uploadProfileImage = async (uri) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Ridimensiona l'immagine prima del caricamento per garantire successo
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 400 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      // Usa l'URI dell'immagine ridimensionata
      const optimizedUri = manipResult.uri;
      
      // Converti URI in blob
      const response = await fetch(optimizedUri);
      const blob = await response.blob();
      
      // Crea un riferimento al file in Firebase Storage con timestamp per evitare problemi di cache
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `profile_images/${user.uid}_${timestamp}`);
      
      // Carica il file con monitoraggio del progresso
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Gestisci il processo di caricamento
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          // Monitoraggio del progresso (opzionale)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload in corso: ' + progress.toFixed(2) + '%');
        },
        (error) => {
          // Gestione errori
          console.error('Errore durante l\'upload:', error);
          setUploading(false);
          Alert.alert('Errore', 'Si è verificato un errore durante il caricamento dell\'immagine');
        },
        async () => {
          // Caricamento completato con successo
          try {
            // Ottieni l'URL di download
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Aggiorna il profilo dell'utente
            await updateProfile(user, { photoURL: downloadURL });
            
            // Aggiorna anche il documento utente in Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
              photoURL: downloadURL,
              lastUpdated: serverTimestamp()
            });
            
            // Aggiorna lo stato locale
            refreshUserData();
            
            Alert.alert('Successo', 'Immagine del profilo aggiornata con successo!');
          } catch (err) {
            console.error('Errore aggiornamento profilo:', err);
            Alert.alert('Errore', 'Immagine caricata ma non è stato possibile aggiornare il profilo');
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Errore preparazione immagine:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la preparazione dell\'immagine');
      setUploading(false);
    }
  };

  // Funzione per disdire l'abbonamento
  const handleCancelSubscription = () => {
    Alert.alert(
      'Disdici abbonamento',
      'Sei sicuro di voler disdire il tuo abbonamento? Questa azione non può essere annullata.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Disdici',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingSubscription(true);
              
              const success = await subscriptionService.cancelSubscription();
              
              if (success) {
                // Mostra messaggio di successo
                toast.show('Abbonamento disdetto con successo.', {
                  type: 'success',
                  duration: 4000,
                  style: { backgroundColor: COLORS.success },
                  textStyle: { color: COLORS.white }
                } as ExtendedToastOptions);
                
                // Annuncio accessibilità
                AccessibilityInfo.announceForAccessibility('Abbonamento disdetto con successo.');
                
                // Aggiorna lo stato locale per riflettere la disdetta
                setSubscription(null);
              } else {
                // Mostra messaggio di errore
                toast.show('Impossibile disdire l\'abbonamento al momento. Riprova più tardi.', {
                  type: 'danger',
                  duration: 4000,
                  style: { backgroundColor: COLORS.danger },
                  textStyle: { color: COLORS.white }
                } as ExtendedToastOptions);
                
                // Annuncio accessibilità
                AccessibilityInfo.announceForAccessibility('Errore. Impossibile disdire l\'abbonamento al momento.');
              }
            } catch (error) {
              console.error('Errore nella disdetta dell\'abbonamento:', error);
              
              // Mostra messaggio di errore
              toast.show('Impossibile disdire l\'abbonamento al momento. Riprova più tardi.', {
                type: 'danger',
                duration: 4000,
                style: { backgroundColor: COLORS.danger },
                textStyle: { color: COLORS.white }
              } as ExtendedToastOptions);
              
              // Annuncio accessibilità
              AccessibilityInfo.announceForAccessibility('Errore. Impossibile disdire l\'abbonamento al momento.');
            } finally {
              setCancellingSubscription(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderSettingsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impostazioni</Text>
        
        {/* My Listings Button */}
        {user && !isGuest && (
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('MyListings')}
          >
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>I miei annunci</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#BDBDBD" />
            </View>
          </TouchableOpacity>
        )}

        {/* Favorites Button */}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            if (user && !isGuest) {
              navigation.navigate('FavoritesStack');
            } else {
              setShowAuthModal(true);
            }
          }}
        >
          <View style={styles.settingIcon}>
            <MaterialCommunityIcons name="heart-outline" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Preferiti</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BDBDBD" />
          </View>
        </TouchableOpacity>
        
        {/* Notifications Button */}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.settingIcon}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#4FB0FF" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Notifiche</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BDBDBD" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizza la sezione dell'abbonamento
  const renderSubscriptionSection = () => {
    if (isGuest) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abbonamento</Text>
        
        <View style={styles.subscriptionCard}>
          {loadingSubscription ? (
            <View style={styles.subscriptionLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.subscriptionLoadingText}>Caricamento abbonamento...</Text>
            </View>
          ) : subscription ? (
            <>
              <View style={styles.subscriptionHeader}>
                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                <Text style={styles.subscriptionTitle}>{subscription.planTitle}</Text>
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionBadgeText}>Attivo</Text>
                </View>
              </View>
              
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionDescription}>{subscription.planDescription}</Text>
                <Text style={styles.subscriptionPrice}>{subscription.planPrice}</Text>
              </View>
              
              <View style={styles.subscriptionActions}>
                <TouchableOpacity 
                  style={styles.subscriptionButton}
                  onPress={() => navigation.navigate('PlansStack')}
                >
                  <Text style={styles.subscriptionButtonText}>Cambia piano</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.cancelSubscriptionButton, cancellingSubscription && styles.disabledButton]}
                  onPress={handleCancelSubscription}
                  disabled={cancellingSubscription}
                  accessibilityLabel="Disdici abbonamento"
                  accessibilityHint="Disdice l'abbonamento attivo"
                >
                  {cancellingSubscription ? (
                    <View style={styles.buttonLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.danger} />
                    </View>
                  ) : (
                    <Text style={styles.cancelSubscriptionText}>Disdici abbonamento</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.noSubscriptionContainer}>
                <MaterialCommunityIcons name="crown-outline" size={40} color={COLORS.grey} />
                <Text style={styles.noSubscriptionText}>Nessun abbonamento attivo</Text>
                <Text style={styles.noSubscriptionSubtext}>Attiva un abbonamento per pubblicare più annunci e accedere a funzionalità esclusive.</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.subscriptionButton}
                onPress={() => navigation.navigate('PlansStack')}
              >
                <Text style={styles.subscriptionButtonText}>Visualizza piani</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? getStatusBarHeight() : 0 }]}>
        <Text style={styles.headerTitle}>{isGuest ? 'Modalità Ospite' : 'Profilo'}</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Sezione profilo */}
        <View style={styles.profileSection}>
          {isGuest ? (
            // Avatar ospite
            <View style={[styles.avatarContainer, styles.guestAvatarContainer]}>
              <MaterialCommunityIcons name="account-question" size={60} color={COLORS.grey} />
            </View>
          ) : (
            // Avatar utente normale
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setImagePickerVisible(true)}
            >
              {user?.photoURL ? (
                <>
                  <Image 
                    source={{ uri: user.photoURL }} 
                    style={styles.avatar} 
                  />
                  <View style={styles.editAvatarOverlay}>
                    <MaterialCommunityIcons name="camera" size={24} color={COLORS.white} />
                  </View>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="account-circle" size={80} color={COLORS.primary} />
                  <View style={styles.editAvatarOverlay}>
                    <MaterialCommunityIcons name="camera" size={24} color={COLORS.white} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <Text style={styles.displayName}>
            {isGuest 
              ? 'Utente Ospite' 
              : (userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Utente')}
          </Text>
          
          {isGuest ? (
            <Text style={styles.emailText}>
              Hai accesso limitato. Accedi per sbloccare tutte le funzionalità.
            </Text>
          ) : (
            <Text style={styles.emailText}>{user?.email || ''}</Text>
          )}
          
          {/* Pulsanti azioni profilo */}
          <View style={styles.actionButtons}>
            {isGuest ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.loginButton]}
                  onPress={() => navigation.navigate('Login' as never)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="login" size={20} color={COLORS.white} />
                  <Text style={styles.loginButtonText}>Accedi</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.registerButton]}
                  onPress={() => navigation.navigate('Signup' as never)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.primary} />
                  <Text style={styles.registerButtonText}>Registrati</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Funzionalità in arrivo', 'La modifica del profilo sarà disponibile presto.')}
              >
                <MaterialCommunityIcons name="account-edit" size={20} color={COLORS.primary} />
                <Text style={styles.editButtonText}>Modifica profilo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Sezione abbonamento */}
        {!isGuest && renderSubscriptionSection()}
        
        {/* Sezione impostazioni */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isGuest ? 'Funzionalità limitate' : 'Il mio account'}
          </Text>
          
          <View style={styles.settingsContainer}>
            {/* I miei annunci */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => {
                if (isGuest) {
                  checkFeatureAccess('I miei preferiti');
                } else if (isAuthenticated && user) {
                  // Se l'utente è autenticato, vai direttamente alla schermata dei preferiti
                  navigation.navigate('FavoritesStack' as never);
                } else {
                  // Se non è autenticato né guest, mostra il messaggio di autenticazione richiesta
                  checkFeatureAccess('I miei preferiti');
                }
              }}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={[
                styles.settingLabel,
                isGuest && styles.disabledFeature
              ]}>
                I miei preferiti
              </Text>
              {isGuest && (
                <MaterialCommunityIcons name="lock" size={20} color={COLORS.grey} style={styles.lockIcon} />
              )}
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {/* Abbonamento */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => {
                if(!isGuest) {
                  navigation.navigate('Subscription' as never);
                } else {
                  checkFeatureAccess('Abbonamento');
                }
              }}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="star" size={24} color={COLORS.primary} />
              </View>
              <Text style={[
                styles.settingLabel,
                isGuest && styles.disabledFeature
              ]}>
                Abbonamento
              </Text>
              {isGuest && (
                <MaterialCommunityIcons name="lock" size={20} color={COLORS.grey} style={styles.lockIcon} />
              )}
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {/* Metodi di pagamento */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => checkFeatureAccess('Metodi di pagamento')}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="credit-card" size={24} color={COLORS.primary} />
              </View>
              <Text style={[
                styles.settingLabel,
                isGuest && styles.disabledFeature
              ]}>
                Metodi di pagamento
              </Text>
              {isGuest && (
                <MaterialCommunityIcons name="lock" size={20} color={COLORS.grey} style={styles.lockIcon} />
              )}
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {/* Admin Section - Only visible for admin users */}
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.settingItem, styles.adminItem]} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Admin' as never)}
              >
                <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.primary} style={styles.adminIcon} />
                <Text style={[styles.settingLabel, styles.adminLabel]}>
                  Pannello Amministratore
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Sezione impostazioni app */}
        {renderSettingsSection()}
        
        {/* Sezione info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          
          <View style={styles.settingsContainer}>
            {/* Contatta il supporto */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => Alert.alert('Supporto', 'Puoi contattarci all\'indirizzo supporto@ineout.it')}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="headset" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.settingLabel}>Contatta il supporto</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {/* Chi siamo */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => Alert.alert('Chi siamo', 'In&Out è una piattaforma innovativa per la ricerca e pubblicazione di annunci immobiliari.')}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="information" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.settingLabel}>Chi siamo</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {/* Termini di servizio */}
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.8}
              onPress={() => Alert.alert('Termini di servizio', 'I termini di servizio saranno disponibili presto.')}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.settingLabel}>Termini di servizio</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Pulsante logout */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.logoutButtonText}>
            {isGuest ? 'Esci dalla modalità ospite' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {user && user.email === 'admin@ineout.com' && (
          <View style={styles.adminSection}>
            <Text style={styles.adminSectionTitle}>
              Strumenti Amministratore
            </Text>
            <SeedListingsButton 
              onComplete={(success) => {
                if (success) {
                  Alert.alert('Successo', 'Annunci caricati con successo');
                }
              }} 
            />
          </View>
        )}
      </ScrollView>
      
      {/* Modale per funzionalità che richiedono autenticazione */}
      <AuthRequiredModal 
        visible={modalVisible} 
        onClose={closeModal} 
        message={authRequiredMessage}
      />
      
      {/* Modale per il selettore di immagini */}
      <Modal
        visible={imagePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImagePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifica immagine profilo</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleTakePhoto}
            >
              <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Scatta una foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleImageSelection}
            >
              <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Scegli dalla galleria</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.cancelOptionText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    marginBottom: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  guestAvatarContainer: {
    backgroundColor: COLORS.lightGrey,
    borderWidth: 2,
    borderColor: COLORS.grey,
    borderStyle: 'dashed',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
  },
  editButtonText: {
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
  },
  loginButtonText: {
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
  },
  registerButtonText: {
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  settingsContainer: {
    backgroundColor: COLORS.white,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  disabledFeature: {
    color: COLORS.grey,
  },
  lockIcon: {
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 32,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  adminItem: {
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
    borderRadius: 8,
    marginTop: 8,
    borderBottomWidth: 0,
    padding: 12,
  },
  adminLabel: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  adminIcon: {
    marginRight: 12,
  },
  adminSection: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingArrow: {
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 12,
    color: COLORS.textPrimary,
  },
  cancelOption: {
    justifyContent: 'center',
    marginTop: 10,
    borderBottomWidth: 0,
  },
  cancelOptionText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  // Stili per la sezione abbonamento
  subscriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  subscriptionLoadingText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  subscriptionBadge: {
    backgroundColor: COLORS.success + '20', // verde con opacità
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginBottom: 16,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  subscriptionActions: {
    marginTop: 10,
  },
  subscriptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  subscriptionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
  },
  noSubscriptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  noSubscriptionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelSubscriptionButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
    height: 40,
    justifyContent: 'center',
  },
  cancelSubscriptionText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileScreen;