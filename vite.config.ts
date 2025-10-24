import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,ts}",
      "src/**/__tests__/**/*.{js,ts}",
      "src/**/tests/**/*.{js,ts}",
    ],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test-setup.ts",
        "src/**/*.d.ts",
        "dist/",
        "server/",
      ],
    },
  },
});
