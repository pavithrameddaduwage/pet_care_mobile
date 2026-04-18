const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  /node_modules\/react-native-maps\/lib\/components\/decorateMapComponent\.ts$/,
];

module.exports = config;
