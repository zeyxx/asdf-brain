import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['test/**/*.test.js', 'lib/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'lib/cynic/**/*.js',
      ],
      exclude: [
        'lib/cynic/**/*.test.js',
        '**/node_modules/**',
      ],
      // Target: 30% coverage
      thresholds: {
        statements: 15,
        branches: 10,
        functions: 15,
        lines: 15,
      },
    },

    // Environment
    environment: 'node',

    // Globals
    globals: true,

    // Timeout (φ-based: ~97s)
    testTimeout: 97000,

    // Reporter
    reporters: ['verbose'],
  },
});
