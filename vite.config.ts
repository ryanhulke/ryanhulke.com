import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import CONFIG from './gitprofile.config';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  base: CONFIG.base || '/',
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  assetsInclude: ['**/*.onnx', '**/*.wasm'],
  plugins: [
    react(),
    createHtmlPlugin({
      inject: {
        data: {
          metaTitle: CONFIG.seo.title,
          metaDescription: CONFIG.seo.description,
          metaImageURL: CONFIG.seo.imageURL,
        },
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*.wasm',
          dest: '.',
        },
        {
          // copy all the JS wrappers that dynamically import those binaries
          src: 'node_modules/onnxruntime-web/dist/*.jsep.mjs',
          dest: '.',
        },
        {
          // copy all the JS wrappers that dynamically import those binaries
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
          dest: '.',
        },
      ],
    }),
    ...(CONFIG.enablePWA
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            workbox: {
              navigateFallback: undefined,
            },
            includeAssets: ['logo.png'],
            manifest: {
              name: 'Portfolio',
              short_name: 'Portfolio',
              description: 'Personal Portfolio',
              icons: [
                {
                  src: 'logo.png',
                  sizes: '64x64 32x32 24x24 16x16 192x192 512x512',
                  type: 'image/png',
                },
              ],
            },
          }),
        ]
      : []),
  ],
  define: {
    CONFIG: CONFIG,
  },
});
