import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Service Worker 自動更新
      includeAssets: [],           // public 配下の画像はプリキャッシュしない
      manifest: {
        name: 'TimeWheel',
        short_name: 'TimeWheel',
        description: 'あなたのスケジュールとToDoを整理し、自動生成してくれるアプリ。',
        theme_color: '#0b0f29',
        background_color: '#0b0f29',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        "screenshots": [
          {
            "src": "/screenshot1.png",
            "sizes": "1050x1393",
            "type": "image/png",
            "form_factor": "wide"
          },
          {
            "src": "/screenshot2.png",
            "sizes": "954x1421",
            "type": "image/png"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
