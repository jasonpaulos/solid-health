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
    extraNodeModules: {
      stream: require.resolve('readable-stream'), // required by n3
      'solid-auth-cli': require.resolve('@jasonpaulos/solid-auth-client/lib/index'),
      'solid-auth-client': require.resolve('@jasonpaulos/solid-auth-client/lib/index'),
    },
  },
};
