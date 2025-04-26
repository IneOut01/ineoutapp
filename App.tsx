import 'react-native-get-random-values'; // Importo questo prima di tutto per risolvere l'errore di uuid
// Importa il logger diagnostico come prima cosa dopo le librerie critiche
import {
  setupGlobalErrorHandlers, 
  captureError, 
  isDiagnosticMode, 
  captureFirebaseInitError, 
  reportFirebaseInitialized, 
  reportApiConnected
} from './src/services/diagnosticLogger';

import React, { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from 'react-native-toast-notifications';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { testApiConnection } from './src/services/testApiConnection';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import './src/i18n'; // Importa e inizializza i18n
import { errorHandler } from './src/services/devUtils';
import { MobileDevWrapper } from './src/services/mobileDevSolution';
import DiagnosticOverlay from './src/components/DiagnosticOverlay';
import EmergencySplash from './src/components/EmergencySplash';

// Log iniziale - Prima di tutto
console.log('APP STARTUP: App.tsx - inizio caricamento');

// Definisco C0 come variabile globale per risolvere l'errore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof global.C0 === 'undefined') {
  console.log('APP STARTUP: Definizione variabile C0');
  (global as any).C0 = 0;
}

// Importante: completa la sessione di autenticazione del browser
WebBrowser.maybeCompleteAuthSession();

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51REzUpHc2tE7lsFgj1yUw5AuvVGvXoYNHLRYFmbQ0SSJg4BEm6zEU5HrdFxqRzaLPGMsTirKBtcSbFdHsUJuGeLQ00ragXzg14';

// Componente per gestire errori fatali
const ErrorFallback = ({ error }) => {
  const inDiagnosticMode = isDiagnosticMode();
  
  // In modalità diagnostic, usa EmergencySplash
  if (inDiagnosticMode) {
    return <EmergencySplash error={error} isDiagnosticMode={true} />;
  }
  
  // Schermata di errore generica in produzione
  return (
    <SafeAreaProvider>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Si è verificato un errore</Text>
        <Text style={styles.errorMessage}>
          L'app ha riscontrato un problema durante l'avvio.
        </Text>
        {__DEV__ && (
          <View style={styles.devErrorDetails}>
            <Text style={styles.errorText}>{error.toString()}</Text>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
};

// App principale
const MainApp = () => {
  const [apiStatus, setApiStatus] = useState({ tested: false, connected: false });
  const [startupError, setStartupError] = useState<Error | null>(null);
  
  useEffect(() => {
    console.log('APP STARTUP: MainApp - componente montato');
    
    // Test di connessione all'API in modo non bloccante
    const checkApiConnection = async () => {
      try {
        console.log('APP STARTUP: Tentativo connessione API');
        const result = await testApiConnection().catch(e => {
          console.log('APP STARTUP: Errore API gestito, continuazione app');
          captureApiError(e);
          return false;
        });
        setApiStatus({ tested: true, connected: !!result });
        reportApiConnected(!!result);
      } catch (error) {
        console.log('APP STARTUP: Errore imprevisto in API test:', error);
        captureApiError(error instanceof Error ? error : new Error(String(error)));
        setApiStatus({ tested: true, connected: false });
        reportApiConnected(false);
      }
    };
    
    // Inizializza Firebase
    try {
      // Firebase viene inizializzato automaticamente all'importazione
      // da firebaseConfig.ts, qui registriamo solo il successo
      reportFirebaseInitialized();
      console.log('APP STARTUP: Firebase inizializzato');
    } catch (error) {
      console.error('APP STARTUP: Errore inizializzazione Firebase:', error);
      captureFirebaseInitError(error instanceof Error ? error : new Error(String(error)));
      setStartupError(error instanceof Error ? error : new Error(String(error)));
    }
    
    // Avvia il test API ma non blocca il rendering
    checkApiConnection();
  }, []);

  console.log('APP STARTUP: MainApp - rendering');
  
  // In modalità diagnostica, se c'è un errore di avvio, mostra la schermata di errore
  if (isDiagnosticMode() && startupError) {
    return <EmergencySplash error={startupError} isDiagnosticMode={true} />;
  }
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider placement="bottom">
          <AuthProvider>
            <LanguageProvider>
              <StripeProvider
                publishableKey={STRIPE_PUBLISHABLE_KEY}
                merchantIdentifier="merchant.com.ineout.app"
                urlScheme="ineout"
              >
                <AppNavigator />
                {/* Mostra il DiagnosticOverlay solo in modalità diagnostic */}
                {isDiagnosticMode() && <DiagnosticOverlay />}
              </StripeProvider>
            </LanguageProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// App con gestione errori
export default function App() {
  console.log('APP STARTUP: App - render principale');
  
  try {
    // In sviluppo, utilizza il wrapper di sviluppo mobile
    if (__DEV__) {
      console.log('APP STARTUP: Modalità sviluppo attivata');
      return (
        <MobileDevWrapper
          renderApp={() => errorHandler.withErrorHandling(() => <MainApp />)}
        />
      );
    }
    
    // In modalità diagnostic usa la gestione diagnostica
    if (isDiagnosticMode()) {
      console.log('APP STARTUP: Modalità diagnostic attivata');
      try {
        return <MainApp />;
      } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        captureError(typedError, 'app_init_error');
        return <EmergencySplash error={typedError} isDiagnosticMode={true} />;
      }
    }
    
    // In produzione usa comunque gestione errori
    console.log('APP STARTUP: Modalità produzione');
    return errorHandler.withErrorHandling(() => <MainApp />);
  } catch (error) {
    console.error('APP STARTUP: Errore critico durante inizializzazione:', error);
    
    // Cattura l'errore per la diagnostica
    const typedError = error instanceof Error ? error : new Error(String(error));
    captureError(typedError, 'critical_app_init');
    
    // Mostra UI di fallback
    return <ErrorFallback error={typedError} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e63946',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  devErrorDetails: {
    padding: 15,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});

// Non registrare il componente qui, ma in index.ts
