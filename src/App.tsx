import React from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

/**
 * Componente principale dell'applicazione
 * 
 * Configura tutti i provider di context necessari:
 * - AuthProvider: gestisce l'autenticazione (incl. modalità ospite)
 */
const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
