import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
      cors: true,
      watch: {
        ignored: ['**/android/**', '**/dev-dist/**', '**/*.mp4']
      }
    },

    plugins: [
      react(),
      {
        name: 'dev-service-worker-cleaner',
        apply: 'serve' as const,
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && (req.url.startsWith('/sw.js') || req.url.startsWith('/dev-sw.js'))) {
              res.setHeader('Content-Type', 'application/javascript');
              res.end(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});
              `);
              return;
            }
            next();
          });
        }
      },
      VitePWA({
        injectRegister: null,
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false
        },
        manifest: {
          name: 'Say Whaaat?',
          short_name: 'SayWhaaat',
          description: 'A fun party game where you guess words from your friends\' descriptions.',
          theme_color: '#7c3aed',
          background_color: '#4c1d95',
          icons: [
            {
              src: 'android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],

    define: {

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