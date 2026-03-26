import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import packageJson from './package.json';

function seoInjector() {
  return {
    name: 'seo-injector',
    async transformIndexHtml(html: string) {
      try {
        let seoData: any = null;
        try {
          // Пытаемся получить актуальные настройки из базы данных во время сборки/запуска
          const res = await fetch('http://127.0.0.1:8080/webapi/seo/current');
          if (res.ok) {
            seoData = await res.json();
          }
        } catch (fetchErr) {
          console.log('[seo-injector] API недоступно, используются базовые теги.');
        }

        if (seoData && (seoData.title || seoData.description || seoData.og_image_url)) {
          let modifiedHtml = html;

          if (seoData.title) {
            modifiedHtml = modifiedHtml.replace(
              /<title>.*?<\/title>/gi,
              `<title>${seoData.title}</title>`,
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+name=["']title["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );

            const newTitleTags = [
              `<meta name="title" content="${seoData.title}" />`,
              `<meta property="og:title" content="${seoData.title}" />`,
              `<meta property="twitter:title" content="${seoData.title}" />`,
            ].join('\n  ');
            modifiedHtml = modifiedHtml.replace('</head>', `  ${newTitleTags}\n</head>`);
          }

          if (seoData.description) {
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );

            const newDescTags = [
              `<meta name="description" content="${seoData.description}" />`,
              `<meta property="og:description" content="${seoData.description}" />`,
              `<meta property="twitter:description" content="${seoData.description}" />`,
            ].join('\n  ');
            modifiedHtml = modifiedHtml.replace('</head>', `  ${newDescTags}\n</head>`);
          }

          if (seoData.og_image_url) {
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );
            modifiedHtml = modifiedHtml.replace(
              /<meta\s+property=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/gi,
              '',
            );

            const newImgTags = [
              `<meta property="og:image" content="${seoData.og_image_url}" />`,
              `<meta property="twitter:image" content="${seoData.og_image_url}" />`,
            ].join('\n  ');
            modifiedHtml = modifiedHtml.replace('</head>', `  ${newImgTags}\n</head>`);
          }

          modifiedHtml = modifiedHtml.replace('<!-- SEO_TAGS_PLACEHOLDER -->', '');

          return modifiedHtml;
        }
      } catch (e) {
        console.error('SEO Injector error:', e);
      }
      return html;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [seoInjector(), react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Base path - use '/' for standalone Docker deployment
  // Change to '/cabinet/' if serving from a sub-path
  base: '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Strip /api prefix: /api/cabinet/auth -> /cabinet/auth
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('node_modules/react/')
          )
            return 'vendor-react';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('@tanstack/react-table')) return 'vendor-table';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui/')) return 'vendor-radix';
          if (id.includes('@dnd-kit/')) return 'vendor-dnd';
          if (id.includes('@telegram-apps/') || id.includes('/@tma.js/')) return 'vendor-telegram';
          if (id.includes('/ogl/')) return 'vendor-webgl';
          if (id.includes('/cmdk/')) return 'vendor-cmdk';
          if (id.includes('twemoji') || id.includes('@twemoji/')) return 'vendor-twemoji';
          if (id.includes('/jsencrypt/') || id.includes('@kastov/')) return 'vendor-crypto';
          if (id.includes('@lottiefiles/')) return 'vendor-lottie';
          if (
            id.includes('/axios/') ||
            id.includes('/zustand/') ||
            id.includes('/clsx/') ||
            id.includes('/tailwind-merge/') ||
            id.includes('class-variance-authority') ||
            id.includes('/dompurify/')
          )
            return 'vendor-utils';
        },
      },
    },
  },
});
