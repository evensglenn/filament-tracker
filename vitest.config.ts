import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Unit and emulator tests; the browser tests in e2e/ run with Playwright (`npm run test:e2e`)
export default defineConfig(env => mergeConfig(viteConfig(env), {
  test: { exclude: [...configDefaults.exclude, 'e2e/**'] },
}));
