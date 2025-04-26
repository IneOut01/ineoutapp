import { Platform, StatusBar, Dimensions } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';

/**
 * Calcola e restituisce l'altezza della status bar.
 * Su Android, utilizza l'altezza della barra di stato.
 * Su iOS, aggiunge uno spazio aggiuntivo per i dispositivi con notch.
 *
 * @returns {number} Altezza della status bar in pixel
 */
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    return isIphoneX() ? 44 : 20;
  }
  
  // Per Android, utilizziamo l'altezza effettiva della status bar
  return StatusBar.currentHeight || 0;
};

/**
 * Calcola e restituisce l'altezza sicura per la parte superiore della schermata,
 * tenendo conto della status bar e di eventuali notch.
 * 
 * @returns {number} Altezza sicura per la parte superiore in pixel
 */
export const getSafeAreaTopHeight = (): number => {
  const statusBarHeight = getStatusBarHeight();
  
  // Su iPhone X e modelli successivi, aggiungiamo uno spazio aggiuntivo
  if (Platform.OS === 'ios' && isIphoneX()) {
    return statusBarHeight + 24; // Valore empirico per lo spazio notch
  }
  
  return statusBarHeight + 10; // Aggiungi un piccolo padding per sicurezza
};

/**
 * Calcola e restituisce il padding superiore consigliato per le schermate,
 * in base al dispositivo e alla presenza di notch.
 * 
 * @returns {number} Padding superiore consigliato in pixel
 */
export const getRecommendedTopPadding = (): number => {
  const { height } = Dimensions.get('window');
  
  // Per schermi molto piccoli, riduciamo il padding
  if (height < 700) {
    return getStatusBarHeight() + 4;
  }
  
  return getSafeAreaTopHeight();
}; 