import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saywhaaat.app',
  appName: 'Say Whaaat?',
  webDir: 'dist', // Ensure this matches your build folder (e.g., 'build' or 'dist')
  server: {
    androidScheme: 'https'
  },
  android: {
    // This is the CRITICAL 2025 setting for Android 15+
    adjustMarginsForEdgeToEdge: 'auto'
  }
};

export default config;
