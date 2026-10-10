import { Capacitor } from '@capacitor/core';

// Config for your web app
const webConfig = {
  apiKey: "AIzaSyBUeac5d6jE6k_6hIv1Pw5pp3cVE9XasFE",
  authDomain: "saywhaaat.firebaseapp.com",
  databaseURL: "https://saywhaaat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "saywhaaat",
  storageBucket: "saywhaaat.firebasestorage.app",
  messagingSenderId: "325170785232",
  appId: "1:325170785232:web:e29b1f1eda863c1cd367d5",
  appCheckSiteKey: "6Lcz9jwsAAAAAJt83xU3UJs_-D0784SfLv9jaN6x"
};

// Config for your Android app
const androidConfig = {
  ...webConfig, // The rest of the config is the same
  apiKey: "AIzaSyBeiC_YFfzUmMAKNgukdGC38HmwweWpYyk",
};

/**
 * Dynamically returns the correct Firebase configuration based on the platform.
 */
export const getFirebaseConfig = () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return androidConfig;
  }
  return webConfig;
};
