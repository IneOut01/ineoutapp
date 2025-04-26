import { SPACING } from '../theme/spacing';

// Re-export di SPACING per assicurare che sia accessibile ovunque
export { SPACING };

// Dimensioni schermo
export const window = {
  width: 0,
  height: 0,
};

// Layout constants
export const LAYOUT = {
  screenPadding: SPACING.screenPadding,
  headerHeight: 56,
  tabBarHeight: 60,
  borderRadius: SPACING.borderRadius,
  radius: SPACING.radius,
}; 