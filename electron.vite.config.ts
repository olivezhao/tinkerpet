import { defineConfig } from "electron-vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: "src/main/index.ts"
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          debugPreload: "src/preload/debugPreload.ts",
          petPreload: "src/preload/petPreload.ts"
        },
        output: {
          chunkFileNames: "[name]-[hash].cjs",
          entryFileNames: "[name].cjs",
          format: "cjs"
        }
      }
    }
  },
  renderer: {
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true
    },
    build: {
      rollupOptions: {
        input: {
          debug: resolve("src/renderer/debug.html"),
          pet: resolve("src/renderer/index.html")
        }
      }
    },
    plugins: [react()]
  }
})
