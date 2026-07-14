import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["domain/**/*.test.ts", "domain/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["domain/**/*.ts"],
      exclude: [
        "domain/**/*.test.ts",
        "domain/**/*.spec.ts",
        "domain/index.ts",
      ],
    },
  },
});
