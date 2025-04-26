// Importare react-native-get-random-values assolutamente per primo
import 'react-native-get-random-values';

// Log di avvio
console.log('APP STARTUP: index.ts - primo file caricato');

import { registerRootComponent } from 'expo';
import './spacing'; // Importa SPACING come globale prima di qualsiasi altro componente
import App from './App';

// Assicura che SPACING sia disponibile globalmente
import { SPACING } from './spacing';
global.SPACING = SPACING;

console.log('APP STARTUP: index.ts - registrazione componente root');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Verifico il contenuto
