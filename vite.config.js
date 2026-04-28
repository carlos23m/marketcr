import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'SINPEpay',
        short_name: 'SINPEpay',
        description: 'Herramienta de cobros para negocios costarricenses',
        theme_color: '#1D9E75',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/dashboard',
        icons: [
          { src: 'icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Nuevo cobro',     url: '/create-link', icons: [{ src: 'icons/shortcut-cobro.png', sizes: '96x96' }] },
          { name: 'Punto de venta',  url: '/pos',         icons: [{ src: 'icons/shortcut-pos.png',   sizes: '96x96' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase\.co\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: /\/p\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'payment-pages' },
          },
        ],
      },
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
  },
})
