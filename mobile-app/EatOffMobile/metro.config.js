const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced Metro configuration for stable builds
config.resolver = {
  ...config.resolver,
  alias: {
    'react': require.resolve('react'),
    'react-native': require.resolve('react-native'),
  },
  platforms: ['ios', 'android', 'native', 'web'],
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'wasm'],
  assetExts: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'mp4', 'webm', 'wav', 'mp3', 'm4a', 'aac', 'oga', 'ttf', 'otf', 'woff', 'woff2', 'eot', 'ico', 'cur', 'pdf', 'html', 'txt', 'md'],
};

// Optimize transformer for production builds
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: false,
    toplevel: false,
    compress: {
      drop_console: true,
    },
  },
};

// Cache configuration for faster builds
config.cacheStores = [
  {
    name: 'metro-cache',
    get: () => null,
    set: () => null,
  },
];

module.exports = config;