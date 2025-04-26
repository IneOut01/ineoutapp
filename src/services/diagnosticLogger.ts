import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// URL per inviare i log
const LOG_SERVER_URL = 'https://ineoutapp.onrender.com/api/logs';

// Flag per modalità diagnostic
export const isDiagnosticMode = () => {
  return Constants.expoConfig?.extra?.diagnosticMode === true;
};

// Stato degli errori
export type DiagnosticState = {
  hasError: boolean;
  lastError?: Error | null;
  errorCount: number;
  errorLog: Array<{
    timestamp: number;
    message: string;
    stack?: string;
    type: string;
  }>;
  isConnected: boolean;
  firebaseInitialized: boolean;
  appStartupTime: number;
  deviceInfo: {
    platform: string;
    version: string;
    deviceName?: string;
  };
};

// Stato globale per la diagnostica
export const diagnosticState: DiagnosticState = {
  hasError: false,
  lastError: null,
  errorCount: 0,
  errorLog: [],
  isConnected: false,
  firebaseInitialized: false,
  appStartupTime: Date.now(),
  deviceInfo: {
    platform: Platform.OS,
    version: Platform.Version.toString(),
    deviceName: Constants.deviceName,
  }
};

/**
 * Cattura un errore e lo aggiunge al log
 */
export const captureError = (error: Error, type = 'generic'): void => {
  console.error(`DIAGNOSTIC [${type}]:`, error);
  
  const errorEntry = {
    timestamp: Date.now(),
    message: error.message || 'Errore sconosciuto',
    stack: error.stack,
    type
  };
  
  // Aggiorna lo stato
  diagnosticState.hasError = true;
  diagnosticState.lastError = error;
  diagnosticState.errorCount++;
  diagnosticState.errorLog.push(errorEntry);
  
  // Invia al server se possibile
  sendErrorToServer(errorEntry).catch(e => {
    console.log('Impossibile inviare errore al server:', e.message);
  });
};

/**
 * Cattura errori di inizializzazione Firebase
 */
export const captureFirebaseInitError = (error: Error): void => {
  captureError(error, 'firebase_init');
};

/**
 * Cattura errori di connessione API
 */
export const captureApiError = (error: Error): void => {
  captureError(error, 'api_connection');
};

/**
 * Cattura crash dell'app
 */
export const captureCrash = (error: Error): void => {
  captureError(error, 'app_crash');
};

/**
 * Segnala l'avvenuta inizializzazione di Firebase
 */
export const reportFirebaseInitialized = (): void => {
  diagnosticState.firebaseInitialized = true;
  console.log('DIAGNOSTIC: Firebase inizializzato con successo');
};

/**
 * Segnala la connessione API
 */
export const reportApiConnected = (connected: boolean): void => {
  diagnosticState.isConnected = connected;
  console.log(`DIAGNOSTIC: API ${connected ? 'connessa' : 'disconnessa'}`);
};

/**
 * Invia log al server
 */
const sendErrorToServer = async (errorEntry: any): Promise<void> => {
  if (!diagnosticState.isConnected) {
    console.log('DIAGNOSTIC: Skip invio errori (API non connessa)');
    return;
  }
  
  try {
    const payload = {
      ...errorEntry,
      appInfo: {
        version: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Platform.select({
          ios: Constants.expoConfig?.ios?.buildNumber,
          android: Constants.expoConfig?.android?.versionCode
        }),
      },
      deviceInfo: diagnosticState.deviceInfo,
      diagnosticInfo: {
        errorCount: diagnosticState.errorCount,
        appStartupTime: diagnosticState.appStartupTime,
        uptime: Date.now() - diagnosticState.appStartupTime,
      }
    };
    
    const response = await axios.post(LOG_SERVER_URL, payload, {
      timeout: 5000, // timeout breve per non bloccare l'app
      headers: {
        'Content-Type': 'application/json',
        'X-App-Diagnostic': 'true'
      }
    });
    
    console.log('DIAGNOSTIC: Log inviato al server', response.status);
  } catch (e) {
    console.log('DIAGNOSTIC: Errore invio log', e.message);
  }
};

/**
 * Intercetta errori globali
 */
export const setupGlobalErrorHandlers = (): void => {
  // Intercetta errori JS non catturati
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    captureError(
      error instanceof Error ? error : new Error(error?.toString?.() || 'Errore sconosciuto'),
      isFatal ? 'fatal_js_error' : 'js_error'
    );
    
    // Chiama il gestore originale
    originalErrorHandler(error, isFatal);
  });
  
  // Intercetta Promise non gestite
  const originalUnhandledRejection = global.onunhandledrejection;
  
  // @ts-ignore - Definito solo in ambiente non-browser
  global.onunhandledrejection = (event: any) => {
    const error = event?.reason || new Error('Promise non gestita');
    captureError(error, 'unhandled_promise');
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };
  
  console.log('DIAGNOSTIC: Handler errori globali configurati');
};

// Informazioni sul tempo di avvio
export const getStartupMetrics = () => {
  const now = Date.now();
  return {
    startupTime: diagnosticState.appStartupTime,
    elapsedSinceStartup: now - diagnosticState.appStartupTime,
    timestamp: now,
    errorsEncountered: diagnosticState.errorCount,
  };
};

// Esporta funzione per ottenere lo stato attuale
export const getDiagnosticSnapshot = (): DiagnosticState => {
  return { ...diagnosticState };
};

// Preparalo per l'uso istantaneo
setupGlobalErrorHandlers(); 