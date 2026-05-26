import { defineConfig } from 'vitest/config';
import path from 'path';

// Unit tests for pure domain logic (lib/transitions, etc.).
// E2E lives in e2e/ and runs under Playwright — excluded here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
