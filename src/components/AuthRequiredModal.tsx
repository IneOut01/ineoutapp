import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * Modale che viene mostrato quando un utente non autenticato prova ad accedere
 * a funzionalità riservate agli utenti registrati
 */
const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ 
  visible, 
  onClose,
  message
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  // Messaggio predefinito se non specificato
  const defaultMessage = t('auth.featureRequiresAuth', 'Per utilizzare questa funzionalità devi accedere o registrarti.');
  
  // Naviga alla schermata di login
  const navigateToLogin = () => {
    onClose();
    navigation.navigate('Login' as never);
  };
  
  // Naviga alla schermata di registrazione
  const navigateToSignup = () => {
    onClose();
    navigation.navigate('Signup' as never);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Icona */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="account-lock" size={50} color={COLORS.primary} />
              </View>
              
              {/* Messaggio */}
              <Text style={styles.modalTitle}>Accesso richiesto</Text>
              <Text style={styles.modalMessage}>{message || defaultMessage}</Text>
              
              {/* Pulsanti */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.loginButton]} 
                  onPress={navigateToLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>{t('auth.login', 'Accedi')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.signupButton]} 
                  onPress={navigateToSignup}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.signupButtonText]}>
                    {t('auth.signup', 'Registrati')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Pulsante chiudi */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>{t('common.close', 'Chiudi')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
  },
  signupButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.white,
  },
  signupButtonText: {
    color: COLORS.primary,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

export default AuthRequiredModal; 