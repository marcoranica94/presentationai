import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // base viene sovrascritto in produzione dal nome del repo GitHub
  // es: '/presentationai/' se il repo si chiama presentationai
  base: process.env.NODE_ENV === 'production' ? '/presentationai/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
