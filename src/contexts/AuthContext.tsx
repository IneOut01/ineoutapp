import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useTranslation } from './LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chiave per salvare lo stato della modalità ospite
const GUEST_MODE_KEY = 'isGuestMode';

// Definizione del tipo per i dati dell'utente
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

// Definizione del tipo per il contesto
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  setGuest: (value: boolean) => void;
  exitGuestMode: () => void;
  refreshUserData: () => void;
  resetAuthState: () => void;
}

// Valori di default per il contesto
const defaultAuth: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  setGuest: () => {},
  exitGuestMode: () => {},
  refreshUserData: () => {},
  resetAuthState: () => {},
};

// Creazione del contesto
export const AuthContext = createContext<AuthContextType>(defaultAuth);

// Provider del contesto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{
    user: AuthUser | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    isGuest: false,
    isLoading: true,
  });

  const { t } = useTranslation();

  // Carica lo stato della modalità ospite all'avvio
  useEffect(() => {
    const loadGuestMode = async () => {
      try {
        const guestModeValue = await AsyncStorage.getItem(GUEST_MODE_KEY);
        if (guestModeValue === 'true' && !authState.isAuthenticated) {
          console.log("⚠️ Ripristino modalità ospite da storage");
          setAuthState(prev => ({
            ...prev,
            isGuest: true,
            user: {
              uid: 'guest',
              email: 'guest@example.com',
              displayName: t('auth.guestUser', 'Ospite'),
              photoURL: null,
              isAnonymous: true,
            },
          }));
        }
      } catch (error) {
        console.error("Errore nel caricamento della modalità ospite:", error);
      }
    };

    loadGuestMode();
  }, []);

  // Funzione per attivare la modalità ospite
  const setGuest = async (value: boolean) => {
    if (value && !authState.isAuthenticated) {
      try {
        console.log("⚠️ Attivazione modalità ospite");
        // Salva lo stato nella memoria persistente
        await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
        
        // Crea un profilo ospite simulato
        setAuthState(prev => ({
          ...prev,
          isGuest: true,
          user: {
            uid: 'guest',
            email: 'guest@example.com',
            displayName: t('auth.guestUser', 'Ospite'),
            photoURL: null,
            isAnonymous: true,
          },
        }));
      } catch (error) {
        console.error("Errore nell'attivazione della modalità ospite:", error);
      }
    }
  };

  // Funzione per uscire dalla modalità ospite
  const exitGuestMode = async () => {
    console.log("⚠️ DISATTIVAZIONE MODALITÀ OSPITE FORZATA");
    try {
      // Rimuovi lo stato dalla memoria persistente
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      
      // Forza la disattivazione della modalità ospite
      setAuthState(prev => ({
        ...prev,
        isGuest: false,
      }));
    } catch (error) {
      console.error("Errore nella disattivazione della modalità ospite:", error);
    }
  };

  // Funzione per aggiornare i dati dell'utente corrente
  const refreshUserData = () => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log("⚠️ Aggiornamento dati utente:", currentUser.uid);
      // Aggiorna i dati dell'utente nel contesto
      const updatedUser: AuthUser = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        isAnonymous: false,
      };
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isAuthenticated: true,
        isGuest: false, // Assicurati che la modalità ospite sia disattivata
      }));
    }
  };

  // Funzione per resettare completamente lo stato di autenticazione
  const resetAuthState = async () => {
    console.log("⚠️ RESET COMPLETO STATO AUTENTICAZIONE");
    try {
      // Rimuovi lo stato dalla memoria persistente
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      
      // Reimposta lo stato
      setAuthState({
        user: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Errore nel reset dello stato di autenticazione:", error);
    }
  };

  // Prima controlliamo come viene usato Firebase nel contesto di autenticazione
  // Ascolta i cambiamenti nello stato di autenticazione di Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("⚠️ Firebase auth:", user ? `utente autenticato: ${user.email}` : "nessun utente autenticato");
      
      // Recupera lo stato della modalità ospite
      const guestModeValue = await AsyncStorage.getItem(GUEST_MODE_KEY);
      
      if (user) {
        // Utente autenticato
        if (guestModeValue === 'true') {
          // Se l'utente è autenticato e la modalità ospite è attiva, disattiviamola
          await AsyncStorage.removeItem(GUEST_MODE_KEY);
          console.log("🔄 Utente autenticato: modalità ospite disattivata automaticamente");
        }
        
        // Aggiorna lo stato con i dettagli dell'utente
        setAuthState({
          user: {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL,
          },
          isAuthenticated: true,
          isGuest: false, // Forza a false quando c'è un utente autenticato
          isVerifyingAuth: false,
        });
      } else {
        // Nessun utente autenticato
        if (guestModeValue === 'true') {
          // Modalità ospite attiva
          setAuthState({
            user: {
              uid: 'guest',
              email: 'guest@ineout.app',
              displayName: 'Ospite',
              photoURL: null,
            },
            isAuthenticated: false,
            isGuest: true,
            isVerifyingAuth: false,
          });
        } else {
          // Nessun utente e nessuna modalità ospite
          setAuthState({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            isVerifyingAuth: false,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Valori da esporre nel contesto
  const value = {
    ...authState,
    setGuest,
    exitGuestMode,
    refreshUserData,
    resetAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizzato per utilizzare il contesto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  
  return context;
};

export default AuthProvider; 