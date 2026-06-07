import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

export default defineConfig(({ mode }) => ({
  plugins: [
    analog({
      ssr: false,           // SPA — Angular renders in browser; Nitro only serves API routes
      nitro: {
        preset: 'node-server',
        routeRules: {
          '/api/**': { cors: false },
        },
      },
    }),
  ],
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
