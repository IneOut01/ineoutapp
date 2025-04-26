import { Platform, StatusBar } from 'react-native';
import { getStatusBarHeight as getHeightFromPackage } from 'react-native-status-bar-height';

export function getStatusBarHeight(): number {
  if (Platform.OS === 'ios') {
    return getHeightFromPackage(true);
  }
  return StatusBar.currentHeight || 24;
} 