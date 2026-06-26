import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    root: 'src/client',
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            common: path.resolve(__dirname, 'src/common'),
        },
    },
    server: {
        host: true,
        port: 3001,
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
            },
        },
    },
});
