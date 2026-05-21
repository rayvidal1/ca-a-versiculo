const { expo } = require('./app.json');

const androidAppId =
  process.env.EXPO_PUBLIC_BIBLU_ANDROID_APP_ID ||
  'ca-app-pub-3940256099942544~3347511713'; // test App ID (substituir em prod)

const iosAppId =
  process.env.EXPO_PUBLIC_BIBLU_IOS_APP_ID ||
  'ca-app-pub-3940256099942544~1458002511'; // test App ID (substituir em prod)

module.exports = {
  expo: {
    ...expo,
    plugins: [
      ...expo.plugins,
      [
        'react-native-google-mobile-ads',
        {
          androidAppId,
          iosAppId,
        },
      ],
    ],
  },
};
