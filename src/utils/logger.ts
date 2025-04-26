/**
 * Utility di logging per l'applicazione
 * Fornisce funzioni per gestire i log in modo consistente
 */

// Flag per attivare/disattivare i log in base all'ambiente
const isDevelopment = process.env.NODE_ENV !== 'production';
const LOGGING_ENABLED = __DEV__ || isDevelopment;

// Livelli di log predefiniti
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Configurazione del logger
const config = {
  level: LogLevel.DEBUG, // Livello minimo di log da mostrare
  showTimestamp: true,   // Mostra timestamp nei log
  showLevel: true,       // Mostra il livello nei log
};

// Formatta il messaggio di log con timestamp e livello
const formatLogMessage = (level: string, message: any, ...optionalParams: any[]): [string, ...any[]] => {
  const timestamp = config.showTimestamp ? `[${new Date().toISOString()}]` : '';
  const levelString = config.showLevel ? `[${level}]` : '';
  const prefix = `${timestamp}${levelString}`;
  
  // Se il messaggio è una stringa, lo concateniamo con il prefisso
  if (typeof message === 'string') {
    return [`${prefix} ${message}`, ...optionalParams];
  }
  
  // Altrimenti restituiamo il prefisso e il messaggio separatamente
  return [prefix, message, ...optionalParams];
};

// Funzioni di log esposte
export const log = {
  debug: (message: any, ...optionalParams: any[]): void => {
    if (LOGGING_ENABLED && config.level <= LogLevel.DEBUG) {
      console.debug(...formatLogMessage('DEBUG', message, ...optionalParams));
    }
  },
  
  info: (message: any, ...optionalParams: any[]): void => {
    if (LOGGING_ENABLED && config.level <= LogLevel.INFO) {
      console.info(...formatLogMessage('INFO', message, ...optionalParams));
    }
  },
  
  warn: (message: any, ...optionalParams: any[]): void => {
    if (LOGGING_ENABLED && config.level <= LogLevel.WARN) {
      console.warn(...formatLogMessage('WARN', message, ...optionalParams));
    }
  },
  
  error: (message: any, ...optionalParams: any[]): void => {
    if (LOGGING_ENABLED && config.level <= LogLevel.ERROR) {
      console.error(...formatLogMessage('ERROR', message, ...optionalParams));
    }
  },
  
  // Configurazione dinamica del logger
  setLevel: (level: LogLevel): void => {
    config.level = level;
  },
  
  enableTimestamp: (enable: boolean = true): void => {
    config.showTimestamp = enable;
  },
  
  enableLevelPrefix: (enable: boolean = true): void => {
    config.showLevel = enable;
  },
};

export default log; 