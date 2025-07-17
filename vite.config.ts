// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or vue/svelte

export default defineConfig({
  plugins: [react()],
  base: '/', // MUST be '/' for Vercel
})
