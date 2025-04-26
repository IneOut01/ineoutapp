import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { login } from '../auth/authService';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGoogleAuth } from '../auth/googleSignIn';
import { useTranslation } from '../contexts/LanguageContext';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Aggiorniamo la definizione dei tipi per la navigazione
type ProfileStackParamList = {
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Login'>;

// Regex per validare email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Lunghezza minima password
const MIN_PASSWORD_LENGTH = 6;

// Get device dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 360;

// Dimensioni font responsive in base alle dimensioni dello schermo
const getFontSize = (size: number) => {
  if (isSmallDevice) return size * 0.85;
  return size;
};

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Stati per errori specifici di validazione
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Utilizziamo il nuovo hook per Google Auth
  const { request, promptAsync, isGoogleAuthConfigured } = useGoogleAuth();
  const { setGuest, exitGuestMode, refreshUserData, resetAuthState } = useAuth();

  // Determina se il pulsante Google deve essere attivo
  const isGoogleButtonEnabled = isGoogleAuthConfigured;

  // Log di debug per verificare la configurazione
  useEffect(() => {
    console.log("==== AUTH SETTINGS ====");
    console.log("Platform:", Platform.OS);
    console.log("Google Auth configured:", isGoogleAuthConfigured);
    console.log("Request client ID available:", !!request?.clientId);
    console.log("========================");
  }, [isGoogleAuthConfigured, request]);
  
  // Funzione per navigare alla home dopo il login
  const navigateToHomeAfterLogin = () => {
    // Reset completo dello stato di autenticazione
    resetAuthState();

    // Breve timeout per permettere il reset dello stato
    setTimeout(async () => {
      // Forzare l'aggiornamento dei dati utente dopo il login
      refreshUserData();
      
      console.log("🔑 Login completato, navigazione alla home...");
      
      // Usiamo CommonActions.reset per resettare completamente lo stack di navigazione
      // e andare alla tab principale Home
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'HomeStack' // Naviga alla tab HomeStack invece di Profile
            },
          ],
        })
      );
      
      // Mostra messaggio di benvenuto
      Alert.alert(
        t('auth.welcome', 'Benvenuto!'),
        t('auth.loginSuccess', 'Accesso effettuato con successo')
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
  
  // Gestione cambio email con validazione
  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };
  
  // Gestione cambio password con validazione
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  // Funzione per gestire il login
  const handleLogin = async () => {
    // Valida entrambi i campi
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    // Se uno dei due non è valido, interrompi
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Mostra lo spinner e disabilita il bottone
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Login riuscito, naviga alla home
        navigateToHomeAfterLogin();
      } else if (result.error) {
        // Gestisce errori specifici
        let errorMessage = '';
        
        if (result.error.includes('user-not-found')) {
          errorMessage = t('auth.userNotFound', 'Utente non trovato');
        } else if (result.error.includes('wrong-password') || result.error.includes('invalid-credential')) {
          errorMessage = t('auth.invalidCredentials', 'Credenziali non valide');
        } else if (result.error.includes('too-many-requests')) {
          errorMessage = t('auth.tooManyRequests', 'Troppi tentativi. Riprova più tardi');
        } else if (result.error.includes('invalid-email')) {
          errorMessage = t('auth.invalidEmail', 'Formato email non valido');
        } else {
          errorMessage = result.error;
        }
        
        setErrorMsg(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error.message || t('common.error', 'Errore sconosciuto'));
    } finally {
      // Rimuove lo spinner e riabilita il bottone
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      
      const result = await promptAsync();
      
      if (result.success) {
        // Login Google riuscito
        navigateToHomeAfterLogin();
      } else if (!result.success) {
        if (result.error === 'login_cancelled') {
          // Login cancellato dall'utente, non mostrare errore
          Alert.alert(
            t('common.cancel', 'Annullato'),
            t('auth.loginCancelled', 'Login annullato')
          );
        } else {
          // Mostra errore diverso da cancellazione
          console.error('Google login error:', result.error, result.message || '');
          setErrorMsg(result.message || `Errore: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in Google login:', error);
      setErrorMsg(error.message || t('auth.unexpectedError', 'Errore imprevisto durante il login'));
    } finally {
      setLoading(false);
    }
  };

  // Handle per l'avvio della modalità ospite
  const handleGuestMode = () => {
    setGuest(true);
    // Reimposta lo stack di navigazione alla Home
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeStack' as any }]
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>In&Out</Text>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder={t('auth.email', 'Email')}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor={COLORS.placeholder}
                />
                {emailError ? (
                  <Text 
                    style={styles.fieldErrorText}
                    numberOfLines={2}
                  >
                    {emailError}
                  </Text>
                ) : null}
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  placeholder={t('auth.password', 'Password')}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  editable={!loading}
                  placeholderTextColor={COLORS.placeholder}
                />
                {passwordError ? (
                  <Text 
                    style={styles.fieldErrorText}
                    numberOfLines={2}
                  >
                    {passwordError}
                  </Text>
                ) : null}
              </View>
              
              {errorMsg ? (
                <View style={styles.errorContainer}>
                  <Text 
                    style={styles.errorText} 
                    numberOfLines={3}
                  >
                    {errorMsg}
                  </Text>
                </View>
              ) : null}
              
              <TouchableOpacity 
                style={[
                  styles.loginButton, 
                  (loading || emailError || passwordError) && styles.disabledButton
                ]} 
                onPress={handleLogin}
                disabled={loading || !!emailError || !!passwordError}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('auth.login', 'Accedi')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('common.or', 'oppure')}</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleBtn, 
                  (!isGoogleButtonEnabled || loading) && styles.disabledButton
                ]}
                onPress={handleGoogleLogin}
                disabled={!isGoogleButtonEnabled || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.googleTxt}>
                    {t('auth.loginWithGoogle', 'Accedi con Google')}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkContainer} 
                onPress={() => navigation.navigate('Signup')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.linkText}>{t('auth.noAccount', 'Non hai un account? Registrati')}</Text>
              </TouchableOpacity>

              {/* Pulsante per la modalità ospite */}
              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestMode}
                disabled={loading}
              >
                <MaterialCommunityIcons name="account-question" size={20} color={COLORS.textSecondary} />
                <Text style={styles.guestButtonText}>Continua come ospite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.padding.large,
    backgroundColor: '#f5f5f5',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.margin.xlarge,
  },
  title: {
    fontSize: getFontSize(32),
    fontWeight: 'bold',
    marginBottom: SPACING.margin.medium,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.padding.large,
    borderRadius: SPACING.radius.medium,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: SPACING.margin.medium,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.radius.small,
    paddingHorizontal: SPACING.padding.medium,
    fontSize: getFontSize(16),
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: COLORS.error,
    fontSize: getFontSize(12),
    marginTop: SPACING.margin.xs,
    marginLeft: SPACING.margin.xs,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SPACING.radius.small,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.margin.small,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: COLORS.primary + '80', // Aggiunge trasparenza
    opacity: 0.8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: getFontSize(16),
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: SPACING.padding.medium,
    borderRadius: SPACING.radius.small,
    marginBottom: SPACING.margin.medium,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: getFontSize(14),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.margin.large,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.margin.medium,
    color: COLORS.textSecondary,
    fontSize: getFontSize(14),
  },
  googleBtn: {
    backgroundColor: '#4285F4',
    borderRadius: SPACING.radius.small,
    padding: SPACING.padding.medium,
    alignItems: 'center',
    marginTop: SPACING.margin.medium,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  googleTxt: {
    color: COLORS.white,
    fontSize: getFontSize(16),
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: SPACING.margin.large,
    alignItems: 'center',
    paddingVertical: SPACING.padding.small,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: getFontSize(14),
    fontWeight: '500',
  },
  guestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestButtonText: {
    marginLeft: 6,
    color: COLORS.textSecondary,
    fontSize: 14,
  }
});

export default LoginScreen; 