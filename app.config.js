require('dotenv').config();

export default {
  expo: {
    name: 'FlippersLog',
    slug: 'flipperslog',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    extra: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    },
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.flipperslog.app',
      infoPlist: {
        NSCameraUsageDescription: 'This app needs camera access to scan pinball scores.'
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.flipperslog.app',
      permissions: ['CAMERA']
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow FlippersLog to access your camera to scan pinball scores.'
        }
      ]
    ],
    scheme: 'flipperslog'
  }
};
