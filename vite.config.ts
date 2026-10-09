import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import pkg from './package.json';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        // version.json next to the app: an open app compares it to its own version (useUpdateCheck)
        name: 'version-file',
        apply: 'build',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: pkg.version }) });
        },
      },
    ],
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Libraries in their own files: they download in parallel, and after a deploy the
          // browser only fetches the (small) app code again, the rest stays cached
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/@firebase/firestore') || id.includes('/@firebase/webchannel-wrapper')) return 'firestore';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react';
            if (id.includes('/motion') || id.includes('/framer-motion/')) return 'motion';
            return 'vendor';
          },
        },
      },
    },
    define: {
      // Shown in the footer; bump the version in package.json with every change
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Own fixed port: apps sharing localhost:5173 also share service workers and storage
      port: 5180,
      strictPort: true,
      // IPv4, like the emulators: some browsers resolve localhost to 127.0.0.1, others to ::1
      host: '127.0.0.1',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
