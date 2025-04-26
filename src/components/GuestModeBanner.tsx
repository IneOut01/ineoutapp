import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Banner che appare in cima all'app quando l'utente è in modalità ospite
 */
const GuestModeBanner = () => {
  const { isGuest, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Se l'utente non è in modalità ospite o è autenticato, non mostrare il banner
  if (!isGuest || isAuthenticated) {
    return null;
  }

  const handleLogin = () => {
    navigation.navigate('ProfileStack' as never, { screen: 'Login' } as never);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="account-question" size={20} color={COLORS.white} />
      <Text style={styles.text}>Modalità ospite attiva - funzionalità limitate</Text>
      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={styles.loginText}>Accedi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginLeft: 8,
  },
  loginText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GuestModeBanner; 