import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface NoResultsProps {
  message: string;
  subMessage?: string;
  onReset?: () => void;
}

const NoResults: React.FC<NoResultsProps> = ({ 
  message, 
  subMessage, 
  onReset 
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={64} color={COLORS.textTertiary} />
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
      
      {onReset && (
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>Reimposta filtri</Text>
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
    padding: 24,
    backgroundColor: COLORS.white,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  subMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  }
});

export default NoResults; 