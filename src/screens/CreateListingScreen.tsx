import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const CreateListingScreen = () => {
  const navigation = useNavigation();
  
  const handlePublish = () => {
    // Simulazione della pubblicazione
    console.log('Annuncio pubblicato');
    
    // Naviga alla HomeStack dopo la pubblicazione
    navigation.navigate('HomeStack' as never);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuovo Annuncio</Text>
      <Text style={styles.subtitle}>Placeholder per la creazione di un nuovo annuncio</Text>
      
      <TouchableOpacity 
        style={styles.publishButton}
        onPress={handlePublish}
      >
        <Text style={styles.publishButtonText}>Pubblica Annuncio</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  publishButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateListingScreen; 