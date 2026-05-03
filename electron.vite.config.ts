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
          dataPanelPreload: "src/preload/dataPanelPreload.ts",
          debugPreload: "src/preload/debugPreload.ts",
          petPreload: "src/preload/petPreload.ts",
          reportPreload: "src/preload/reportPreload.ts"
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
          dataPanel: resolve("src/renderer/data-panel.html"),
          debug: resolve("src/renderer/debug.html"),
          pet: resolve("src/renderer/index.html"),
          report: resolve("src/renderer/report.html")
        }
      }
    },
    plugins: [react()]
  }
})
