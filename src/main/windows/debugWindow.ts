import { BrowserWindow } from "electron"
import { join } from "node:path"

const DEBUG_WINDOW_WIDTH = 460
const DEBUG_WINDOW_HEIGHT = 620
const DEBUG_RENDERER_ENTRY = "/debug.html"

function getDevRendererUrl(entry: string): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (!rendererUrl) {
    return ""
  }

  return new URL(entry, rendererUrl).toString()
}

export function createDebugWindow(): BrowserWindow {
  const debugWindow = new BrowserWindow({
    height: DEBUG_WINDOW_HEIGHT,
    title: "TinkerPet Debug Panel",
    width: DEBUG_WINDOW_WIDTH,
    webPreferences: {
      preload: join(__dirname, "../preload/debugPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  debugWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `TinkerPet debug window failed to load ${validatedURL}: ${errorCode} ${errorDescription}`
      )
    }
  )

  if (process.env.ELECTRON_RENDERER_URL) {
    void debugWindow.loadURL(getDevRendererUrl(DEBUG_RENDERER_ENTRY))
  } else {
    void debugWindow.loadFile(join(__dirname, "../renderer/debug.html"))
  }

  return debugWindow
}
