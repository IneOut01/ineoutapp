import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { signup } from '../auth/authService';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { useAuth } from '../contexts/AuthContext';

// Definire i tipi per la navigazione
type ProfileStackParamList = {
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Signup'>;

// Regex per validare email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Lunghezza minima password
const MIN_PASSWORD_LENGTH = 6;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { t } = useTranslation();
  const { exitGuestMode, refreshUserData, resetAuthState } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Stati per errori specifici di validazione
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  
  // Funzione per navigare al profilo dopo la registrazione
  const navigateToProfileAfterSignup = () => {
    // Reset completo dello stato di autenticazione
    resetAuthState();
    
    // Breve timeout per permettere il reset dello stato
    setTimeout(async () => {
      // Forzare l'aggiornamento dei dati utente
      refreshUserData();
      
      console.log("🔑 Registrazione completata, navigazione alla home...");
      
      // Usiamo CommonActions.reset per resettare completamente lo stack di navigazione
      // e tornare alla tab principale
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'HomeStack' as never }, // Torniamo alla schermata Home principale
          ],
        })
      );
      
      // Mostra messaggio di benvenuto
      Alert.alert(
        t('auth.welcome', 'Benvenuto!'),
        t('auth.signupSuccess', 'Registrazione completata con successo')
      );
    }, 500);
  };
  
  // Validazione email
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError(t('auth.emailRequired', 'Email obbligatoria'));
      return false;
    } else if (!EMAIL_REGEX.test(value)) {
      setEmailError(t('auth.invalidEmailFormat', 'Formato email non valido'));
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };
  
  // Validazione password
  const validatePassword = (value: string) => {
    if (!value.trim()) {
      setPasswordError(t('auth.passwordRequired', 'Password obbligatoria'));
      return false;
    } else if (value.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t('auth.passwordTooShort', `La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri`));
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  // Validazione conferma password
  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      setConfirmPasswordError(t('auth.confirmPasswordRequired', 'Conferma password obbligatoria'));
      return false;
    } else if (value !== password) {
      setConfirmPasswordError(t('auth.passwordMismatch', 'Le password non corrispondono'));
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };
  
  // Validazione nome
  const validateDisplayName = (value: string) => {
    if (!value.trim()) {
      setDisplayNameError(t('auth.nameRequired', 'Nome obbligatorio'));
      return false;
    } else if (value.trim().length < 2) {
      setDisplayNameError(t('auth.nameMinLength', 'Il nome deve contenere almeno 2 caratteri'));
      return false;
    } else {
      setDisplayNameError('');
      return true;
    }
  };
  
  // Gestione cambio email con validazione
  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };
  
  // Gestione cambio password con validazione
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
    
    // Se la conferma è già stata inserita, rivalidala
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };
  
  // Gestione cambio conferma password
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };
  
  // Gestione cambio nome
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    validateDisplayName(value);
  };

  // Funzione per gestire la registrazione
  const handleSignup = async () => {
    // Valida tutti i campi
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    const isDisplayNameValid = validateDisplayName(displayName);
    
    // Se uno dei campi non è valido, interrompi
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isDisplayNameValid) {
      return;
    }

    // Mostra lo spinner e disabilita il bottone
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await signup(email, password, displayName);
      
      if (result.success) {
        // Registrazione riuscita
        navigateToProfileAfterSignup();
      } else if (result.error) {
        // Gestisce errori specifici
        let errorMessage = '';
        
        if (result.error.includes('email-already-in-use')) {
          errorMessage = t('auth.emailAlreadyInUse', 'Email già in uso');
        } else if (result.error.includes('invalid-email')) {
          errorMessage = t('auth.invalidEmail', 'Formato email non valido');
        } else if (result.error.includes('weak-password')) {
          errorMessage = t('auth.weakPassword', 'Password troppo debole');
        } else {
          errorMessage = result.error;
        }
        
        setErrorMsg(errorMessage);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrorMsg(error.message || t('common.error', 'Errore sconosciuto'));
    } finally {
      // Rimuove lo spinner e riabilita il bottone
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>In&Out</Text>
      <Text style={styles.subtitle}>Registrazione</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Conferma Password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={displayName}
          onChangeText={handleDisplayNameChange}
        />
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupButtonText}>Registrati</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkContainer} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Hai già un account? Vai al Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  signupButton: {
    backgroundColor: '#007BFF',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007BFF',
    fontSize: 14,
  },
});

export default SignupScreen; 