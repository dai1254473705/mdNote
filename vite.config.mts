import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            rollupOptions: {
              external: ['@vitejs/plugin-react']
            }
          }
        }
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload()
        },
      }
    ]),
    electronRenderer()
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-dialog'],
          'editor': ['marked', 'highlight.js', 'prettier'],
          'diagram': ['mermaid']
        }
      }
    }
  }
})
