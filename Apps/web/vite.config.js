import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev only: forward Socket.IO to the existing server.js (port 3000).
export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: { '/socket.io': { target: 'http://localhost:3000', ws: true } },
    host:true 
  
  },
})
