import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Our Budget',
        short_name: 'Budget',
        description: 'Shared budget tracker',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0f14',
        theme_color: '#0b0f14',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Quick Add',
            short_name: 'Quick Add',
            url: '/quick-add',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /supabase\.co\/rest\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-rest' },
          },
          {
            urlPattern: /supabase\.co\/storage\//,
            handler: 'CacheFirst',
            options: { cacheName: 'supabase-storage' },
          },
        ],
      },
    }),
  ],
})
