import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';

// SPA only: Angular renders in the browser and calls the Go backend
// directly, so Analog's Angular compiler plugin is all we need (no SSR,
// no file routing, no Nitro server).
export default defineConfig(() => ({
  plugins: [tailwindcss(), angular()],
  build: {
    target: ['es2020'],
    outDir: 'dist/solexpay-admin',
  },
  resolve: {
    mainFields: ['module'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test.ts'],
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/app/**/*.ts'],
      exclude: ['src/app/**/*.spec.ts', 'src/app/app.routes.ts', '**/*.d.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
}));
