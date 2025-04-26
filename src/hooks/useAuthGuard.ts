import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook per proteggere funzionalità che richiedono l'autenticazione
 * Restituisce uno stato del modale e funzioni per controllarlo
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isGuest, user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [authRequiredMessage, setAuthRequiredMessage] = useState<string | undefined>(undefined);

  /**
   * Verifica se l'utente può accedere a una funzionalità protetta
   * Se non può, mostra il modale di autenticazione richiesta
   * @param message Messaggio opzionale da mostrare nel modale
   * @returns true se l'utente può accedere, false altrimenti
   */
  const canAccess = (message?: string): boolean => {
    // L'utente può accedere se è autenticato e non è in modalità ospite
    const hasAccess = isAuthenticated && !isGuest && !!user && user.uid !== 'guest';
    
    if (!hasAccess) {
      // Se non ha accesso, mostra il modale con il messaggio specificato
      setAuthRequiredMessage(message);
      setModalVisible(true);
    }
    
    return hasAccess;
  };

  /**
   * Chiude il modale di autenticazione richiesta
   */
  const closeModal = () => {
    setModalVisible(false);
  };

  return {
    modalVisible,
    authRequiredMessage,
    canAccess,
    closeModal
  };
};

export default useAuthGuard; 