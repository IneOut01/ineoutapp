import axios from 'axios';
import { captureApiError } from './diagnosticLogger';

const API_TIMEOUT = 5000; // 5 secondi di timeout
const API_BASE_URL = 'https://ineoutapp.onrender.com/api';

interface ApiTestResult {
  success: boolean;
  error?: Error;
  latency?: number;
}

export async function testApiConnection(): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    // Crea un controller per il timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Tenta la connessione con timeout
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: API_TIMEOUT,
      signal: controller.signal,
      validateStatus: (status) => status === 200, // Accetta solo 200
    });
    
    clearTimeout(timeoutId);
    
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      latency,
    };
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    
    // Cattura l'errore ma non bloccare l'app
    captureApiError(typedError, {
      url: `${API_BASE_URL}/health`,
      duration: Date.now() - startTime,
    });
    
    return {
      success: false,
      error: typedError,
    };
  }
}

// Utility per verificare la connessione in background
export function checkApiConnectionInBackground(): void {
  testApiConnection()
    .then(result => {
      if (!result.success) {
        console.warn('Background API check failed:', result.error);
      }
    })
    .catch(error => {
      console.error('Error in background API check:', error);
    });
} 