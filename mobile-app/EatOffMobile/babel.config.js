module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Modern Babel plugins (replaces deprecated proposal plugins)
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-numeric-separator',
      '@babel/plugin-transform-optional-catch-binding',
      '@babel/plugin-transform-async-generator-functions',
      '@babel/plugin-transform-object-rest-spread'
    ]
  };
};
