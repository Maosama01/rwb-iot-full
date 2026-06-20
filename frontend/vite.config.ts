import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or your framework plugin

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000, // Change this to your preferred port
    strictPort: true, // Optional: true makes Vite fail if the port is already in use
  }
})
