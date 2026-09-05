import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project-page path — update if the repo is renamed.
  base: '/premier_league_table_bet/',
  plugins: [react(), tailwindcss()],
})
