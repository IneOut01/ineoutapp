const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggiungiamo react-native-webview ai moduli da considerare
config.resolver.extraNodeModules = {
  'react-native-webview': require.resolve('react-native-webview'),
  'react-native-maps': require.resolve('react-native-maps'),
};

module.exports = config; 