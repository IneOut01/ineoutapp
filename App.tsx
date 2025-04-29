import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppRegistry, StyleSheet, Platform, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from 'react-native-toast-notifications';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { testApiConnection, checkApiConnectionInBackground } from './src/services/testApiConnection';
import { StripeProvider } from '@stripe/stripe-react-native';
import './src/i18n';
import { 
  setupGlobalErrorHandlers, 
  captureError, 
  isDiagnosticMode, 
  captureFirebaseInitError, 
  reportFirebaseInitialized, 
  reportApiConnected 
} from './src/services/diagnosticLogger';
import DiagnosticOverlay from './src/components/DiagnosticOverlay';
import EmergencySplash from './src/components/EmergencySplash';

// Inizializza il sistema di gestione errori globale
setupGlobalErrorHandlers();

// Stripe publishable key (test key)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51REzUpHc2tE7lsFgj1yUw5AuvVGvXoYNHLRYFmbQ0SSJg4BEm6zEU5HrdFxqRzaLPGMsTirKBtcSbFdHsUJuGeLQ00ragXzg14';

const ErrorFallback = ({ error, resetError }) => {
  const inDiagnosticMode = isDiagnosticMode();

  if (inDiagnosticMode) {
    return <EmergencySplash error={error} isDiagnosticMode={true} onReset={resetError} />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Si è verificato un errore</Text>
        <Text style={styles.errorMessage}>L'app ha riscontrato un problema durante l'avvio.</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    </SafeAreaProvider>
  );
};

const MainApp = () => {
  const [apiStatus, setApiStatus] = useState({ tested: false, connected: false });
  const [startupError, setStartupError] = useState<Error | null>(null);

  useEffect(() => {
    checkApiConnectionInBackground();

    const initializeFirebase = async () => {
      try {
        reportFirebaseInitialized();
        console.log('Firebase inizializzato');
      } catch (error) {
        console.error('Errore inizializzazione Firebase:', error);
        const typedError = error instanceof Error ? error : new Error(String(error));
        captureFirebaseInitError(typedError);
      }
    };

    initializeFirebase().catch(console.error);

    testApiConnection()
      .then(result => {
        setApiStatus({ tested: true, connected: result.success });
        reportApiConnected(result.success);
      })
      .catch(error => {
        console.error('Errore API test:', error);
        setApiStatus({ tested: true, connected: false });
        reportApiConnected(false);
      });
  }, []);

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
                {isDiagnosticMode() && <DiagnosticOverlay />}
              </StripeProvider>
            </LanguageProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const App = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error) => {
    console.error('Errore critico:', error);
    captureError(error, 'critical_app_init');
    setError(error);
  };

  const resetError = () => {
    setError(null);
  };

  if (error) {
    return <ErrorFallback error={error} resetError={resetError} />;
  }

  try {
    return <MainApp />;
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error)));
    return <ErrorFallback error={error} resetError={resetError} />;
  }
};

AppRegistry.registerComponent('main', () => App);

export default App;

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
  errorText: {
    fontSize: 14,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});