import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // La repo GitHub si chiama "Versemove": su GitHub Pages il sito vive
  // sotto quel sottopercorso, quindi gli asset devono puntare lì in produzione.
  base: process.env.GITHUB_PAGES ? '/Versemove/' : '/',
})
