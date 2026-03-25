const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @shopify/react-native-skia tem "react-native": "src/index.ts" no package.json,
// o que faz o Metro tentar resolver arquivos .ts crus e falhar em módulos opcionais
// (ex: Video). Aqui forçamos o Metro a usar o output compilado lib/module/index.js.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@shopify/react-native-skia') {
    return {
      filePath: require.resolve('@shopify/react-native-skia/lib/module/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
