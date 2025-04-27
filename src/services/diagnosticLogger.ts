import { Platform, ErrorUtils, LogBox } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// URL per inviare i log
const LOG_SERVER_URL = 'https://ineoutapp.onrender.com/api/logs';

// Tipi di errori che possiamo tracciare
export type ErrorType = 
  | 'api_error'
  | 'network_error'
  | 'firebase_error'
  | 'app_init_error'
  | 'critical_app_init'
  | 'runtime_error'
  | 'async_error';

// Interfaccia per gli errori strutturati
interface StructuredError {
  type: ErrorType;
  error: Error;
  context?: Record<string, any>;
  timestamp: number;
}

// Coda degli errori per il reporting asincrono
const errorQueue: StructuredError[] = [];
let isErrorReportingEnabled = false;

// Handler globale per errori non catturati
const globalErrorHandler = (error: Error, isFatal?: boolean) => {
  try {
    console.error(`[${isFatal ? 'FATAL' : 'ERROR'}]`, error);
    
    // Struttura l'errore
    const structuredError: StructuredError = {
      type: isFatal ? 'critical_app_init' : 'runtime_error',
      error,
      context: {
        isFatal,
        stack: error.stack,
      },
      timestamp: Date.now(),
    };
    
    // Aggiungi alla coda
    errorQueue.push(structuredError);
    
    // Se il reporting è abilitato, invia subito
    if (isErrorReportingEnabled) {
      flushErrorQueue().catch(console.error);
    }
  } catch (e) {
    // Fallback estremo
    console.error('Error in error handler:', e);
  }
};

// Handler per promise non gestite
const unhandledPromiseRejectionHandler = (id: string, error: Error) => {
  try {
    console.error('[UNHANDLED PROMISE]', error);
    
    const structuredError: StructuredError = {
      type: 'async_error',
      error,
      context: {
        promiseId: id,
        stack: error.stack,
      },
      timestamp: Date.now(),
    };
    
    errorQueue.push(structuredError);
    
    if (isErrorReportingEnabled) {
      flushErrorQueue().catch(console.error);
    }
  } catch (e) {
    console.error('Error in promise rejection handler:', e);
  }
};

// Invia gli errori al backend
async function flushErrorQueue(): Promise<void> {
  if (!errorQueue.length) return;
  
  try {
    // TODO: Implementa la logica di invio al tuo backend
    // const errors = [...errorQueue];
    // errorQueue.length = 0;
    // await sendErrorsToBackend(errors);
  } catch (e) {
    console.error('Failed to flush error queue:', e);
  }
}

// Setup iniziale degli handler globali
export function setupGlobalErrorHandlers() {
  // Imposta gli handler globali
  ErrorUtils.setGlobalHandler(globalErrorHandler);
  
  // Gestisci le promise non catturate
  if (typeof global.process !== 'undefined') {
    process.on('unhandledRejection', (reason: any) => {
      unhandledPromiseRejectionHandler('unknown', reason instanceof Error ? reason : new Error(String(reason)));
    });
  }
  
  // Disabilita alcuni warning di sviluppo in produzione
  if (!__DEV__) {
    LogBox.ignoreAllLogs();
  }
  
  isErrorReportingEnabled = true;
}

// Utility per catturare errori strutturati
export function captureError(error: Error, type: ErrorType, context?: Record<string, any>) {
  const structuredError: StructuredError = {
    type,
    error,
    context,
    timestamp: Date.now(),
  };
  
  errorQueue.push(structuredError);
  
  if (isErrorReportingEnabled) {
    flushErrorQueue().catch(console.error);
  }
}

// Utility specifiche per diversi tipi di errori
export function captureApiError(error: Error, context?: Record<string, any>) {
  captureError(error, 'api_error', context);
}

export function captureFirebaseInitError(error: Error, context?: Record<string, any>) {
  captureError(error, 'firebase_error', context);
}

// Utility per il diagnostic mode
let diagnosticMode = false;

export function enableDiagnosticMode() {
  diagnosticMode = true;
}

export function isDiagnosticMode(): boolean {
  return diagnosticMode;
}

// Utility per il reporting dello stato
export function reportFirebaseInitialized() {
  console.log('[DIAGNOSTIC] Firebase initialized successfully');
}

export function reportApiConnected(connected: boolean) {
  console.log(`[DIAGNOSTIC] API connection status: ${connected ? 'connected' : 'disconnected'}`);
}

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
 * Cattura crash dell'app
 */
export const captureCrash = (error: Error): void => {
  captureError(error, 'app_crash', { stack: error.stack });
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