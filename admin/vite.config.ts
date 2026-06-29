import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin dev server runs on 3001 so it never collides with the user
// dashboard (3000) or the API (8000). `host: true` exposes it on the LAN.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
    strictPort: true,
  },
})
