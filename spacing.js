// File di fallback per SPACING
// Definisce spacing globale per l'app, facilmente accessibile da qualsiasi punto
export const SPACING = {
  // Valori base
  xs: 4,
  sm: 8, 
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Dimensioni di margine
  margin: {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  
  // Dimensioni di padding
  padding: {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  
  // Border radius
  borderRadius: {
    tiny: 4,
    small: 8,
    medium: 12,
    large: 16,
    round: 999,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  
  // Alias per borderRadius
  radius: {
    tiny: 4,
    small: 8,
    medium: 12,
    large: 16,
    round: 999,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  }
};

// Espone SPACING come parte di global per accesso di emergenza
if (typeof global !== 'undefined') {
  global.SPACING = SPACING;
}

export default SPACING; 