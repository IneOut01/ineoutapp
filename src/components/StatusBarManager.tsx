import React from 'react';
import { StatusBar, Platform, View, StyleSheet } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { COLORS } from '../theme/colors';

interface StatusBarManagerProps {
  barStyle?: 'light-content' | 'dark-content';
  backgroundColor?: string;
  translucent?: boolean;
}

/**
 * Componente per gestire la StatusBar in modo coerente su tutte le schermate
 * Garantisce che la barra di stato sia sempre visibile e correttamente configurata
 */
const StatusBarManager: React.FC<StatusBarManagerProps> = ({
  barStyle = 'dark-content',
  backgroundColor = 'transparent',
  translucent = true
}) => {
  // Ottieni l'altezza della status bar per garantire il padding corretto
  const statusBarHeight = getStatusBarHeight(true);
  
  return (
    <>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={backgroundColor}
        translucent={translucent}
      />
      {translucent && (
        <View 
          style={[
            styles.statusBarPlaceholder, 
            { height: statusBarHeight, backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : COLORS.background }
          ]} 
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  statusBarPlaceholder: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  }
});

export default StatusBarManager; 