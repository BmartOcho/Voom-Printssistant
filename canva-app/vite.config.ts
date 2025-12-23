import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Try to load SSL certificates for HTTPS (optional)
let httpsConfig: { key: string; cert: string } | undefined = undefined;
try {
  const key = fs.readFileSync(path.resolve(__dirname, 'cert.key'), 'utf8');
  const cert = fs.readFileSync(path.resolve(__dirname, 'cert.crt'), 'utf8');
  httpsConfig = { key, cert };
} catch (error) {
  // SSL certificates not found, will use HTTP
  console.log('SSL certificates not found. Running without HTTPS. Generate certs with: npx mkcert create-ca && npx mkcert create-cert');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    // Enable HTTPS for Canva app development (certificates are loaded above)
    https: httpsConfig,
    // Configure CORS to allow Canva to load the app
    cors: {
      origin: [
        'https://www.canva.com',
        'https://canva.com',
        'https://app-aag5kzigttw.canva-apps.com'
      ],
      credentials: true,
    },
    // Enable HMR (Hot Module Replacement) with secure websockets
    hmr: {
      protocol: httpsConfig ? 'wss' : 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
})
