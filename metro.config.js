const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// withUniwindConfig must be the outermost wrapper
module.exports = withUniwindConfig(config, {
  // relative path to your global.css file
  cssEntryFile: './global.css',
  // (optional) path where we gonna auto-generate typings
  dtsFile: './uniwind-types.d.ts'
});
