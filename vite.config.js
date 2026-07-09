import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the entire app — symbols and fonts included — so AACASH is
      // fully functional with no network from the first visit.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      includeAssets: ['aacash-mark.svg', 'apple-touch-icon.png', 'favicon-64.png'],
      manifest: {
        name: 'AACASH — AAC communication board',
        short_name: 'AACASH',
        description:
          'A free, offline-first AAC communication board for children and non-speaking people in India. English + 6 Indian languages. Private by design.',
        lang: 'en-IN',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        categories: ['education', 'medical', 'accessibility'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
