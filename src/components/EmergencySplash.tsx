import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { captureError } from '../services/diagnosticLogger';
import Constants from 'expo-constants';

interface EmergencySplashProps {
  error: Error;
  resetError?: () => void;
  isDiagnosticMode?: boolean;
}

const EmergencySplash: React.FC<EmergencySplashProps> = ({
  error,
  resetError,
  isDiagnosticMode = false
}) => {
  useEffect(() => {
    // Cattura l'errore per la diagnostica
    captureError(error, 'fatal_crash');
  }, [error]);
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/playstore.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>In & Out</Text>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Si è verificato un errore
          </Text>
          
          {isDiagnosticMode ? (
            <>
              <Text style={styles.errorMessage}>
                {error.message}
              </Text>
              
              <Text style={styles.errorStack}>
                {error.stack}
              </Text>
            </>
          ) : (
            <Text style={styles.errorMessage}>
              L'app ha riscontrato un problema. Prova a riavviarla.
            </Text>
          )}
        </View>
        
        {resetError && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={resetError}
          >
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.versionText}>
          v{Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  errorStack: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  versionText: {
    marginTop: 30,
    color: '#999',
    fontSize: 12,
  },
});

export default EmergencySplash; 