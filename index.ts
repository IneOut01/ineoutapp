// Importare react-native-get-random-values assolutamente per primo
import 'react-native-get-random-values';

// Log di avvio
console.log('APP STARTUP: index.ts - primo file caricato');

import { AppRegistry } from 'react-native';
import './spacing'; // Importa SPACING come globale prima di qualsiasi altro componente
import App from './App';

// Assicura che SPACING sia disponibile globalmente
import { SPACING } from './spacing';
global.SPACING = SPACING;

console.log('APP STARTUP: index.ts - registrazione componente root');

// Register the app
AppRegistry.registerComponent('IneOut', () => App);

// Verifico il contenuto
