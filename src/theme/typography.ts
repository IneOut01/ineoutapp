import { TextStyle } from 'react-native';

type FontWeight = 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800';

interface TypographyStyle extends TextStyle {
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  letterSpacing?: number;
}

export const TYPOGRAPHY = {
  // Stili di testo
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  subtitle1: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  subtitle2: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  
  // Famiglie di font
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System'
  },
  
  // Dimensioni di font
  fontSize: {
    tiny: 10,
    small: 12,
    normal: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24
  }
}; 