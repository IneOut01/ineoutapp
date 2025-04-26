import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { log } from '../utils/logger';

// Definizione delle interfacce e tipi per il servizio di pagamento
export enum PaymentStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Endpoint API
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://api.ineout.app';
const PAYMENT_ENDPOINTS = {
  CREATE_INTENT: `${API_URL}/payments/create-intent`,
  CONFIRM: `${API_URL}/payments/confirm`,
  CHECK_STATUS: `${API_URL}/payments/status`
};

// Mock per sviluppo locale
const IS_DEVELOPMENT = __DEV__;
const USE_MOCK_RESPONSE = IS_DEVELOPMENT && false; // Imposta a true per usare mock in sviluppo

interface PaymentData {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  ephemeralKey?: string;
  customer?: string;
  success: boolean;
  message?: string;
}

// Funzione principale per creare un payment intent
export async function createPaymentIntent(data: PaymentData): Promise<PaymentIntentResponse> {
  try {
    // Log di debug per l'operazione di pagamento
    log.info('Creazione payment intent con dati:', {
      amount: data.amount,
      currency: data.currency,
      description: data.description
    });
    
    // Usa mock in modalità sviluppo se richiesto
    if (USE_MOCK_RESPONSE) {
      log.info('Utilizzo risposta mock per payment intent');
      return getMockPaymentIntent(data);
    }
    
    // Effettua la richiesta al backend
    const response = await fetch(PAYMENT_ENDPOINTS.CREATE_INTENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Gestisci risposte non 2xx
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore nella risposta del server' }));
      const statusText = response.statusText || 'Errore sconosciuto';
      log.error(`Errore nella creazione del payment intent: ${response.status} ${statusText}`, errorData);
      
      // Se il server è irraggiungibile in modalità sviluppo, usa il mock
      if (IS_DEVELOPMENT && (response.status === 404 || response.status === 500)) {
        log.warn('Server irraggiungibile, utilizzo risposta mock');
        return getMockPaymentIntent(data);
      }
      
      throw new Error(errorData.message || `Errore ${response.status}: ${statusText}`);
    }

    // Elabora la risposta
    const responseData = await response.json();
    
    // Verifica che il client secret abbia il formato corretto (pi_XXXX_secret_YYYY)
    if (responseData.clientSecret && !responseData.clientSecret.match(/^pi_.*_secret_.*$/)) {
      log.error('Formato client_secret non valido:', responseData.clientSecret);
      
      // Correggi il formato se possibile
      if (responseData.paymentIntentId && responseData.clientSecret) {
        const correctedSecret = `${responseData.paymentIntentId}_secret_${responseData.clientSecret.split('_').pop()}`;
        log.info('Client secret corretto:', correctedSecret);
        responseData.clientSecret = correctedSecret;
      } else if (IS_DEVELOPMENT) {
        // In ambiente di sviluppo, genera un secret di test
        const mockSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`;
        log.warn('Generato client secret di sviluppo:', mockSecret);
        responseData.clientSecret = mockSecret;
      } else {
        throw new Error('Client secret non valido nella risposta del server');
      }
    }
    
    log.info('Payment intent creato con successo:', {
      paymentIntentId: responseData.paymentIntentId
    });
    
    return {
      clientSecret: responseData.clientSecret,
      paymentIntentId: responseData.paymentIntentId,
      ephemeralKey: responseData.ephemeralKey,
      customer: responseData.customer,
      success: true
    };
  } catch (error) {
    log.error('Errore non gestito nella creazione del payment intent:', error);
    
    // Se in sviluppo, fallback al mock
    if (IS_DEVELOPMENT) {
      log.warn('Utilizzo risposta mock dopo errore');
      return getMockPaymentIntent(data);
    }
    
    throw error;
  }
}

// Conferma un payment intent
export async function confirmPayment(paymentIntentId: string): Promise<boolean> {
  try {
    log.info('Confermando il payment intent:', paymentIntentId);
    
    // Mock in sviluppo se richiesto
    if (USE_MOCK_RESPONSE) {
      log.info('Utilizzo risposta mock per conferma payment');
      return true;
    }
    
    const response = await fetch(PAYMENT_ENDPOINTS.CONFIRM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore nella risposta del server' }));
      log.error(`Errore nella conferma del payment intent: ${response.status}`, errorData);
      
      // Fallback in sviluppo
      if (IS_DEVELOPMENT && (response.status === 404 || response.status === 500)) {
        log.warn('Server irraggiungibile, utilizzo risposta mock per conferma');
        return true;
      }
      
      throw new Error(errorData.message || `Errore ${response.status} nella conferma del pagamento`);
    }

    const data = await response.json();
    log.info('Conferma payment intent completata:', data);
    
    return data.success === true;
  } catch (error) {
    log.error('Errore non gestito nella conferma del payment intent:', error);
    
    // Fallback in sviluppo
    if (IS_DEVELOPMENT) {
      return true;
    }
    
    throw error;
  }
}

// Verifica lo stato di un payment intent
export async function checkPaymentStatus(paymentIntentId: string): Promise<string> {
  try {
    log.info('Verificando lo stato del payment intent:', paymentIntentId);
    
    // Mock in sviluppo se richiesto
    if (USE_MOCK_RESPONSE) {
      log.info('Utilizzo risposta mock per stato payment');
      return 'succeeded';
    }
    
    const response = await fetch(`${PAYMENT_ENDPOINTS.CHECK_STATUS}/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore nella risposta del server' }));
      log.error(`Errore nella verifica dello stato: ${response.status}`, errorData);
      
      // Fallback in sviluppo
      if (IS_DEVELOPMENT && (response.status === 404 || response.status === 500)) {
        log.warn('Server irraggiungibile, utilizzo risposta mock per stato');
        return 'succeeded';
      }
      
      throw new Error(errorData.message || `Errore ${response.status} nella verifica dello stato`);
    }

    const data = await response.json();
    log.info('Stato payment intent:', data.status);
    
    return data.status;
  } catch (error) {
    log.error('Errore non gestito nella verifica dello stato del payment intent:', error);
    
    // Fallback in sviluppo
    if (IS_DEVELOPMENT) {
      return 'succeeded';
    }
    
    throw error;
  }
}

// Gestione errori di pagamento con messaggi localizzati
export function handlePaymentError(error: unknown): string {
  let errorMessage = 'Si è verificato un errore durante il pagamento';
  
  if (error instanceof Error) {
    // Errori comuni di Stripe
    if (error.message.includes('Canceled')) {
      return 'Pagamento annullato dall\'utente';
    } else if (error.message.includes('card was declined')) {
      return 'La carta è stata rifiutata. Verifica i dati della carta o prova con un\'altra carta';
    } else if (error.message.includes('insufficient_funds')) {
      return 'Fondi insufficienti sulla carta';
    } else if (error.message.includes('expired_card')) {
      return 'La carta è scaduta';
    } else if (error.message.includes('authentication_required')) {
      return 'È richiesta l\'autenticazione per completare il pagamento';
    } else if (error.message.includes('incorrect_cvc')) {
      return 'Il codice CVC non è corretto';
    } else if (error.message.includes('no internet connection')) {
      return 'Nessuna connessione a Internet. Controlla la connessione e riprova';
    }
    
    // Se abbiamo un messaggio di errore specifico, usalo
    errorMessage = error.message;
  }
  
  return errorMessage;
}

// Funzione per generare una risposta mock
function getMockPaymentIntent(data: PaymentData): PaymentIntentResponse {
  const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`;
  
  log.info('Generata risposta mock:', {
    paymentIntentId,
    clientSecret: clientSecret.substring(0, 10) + '...'
  });
  
  return {
    paymentIntentId,
    clientSecret,
    ephemeralKey: `ek_${Date.now()}`,
    customer: `cus_${Date.now()}`,
    success: true
  };
}

// Esporta il servizio completo
const paymentService = {
  createPaymentIntent,
  confirmPayment,
  checkPaymentStatus,
  handlePaymentError
};

export default paymentService; 