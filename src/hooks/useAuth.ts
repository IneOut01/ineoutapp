import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook personalizzato per gestire lo stato di autenticazione dell'utente
 * Restituisce lo stato attuale dell'autenticazione (user, isAuthenticated, isLoading)
 */
export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false
      });
    });
    
    // Cleanup della sottoscrizione quando il componente si smonta
    return () => unsubscribe();
  }, []);

  return authState;
};

export default useAuth; 