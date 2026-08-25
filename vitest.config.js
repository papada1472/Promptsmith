import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // No global setup — each test file handles its own mocking
    setupFiles: [],
    // Test file include pattern — only test files under src/main/tests
    include: ["src/main/tests/**/*.test.{js,ts}"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/main/**/*.js",
        "!src/main/tests/**",
        "!src/main/main.js",
      ],
      thresholds: {
        global: {
          statements: 75,
          branches: 75,
          functions: 75,
          lines: 75,
        },
        "src/main/services/metricsService.js": { statements: 85 },
        "src/main/clipboardFlow.js": { statements: 85 },
      },
    },
  },
});