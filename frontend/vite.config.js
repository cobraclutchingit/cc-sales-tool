import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@chakra-ui/react': path.resolve(__dirname, 'node_modules/@chakra-ui/react'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5007', // Updated port to 5007
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
