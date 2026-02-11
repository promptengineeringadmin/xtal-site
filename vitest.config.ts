import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/data": path.resolve(__dirname, "./data"),
      "@/contexts": path.resolve(__dirname, "./contexts"),
    },
  },
})
