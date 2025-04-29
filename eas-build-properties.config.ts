import { ConfigPlugin } from '@expo/config-plugins';

const config: ConfigPlugin = (config) => {
  config.android = {
    ...config.android,
    compileSdkVersion: 35,
    targetSdkVersion: 35,
    buildToolsVersion: "34.0.0"
  };
  return config;
};

export default config;
