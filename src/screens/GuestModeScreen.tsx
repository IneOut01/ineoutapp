import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Schermata che mostra limitazioni della modalità ospite e opzioni di accesso
 */
const GuestModeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { setGuest } = useAuth();

  // Naviga alla schermata di login
  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  // Naviga alla schermata di registrazione
  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  // Attiva la modalità ospite e torna alla home
  const continueAsGuest = () => {
    setGuest(true);
    navigation.navigate('HomeStack' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Modalità ospite</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Icona principale */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-question" size={80} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Sei in modalità ospite</Text>
          
          <Text style={styles.description}>
            La modalità ospite ti permette di esplorare l'app, ma con alcune limitazioni.
          </Text>
          
          {/* Funzioni disponibili */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funzioni disponibili:</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                <Text style={styles.featureText}>Visualizzare annunci</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                <Text style={styles.featureText}>Cercare annunci</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                <Text style={styles.featureText}>Utilizzare filtri di ricerca</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                <Text style={styles.featureText}>Visualizzare la mappa</Text>
              </View>
            </View>
          </View>
          
          {/* Funzionalità limitate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funzionalità limitate:</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                <Text style={styles.featureText}>Salvare annunci preferiti</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                <Text style={styles.featureText}>Pubblicare annunci</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                <Text style={styles.featureText}>Contattare i proprietari</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                <Text style={styles.featureText}>Accedere alla tua dashboard personale</Text>
              </View>
            </View>
          </View>
          
          {/* Call to action */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              Per sbloccare tutte le funzionalità, accedi o registrati:
            </Text>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={navigateToLogin}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="login" size={20} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>{t('auth.login', 'Accedi')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={navigateToSignup}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>{t('auth.signup', 'Registrati')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.ghostButton]}
              onPress={continueAsGuest}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-arrow-right" size={20} color={COLORS.textSecondary} />
              <Text style={styles.ghostButtonText}>Continua come ospite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  featureList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginLeft: 8,
  },
});

export default GuestModeScreen; 