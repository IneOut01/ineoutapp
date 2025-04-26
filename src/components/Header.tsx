import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { getStatusBarHeight } from '../utils/statusBarHeight';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'in&out' }) => {
  const statusBarHeight = getStatusBarHeight();
  
  return (
    <View style={[
      styles.container, 
      { paddingTop: Platform.OS === 'ios' ? statusBarHeight : StatusBar.currentHeight || 0 }
    ]}>
      <Text style={styles.logoText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoText: {
    color: COLORS.black,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
});

export default Header; 