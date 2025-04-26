import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface ErrorViewProps {
  error: string | Error;
  onRetry?: () => void;
  containerStyle?: any;
}

const ErrorView: React.FC<ErrorViewProps> = ({ 
  error, 
  onRetry,
  containerStyle
}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <View style={[styles.container, containerStyle]}>
      <MaterialIcons name="error-outline" size={50} color={COLORS.error} />
      <Text style={styles.errorText}>Si è verificato un errore</Text>
      <Text style={styles.errorDescription}>{errorMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  errorDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ErrorView; 