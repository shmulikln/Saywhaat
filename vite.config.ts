import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // ESSENTIAL FOR MOBILE: This makes asset paths relative (./) instead of absolute (/)
    base: './',

    server: {
      port: 3000,
      host: '0.0.0.0', // Allows testing on local network
    },

    plugins: [react()],

    define: {
      // Maps your Gemini keys so they are accessible via process.env in your code
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        // Sets up the '@' alias to point to your root directory
        '@': path.resolve(__dirname, './'),
      },
    },

    build: {
      // Ensures the output matches what Capacitor is looking for
      outDir: 'dist',
      
      // Prevents issues with large assets in mobile builds
      chunkSizeWarningLimit: 1600,
    },
  };
});