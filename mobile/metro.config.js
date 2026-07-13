const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Force Metro to use the top-level react-async-hook (v4). The nested v3.6.1
// from react-native-country-picker-modal has a broken `module` entry for web.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-async-hook": path.resolve(__dirname, "node_modules/react-async-hook"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
