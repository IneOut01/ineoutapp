/**
 * Utility per gestione errori in sviluppo e produzione
 */
import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button, Platform } from 'react-native';

// Schermata di fallback che verrà mostrata quando si verifica un errore
const FallbackScreen = ({ error, resetError, isProd = false }) => {
  console.log('Rendering FallbackScreen con errore:', error?.message || 'Errore sconosciuto');
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>INEOUT</Text>
        {isProd ? (
          <Text style={styles.subtitle}>Ops, qualcosa non ha funzionato</Text>
        ) : (
          <Text style={styles.subtitle}>App in modalità sviluppo limitata</Text>
        )}
        
        <View style={styles.messageBox}>
          <Text style={styles.message}>
            {isProd 
              ? 'Si è verificato un problema durante l\'avvio dell\'app. Prova a riavviare l\'applicazione.'
              : 'Si è verificato un errore durante l\'avvio dell\'app. Questo è un problema noto in fase di sviluppo.'
            }
          </Text>
          
          {!isProd && error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}
        </View>
        
        {resetError && (
          <Button 
            title={isProd ? "Riprova" : "Continua in modalità limitata"} 
            onPress={resetError} 
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Gestore degli errori che mostra una UI di fallback
export const errorHandler = {
  // Reindirizza gli errori di rendering a log di console e mostra UI di fallback
  handleRenderError: (error: any, resetError?: () => void, isProd = false) => {
    console.error('Errore durante il rendering:', error);
    
    // Log specifico per errore C0
    if (error && error.message && error.message.includes("Property 'C0' doesn't exist")) {
      console.log('Rilevato errore noto Property C0. Mostrando interfaccia di fallback.');
      
      // Prova a definire C0 se non esiste
      try {
        if (typeof global.C0 === 'undefined') {
          // @ts-ignore
          global.C0 = 0;
          console.log('Definito global.C0 = 0 dopo errore');
        }
      } catch (e) {
        console.log('Impossibile definire C0:', e);
      }
    }
    
    // Ritorna una UI di fallback
    return <FallbackScreen error={error} resetError={resetError} isProd={isProd} />;
  },
  
  // Estende il rendering dell'app con gestione errori
  withErrorHandling: (renderFunction: () => any) => {
    try {
      console.log('withErrorHandling: tentativo di rendering app');
      // Tenta di eseguire la funzione di rendering
      return renderFunction();
    } catch (error) {
      console.error('withErrorHandling: catturato errore durante rendering:', error);
      
      // Modalità produzione o sviluppo
      const isProd = !__DEV__;
      
      return errorHandler.handleRenderError(error, undefined, isProd);
    }
  }
};

// Stili per la schermata di fallback
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  messageBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    color: '#e63946',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
}); 