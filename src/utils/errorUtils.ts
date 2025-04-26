import { PaymentError } from '../services/paymentService';
import { AxiosError } from 'axios';

/**
 * Ritorna un messaggio di errore user-friendly per qualsiasi tipo di errore
 * @param error Errore da gestire
 * @returns Messaggio di errore user-friendly
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Si è verificato un errore sconosciuto';
  }

  // Errori di pagamento Stripe
  if ((error as PaymentError)?.isPaymentError) {
    const paymentError = error as PaymentError;
    // Messaggio personalizzato in base al codice di errore
    switch (paymentError.code) {
      case 'card_declined':
        return 'La carta è stata rifiutata. Controlla i dettagli della carta e riprova o usa un\'altra carta.';
      case 'expired_card':
        return 'La carta è scaduta. Usa un\'altra carta.';
      case 'incorrect_cvc':
        return 'Il codice di sicurezza CVC non è corretto. Controlla e riprova.';
      case 'processing_error':
        return 'Si è verificato un errore nell\'elaborazione del pagamento. Riprova tra qualche istante.';
      case 'insufficient_funds':
        return 'Fondi insufficienti sulla carta. Utilizza un\'altra carta.';
      case 'authentication_required':
        return 'È richiesta un\'autenticazione aggiuntiva. Segui le istruzioni per completare il pagamento.';
      default:
        return paymentError.message || 'Si è verificato un errore durante il pagamento';
    }
  }

  // Errori di rete con Axios
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return 'La richiesta è scaduta. Verifica la tua connessione internet e riprova.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Errore di rete. Verifica la tua connessione internet e riprova.';
    }
    if (error.response) {
      if (error.response.status === 401) {
        return 'Sessione scaduta. Accedi nuovamente per continuare.';
      }
      if (error.response.status === 403) {
        return 'Non hai i permessi per eseguire questa azione.';
      }
      if (error.response.status === 404) {
        return 'La risorsa richiesta non è stata trovata.';
      }
      if (error.response.status === 429) {
        return 'Troppe richieste. Riprova tra qualche istante.';
      }
      if (error.response.status >= 500) {
        return 'Il server ha riscontrato un errore. Riprova più tardi.';
      }
      return error.response.data?.message || 'Si è verificato un errore nella richiesta';
    }
    return error.message || 'Si è verificato un errore di rete';
  }

  // Errori generici
  if (error instanceof Error) {
    return error.message;
  }

  // Errori sconosciuti o non gestiti
  if (typeof error === 'string') {
    return error;
  }

  return 'Si è verificato un errore sconosciuto';
};

/**
 * Controlla se l'errore è causato dalla mancanza di connessione internet
 * @param error Errore da verificare
 * @returns True se l'errore è dovuto alla mancanza di connessione
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !!(
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message.includes('Network Error') ||
      !error.response
    );
  }
  
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('internet') ||
      error.message.includes('connection')
    );
  }
  
  return false;
}; 