// Adds the Google Maps keys for real phone builds (EAS) when they're set. Expo Go doesn't need them.
//   GOOGLE_MAPS_ANDROID_KEY          Maps SDK for Android key (restricted to the app's package)
//   EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY  Maps SDK for iOS key; without it iPhones show Apple Maps
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(process.env.GOOGLE_MAPS_ANDROID_KEY && {
      config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY } },
    }),
  },
  ios: {
    ...config.ios,
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY && {
      config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY },
    }),
  },
});
