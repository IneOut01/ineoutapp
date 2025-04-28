require('dotenv').config();
module.exports = function (api) {
  api.cache(true);
  return {
    module.exports = {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        ['@babel/plugin-transform-optional-catch-binding'],
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }],
      [
        'module-resolver',
        {
          alias: {
            '@spacing': './spacing.js',
            '@theme': './src/theme',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@constants': './src/constants',
          },
        },
      ],
      // ⬇️ DEVE essere l'ULTIMO plugin della lista
      'react-native-reanimated/plugin',
    ],
  };
};