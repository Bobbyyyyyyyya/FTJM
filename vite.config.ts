import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), {
      name: 'sw-version-injector',
      closeBundle() {
        const swPath = path.resolve(__dirname, 'dist/sw.js');
        if (fs.existsSync(swPath)) {
          let swContent = fs.readFileSync(swPath, 'utf8');
          // Generate a unique build ID based on the timestamp of the compilation
          const buildId = Date.now().toString();
          // Replace the static CACHE_NAME line with our dynamic one
          swContent = swContent.replace(
            /const CACHE_NAME\s*=\s*['"`](.*?)['"`];/,
            `const CACHE_NAME = 'ftjm-build-${buildId}';`
          );
          fs.writeFileSync(swPath, swContent, 'utf8');
          console.log(`[SW Injector] Injected cache name: 'ftjm-build-${buildId}' into dist/sw.js`);
        } else {
          console.warn('[SW Injector] dist/sw.js not found!');
        }
      }
    }, cloudflare()],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      target: 'es2020',
      rollupOptions: {
        output: {
          compact: true,
          entryFileNames: 'assets/app-secure.js',
          chunkFileNames: 'assets/secure-[hash].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      legalComments: 'none',
      target: 'es2020',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});