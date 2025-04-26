export const COLORS = {
  // Primary colors
  primary: '#7B2CBF',
  primaryDark: '#5A189A',
  primaryLight: '#B762FF',
  
  // Secondary/accent colors
  secondary: '#FFD60A',
  secondaryDark: '#E6C108',
  secondaryLight: '#FFE03A',
  
  // Neutral colors
  black: '#000000',
  darkGrey: '#333333',
  grey: '#888888',
  lightGrey: '#DDDDDD',
  white: '#FFFFFF',
  
  // Background colors
  background: '#E0F7F5',
  aquaLight: '#E0F7F5',
  card: '#FFFFFF',
  
  // Status colors
  success: '#38A169',
  info: '#17a2b8',
  warning: '#F6AD55',
  error: '#E53E3E',
  errorLight: '#FFE5E5',
  
  // Text colors
  textPrimary: '#333333',
  textSecondary: '#555555',
  textTertiary: '#777777',
  textLight: '#FFFFFF',
  
  // Border colors
  border: '#DDDDDD',
  divider: '#EEEEEE',
  
  // Gradient colors
  gradientStart: '#7B2CBF',
  gradientEnd: '#9D4EDD',
  
  // Gradients
  backgroundGradientStart: '#F9F9F9',
  backgroundGradientEnd: '#FFFFFF',
  
  // Utility colors
  danger: '#E53E3E',
  destructive: '#E53E3E',
  
  // UI elements
  placeholder: '#888888',
  disabled: '#E9E9E9',
  cardBg: '#F9F9F9',
  
  // Aliases per la compatibilità con il nuovo schema
  accent: '#FFD60A',
  text: '#333333'
};

// Esporta anche i nuovi nomi per compatibilità con la nuova implementazione
export const colors = {
  primary: '#7B2CBF',
  accent: '#FFD60A',
  background: '#E0F7F5',
  text: '#333333',
};

// Estensione dei colori per retrocompatibilità
export const EXTENDED_COLORS = {
  ...COLORS,
  // Aggiungi qui eventuali colori aggiuntivi se necessari
};

export default COLORS; 