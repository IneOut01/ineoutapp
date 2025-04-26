import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import Colors from '../constants/Colors';
import { getAuth } from 'firebase/auth';
import * as subscriptionService from '../services/subscriptionService';
import paymentService, { PaymentStatus } from '../services/paymentService';
import { log } from '../utils/logger';

// Configurazioni per Stripe
const IS_TEST_MODE = true; // Imposta a false in produzione

// Durata degli abbonamenti in mesi
const SUBSCRIPTION_DURATIONS = {
  'basic': 1,
  'premium': 3,
  'pro': 12
};

type CheckoutScreenProps = StackScreenProps<RootStackParamList, 'Checkout'>;

interface RouteParams {
  planId: string;
  planTitle: string;
  planPrice: string;
  planDescription: string;
}

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  description: string;
  durationMonths: number;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const auth = getAuth();
  const appNavigation = useNavigation();
  
  // Parametri del piano selezionato
  const { planId = 'basic', planTitle = 'Base', planPrice = '9.99€', planDescription = 'Piano base' } = 
    route.params as RouteParams;
  
  // Estrai la durata del piano in mesi
  const planDurationMonths = SUBSCRIPTION_DURATIONS[planId as keyof typeof SUBSCRIPTION_DURATIONS] || 1;
  
  // Stati per il processo di pagamento
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [isGooglePaySupported, setIsGooglePaySupported] = useState(false);
  const [isLoadingPaymentSheet, setIsLoadingPaymentSheet] = useState(false);
  
  // Hooks di Stripe
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Estrae il valore numerico dal prezzo (rimuovendo il simbolo €)
  const extractPrice = () => {
    try {
      const valueStr = planPrice.replace('€', '').trim();
      const value = parseFloat(valueStr);
      return isNaN(value) ? 9.99 : value;
    } catch (error) {
      log.error('Errore nel parsing del prezzo:', error);
      return 9.99; // Valore di default in caso di errore
    }
  };
  
  // Valore numerico del prezzo
  const priceValue = extractPrice();
  const planValue = priceValue; // Per compatibilità
  
  // Gestione degli errori di pagamento
  const handlePaymentError = (error: unknown, source: string) => {
    log.error(`Errore durante ${source}:`, error);
    const errorMessage = paymentService.handlePaymentError(error);
    setPaymentError(errorMessage);
    Alert.alert(t('checkout.errorTitle'), errorMessage);
    setPaymentStatus(PaymentStatus.ERROR);
  };
  
  // Verifica se i metodi di pagamento della piattaforma sono supportati (Apple Pay, Google Pay)
  const checkPlatformPaySupport = async () => {
    try {
      if (Platform.OS === 'ios') {
        // Verifica del supporto Apple Pay
        setIsApplePaySupported(false); // Disabilita momentaneamente per risolvere il problema
      } else if (Platform.OS === 'android') {
        // Verifica del supporto Google Pay
        setIsGooglePaySupported(false); // Disabilita momentaneamente per risolvere il problema
      }
    } catch (error) {
      log.warn('Errore nel controllo del supporto di pagamento della piattaforma:', error);
      // Non mostriamo errori all'utente qui, solo disabilitiamo le opzioni non supportate
      setIsApplePaySupported(false);
      setIsGooglePaySupported(false);
    }
  };
  
  // Inizializza Stripe all'avvio
  const initializeStripe = async () => {
    try {
      // Controlla il supporto per i metodi di pagamento della piattaforma
      await checkPlatformPaySupport();
      
      // Non inizializzare nuovamente Stripe qui poiché è già inizializzato nell'App.tsx
      log.info('Checkout screen pronto');
    } catch (error) {
      log.error('Errore durante l\'inizializzazione di Stripe:', error);
      setPaymentError('Errore nell\'inizializzazione del gateway di pagamento');
    }
  };
  
  // Inizializzazione all'avvio
  useEffect(() => {
    initializeStripe();
  }, []);
  
  // Verifica lo stato di un pagamento
  const checkPaymentStatus = async (paymentId: string): Promise<boolean> => {
    try {
      const status = await paymentService.checkPaymentStatus(paymentId);
      
      if (status === 'succeeded') {
        log.info('Pagamento verificato con successo');
        return true;
      } else {
        log.warn(`Pagamento non riuscito, stato: ${status}`);
        setPaymentError(`Il pagamento non è stato completato (stato: ${status})`);
        setPaymentStatus(PaymentStatus.ERROR);
        Alert.alert('Errore', 'Il pagamento non è stato completato');
        return false;
      }
    } catch (error) {
      log.error('Errore nella verifica dello stato del pagamento:', error);
      setPaymentError('Errore nella verifica dello stato del pagamento');
      setPaymentStatus(PaymentStatus.ERROR);
      return false;
    }
  };
  
  // Crea un payment intent con Stripe
  const createPaymentIntent = async () => {
    try {
      // Prepara i dati per la richiesta di pagamento
      const paymentData = {
        amount: priceValue * 100, // Converti in centesimi
        currency: 'eur',
        description: `Abbonamento ${planTitle}`,
        metadata: {
          planId,
          userId: auth.currentUser?.uid || 'guest',
          userEmail: auth.currentUser?.email || 'guest',
        }
      };
      
      // Chiama il servizio di pagamento per creare l'intent
      const result = await paymentService.createPaymentIntent(paymentData);
      log.info('Payment intent creato con successo:', result.paymentIntentId);
      
      return result;
    } catch (error) {
      log.error('Errore nella creazione del payment intent:', error);
      throw error;
    }
  };
  
  // Apre il foglio di pagamento di Stripe
  const openPaymentSheet = async () => {
    try {
      setPaymentStatus(PaymentStatus.LOADING);
      setIsLoadingPaymentSheet(true);
      setPaymentError(null);
      
      // Ottieni i dati per il pagamento dal backend
      const { clientSecret, paymentIntentId } = await createPaymentIntent();
      setPaymentIntentId(paymentIntentId);
      
      // Prepara il foglio di pagamento
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'INEOUT',
        style: 'automatic',
        returnURL: 'ineout://payment-result',
        allowsDelayedPaymentMethods: true,
        applePay: isApplePaySupported ? {
          merchantCountryCode: 'IT',
        } : undefined,
        googlePay: isGooglePaySupported ? {
          merchantCountryCode: 'IT',
          testEnv: IS_TEST_MODE,
          currencyCode: 'EUR',
        } : undefined,
      });
      
      setIsLoadingPaymentSheet(false);
      
      if (initError) {
        log.error('Errore nell\'inizializzazione del foglio di pagamento:', initError);
        setPaymentError(initError.message);
        Alert.alert('Errore', initError.message);
        setPaymentStatus(PaymentStatus.ERROR);
        return;
      }
      
      // Mostra il foglio di pagamento
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
        if (presentError.code === 'Canceled') {
          log.info("Utente ha annullato il pagamento");
          // L'utente ha annullato, non mostrare un errore
          setPaymentStatus(PaymentStatus.IDLE);
          return;
        }
        log.error('Errore nella presentazione del foglio di pagamento:', presentError);
        setPaymentError(`Errore di pagamento: ${presentError.message}`);
        Alert.alert('Errore di pagamento', presentError.message);
        setPaymentStatus(PaymentStatus.ERROR);
        return;
      }
      
      // Conferma il pagamento sul backend
      const confirmed = await paymentService.confirmPayment(paymentIntentId);
      
      if (!confirmed) {
        log.error('Errore nella conferma del pagamento');
        setPaymentError('Errore nella conferma del pagamento');
        setPaymentStatus(PaymentStatus.ERROR);
        return;
      }
      
      // Verifica lo stato finale del pagamento
      const succeeded = await checkPaymentStatus(paymentIntentId);
      
      if (succeeded) {
        // Pagamento riuscito
        setPaymentStatus(PaymentStatus.SUCCESS);
        Alert.alert('Pagamento completato', 'Il tuo abbonamento è stato attivato con successo!');
        await saveSubscription();
      }
    } catch (error) {
      handlePaymentError(error, "processo di pagamento");
    }
  };
  
  // Gestione del pagamento con Apple Pay - disattivato temporaneamente
  const handleApplePay = async () => {
    Alert.alert('Funzionalità non disponibile', 'Apple Pay è temporaneamente disabilitato. Usa una carta di credito invece.');
  };
  
  // Gestione del pagamento con Google Pay - disattivato temporaneamente
  const handleGooglePay = async () => {
    Alert.alert('Funzionalità non disponibile', 'Google Pay è temporaneamente disabilitato. Usa una carta di credito invece.');
  };

  // Salva l'abbonamento su Firestore
  const saveSubscription = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;
      const userName = auth.currentUser?.displayName;
      
      if (!userId) {
        log.error('No user logged in');
        return;
      }
      
      // Crea un oggetto abbonamento dalle informazioni del piano
      const subscription = subscriptionService.createSubscriptionFromPayment(
        planId,
        planTitle,
        planPrice,
        planDescription,
        planValue,
        paymentIntentId ? 'stripe' : 'card',
        paymentIntentId,
        planDurationMonths
      );
      
      // Salva l'abbonamento
      await subscriptionService.saveSubscription(subscription);
      
      log.info('Abbonamento salvato con successo!');
      
      try {
        // Usa il servizio email direttamente
        const { emailService } = await import('../services/emailService');
        
        if (userEmail && emailService) {
          // Calcola la data di scadenza dell'abbonamento
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + planDurationMonths);
          
          // Invia email di conferma abbonamento
          await emailService.sendConfirmationEmail(
            userEmail,
            userName || 'Utente',
            {
              planTitle,
              planPrice,
              expiryDate: expiryDate.toISOString()
            }
          );
          
          log.info('Email di conferma inviata con successo');
        }
      } catch (emailError) {
        // Non bloccare il flusso se l'invio della email fallisce
        log.error('Errore nell\'invio dell\'email di conferma:', emailError);
      }
      
      // Naviga alla schermata del profilo
      handleSuccessNavigation();
    } catch (error) {
      log.error('Errore nel salvataggio dell\'abbonamento:', error);
      Alert.alert('Errore', 'Impossibile salvare i dati dell\'abbonamento');
    }
  };

  // Naviga alla schermata del profilo
  const handleSuccessNavigation = () => {
    if (paymentStatus === PaymentStatus.SUCCESS) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
    }
  };
  
  useEffect(() => {
    if (paymentStatus === PaymentStatus.SUCCESS) {
      // Aggiungi un piccolo ritardo prima di navigare
      const timer = setTimeout(() => {
        handleSuccessNavigation();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);
  
  // Rendering dei metodi di pagamento
  const renderPaymentMethods = () => {
    if (paymentStatus === PaymentStatus.SUCCESS) {
      return (
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={60} color={Colors.success} />
          <Text style={styles.successText}>{t('checkout.paymentSuccess')}</Text>
          <Text style={styles.successSubText}>{t('checkout.redirecting')}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.paymentMethodsContainer}>
        <Text style={styles.methodsTitle}>{t('checkout.selectPaymentMethod')}</Text>
        
        {/* Carta di credito (Payment Sheet) */}
        <TouchableOpacity
          style={styles.paymentMethodButton}
          onPress={openPaymentSheet}
          disabled={paymentStatus === PaymentStatus.LOADING}
        >
          <View style={styles.paymentMethodContent}>
            <FontAwesome5 name="credit-card" size={24} color={Colors.primary} />
            <Text style={styles.paymentMethodText}>{t('checkout.creditCard')}</Text>
          </View>
          {isLoadingPaymentSheet ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
        
        {/* Apple Pay */}
        {Platform.OS === 'ios' && isApplePaySupported && (
          <TouchableOpacity
            style={styles.paymentMethodButton}
            onPress={handleApplePay}
            disabled={paymentStatus === PaymentStatus.LOADING}
          >
            <View style={styles.paymentMethodContent}>
              <FontAwesome5 name="apple-pay" size={24} color={Colors.text} />
              <Text style={styles.paymentMethodText}>Apple Pay</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        
        {/* Google Pay */}
        {Platform.OS === 'android' && isGooglePaySupported && (
          <TouchableOpacity
            style={styles.paymentMethodButton}
            onPress={handleGooglePay}
            disabled={paymentStatus === PaymentStatus.LOADING}
          >
            <View style={styles.paymentMethodContent}>
              <FontAwesome5 name="google-pay" size={24} color={Colors.text} />
              <Text style={styles.paymentMethodText}>Google Pay</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        
        {/* Messaggio di errore */}
        {paymentError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{paymentError}</Text>
          </View>
        )}
        
        {/* Indicatore di caricamento */}
        {paymentStatus === PaymentStatus.LOADING && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('checkout.processing')}</Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={paymentStatus === PaymentStatus.LOADING}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
          <View style={styles.backButton} />
        </View>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>{t('checkout.orderSummary')}</Text>
          
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{planTitle}</Text>
              <Text style={styles.planPrice}>{planPrice}</Text>
            </View>
            
            <Text style={styles.planDescription}>{planDescription}</Text>
            
            <View style={styles.planDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={18} color={Colors.text} />
                <Text style={styles.detailText}>
                  {t('checkout.duration', { count: planDurationMonths })}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={18} color={Colors.success} />
                <Text style={styles.detailText}>{t('checkout.automaticRenewal')}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="support-agent" size={18} color={Colors.text} />
                <Text style={styles.detailText}>{t('checkout.supportIncluded')}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {renderPaymentMethods()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  planDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  paymentMethodsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.text,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 12,
    color: Colors.text,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  successSubText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CheckoutScreen; 