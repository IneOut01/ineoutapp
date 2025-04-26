import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { handleUserLogin } from './onAuthState';
import { Platform } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../config/apiKeys';

// Importante per completare il flusso di autenticazione
WebBrowser.maybeCompleteAuthSession();

// Verifica e log delle configurazioni disponibili
function logGoogleConfig() {
  console.log('Google Auth Config:', {
    webClientId: GOOGLE_WEB_CLIENT_ID ? GOOGLE_WEB_CLIENT_ID.substring(0, 8) + '...' : 'non definito',
    iosClientId: GOOGLE_IOS_CLIENT_ID ? GOOGLE_IOS_CLIENT_ID.substring(0, 8) + '...' : 'non definito',
    androidClientId: GOOGLE_ANDROID_CLIENT_ID ? GOOGLE_ANDROID_CLIENT_ID.substring(0, 8) + '...' : 'non definito',
    platform: Platform.OS
  });
}

// Soluzione per Google Auth compatibile con Expo
export function useGoogleAuth() {
  const [isConfigured, setIsConfigured] = useState(true);
  const redirectUri = AuthSession.makeRedirectUri();
  
  console.log('Using redirect URI:', redirectUri);
  
  // Log della configurazione per debugging
  useEffect(() => {
    logGoogleConfig();
    
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.warn('Google auth non configurato - manca EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
      setIsConfigured(false);
    }
  }, []);

  // Configura la richiesta in base alla piattaforma
  const [request, response, promptAsyncOriginal] = useAuthRequest(
    Platform.OS === 'web' 
      ? {
          // Configurazione Web
          clientId: GOOGLE_WEB_CLIENT_ID,
          responseType: 'id_token',
          scopes: ['openid', 'profile', 'email'],
          redirectUri
        }
      : Platform.OS === 'ios'
      ? {
          // Configurazione iOS
          clientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
          responseType: 'id_token',
          scopes: ['openid', 'profile', 'email'],
          redirectUri
        }
      : {
          // Configurazione Android
          clientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
          responseType: 'id_token',
          scopes: ['openid', 'profile', 'email'],
          redirectUri
        }
  );

  // Gestione della risposta di autenticazione
  useEffect(() => {
    if (response?.type !== 'success') return;

    // Verifica che authentication esista
    if (!response.authentication) {
      console.warn('Google response senza authentication');
      return;
    }

    const idToken = response.authentication.idToken;
    if (!idToken) {
      console.warn('Google response senza idToken:', response);
      return;
    }

    // Autentica con Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential)
      .then(result => {
        // Inizializza il documento utente se necessario
        return handleUserLogin(result.user);
      })
      .catch(err => {
        console.error('Firebase sign-in error', err.code, err);
      });
  }, [response]);

  // Funzione per avviare il processo di autenticazione
  const promptGoogleAuth = async () => {
    if (!isConfigured) {
      return { 
        success: false, 
        error: 'config_missing', 
        message: `Google auth non configurato. Controlla il file .env e la documentazione.` 
      };
    }

    try {
      const result = await promptAsyncOriginal();
      
      if (result.type !== 'success') {
        return { success: false, error: 'login_cancelled' };
      }
      
      if (!result.authentication) {
        return { success: false, error: 'authentication_missing', cancelled: true };
      }
      
      return { success: true, result };
    } catch (error: any) {
      console.error('Google auth error:', error.code, error);
      return { success: false, error: 'auth_error', details: error, code: error.code };
    }
  };

  return { request, promptAsync: promptGoogleAuth, isGoogleAuthConfigured: isConfigured };
}