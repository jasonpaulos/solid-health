/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
    extraNodeModules: {
      stream: require.resolve('readable-stream'),
      'solid-auth-cli': require.resolve('@jasonpaulos/solid-auth-client'),
      'solid-auth-client': require.resolve('@jasonpaulos/solid-auth-client'),
    },
  },
};
