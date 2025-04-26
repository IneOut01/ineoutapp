import React, { useEffect } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

interface StatusBarManagerProps {
  style?: 'auto' | 'light' | 'dark';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

/**
 * Componente per gestire in modo uniforme la StatusBar in tutta l'app
 * Combina StatusBar di Expo con configurazioni aggiuntive per Android
 */
const StatusBarManager: React.FC<StatusBarManagerProps> = ({
  style = 'dark',
  backgroundColor = 'transparent',
  translucent = true,
  hidden = false,
}) => {
  const insets = useSafeAreaInsets();

  // Configura la StatusBar per Android a livello nativo
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(translucent);
      RNStatusBar.setBackgroundColor(backgroundColor);
      
      if (hidden) {
        RNStatusBar.setHidden(true);
      } else {
        RNStatusBar.setHidden(false);
        RNStatusBar.setBarStyle(style === 'light' ? 'light-content' : 'dark-content');
      }
    }
  }, [backgroundColor, translucent, style, hidden]);

  // Usa ExpoStatusBar che funziona bene su entrambe le piattaforme
  return (
    <>
      <ExpoStatusBar 
        style={style} 
        backgroundColor={backgroundColor} 
        translucent={translucent} 
        hidden={hidden}
      />
      {Platform.OS === 'ios' && backgroundColor !== 'transparent' && !hidden && (
        <View style={{ 
          height: insets.top,
          backgroundColor: backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1
        }} />
      )}
    </>
  );
};

export default StatusBarManager; 