import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under any repo name.
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never);
