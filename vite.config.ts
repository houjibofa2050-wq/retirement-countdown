import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages serves this project beneath /retirement-countdown/.
  base: '/retirement-countdown/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '退休倒计时 · 倒数自由',
        short_name: '退休倒计时',
        description: '一键算出离退休还剩下的工作日、自然日与进度，纯本地保存。',
        theme_color: '#ff8a3d',
        background_color: '#fffaf4',
        display: 'standalone',
        start_url: './',
        lang: 'zh-CN',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ]
})
