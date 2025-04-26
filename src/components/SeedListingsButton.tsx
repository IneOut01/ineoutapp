import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../theme/colors';
import { seedListings } from '../../seedListings';

interface SeedListingsButtonProps {
  onComplete?: (success: boolean) => void;
}

const SeedListingsButton: React.FC<SeedListingsButtonProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      setLoading(true);
      
      // Chiedi conferma prima di procedere
      Alert.alert(
        "Carica annunci di esempio",
        "Vuoi caricare gli annunci di esempio nel database? Questa operazione potrebbe richiedere alcuni minuti.",
        [
          {
            text: "Annulla",
            style: "cancel",
            onPress: () => {
              setLoading(false);
              if (onComplete) onComplete(false);
            }
          },
          {
            text: "Procedi",
            onPress: async () => {
              try {
                await seedListings();
                Alert.alert(
                  "Successo",
                  "Gli annunci di esempio sono stati caricati con successo nel database."
                );
                if (onComplete) onComplete(true);
              } catch (error) {
                console.error("Errore durante il caricamento degli annunci:", error);
                Alert.alert(
                  "Errore",
                  "Si è verificato un errore durante il caricamento degli annunci."
                );
                if (onComplete) onComplete(false);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Errore:", error);
      setLoading(false);
      if (onComplete) onComplete(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={styles.buttonText}>Carica annunci di esempio</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default SeedListingsButton; 