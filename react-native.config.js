module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // disable autolinking for iOS (handled by Podfile)
        android: null, // disable autolinking for Android (using fonts.gradle)
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
