import { BrowserWindow } from "electron"
import { join } from "node:path"

const QUICK_PLAY_WINDOW_WIDTH = 960
const QUICK_PLAY_WINDOW_HEIGHT = 860
const QUICK_PLAY_RENDERER_ENTRY = "/quick-play.html"

function getDevRendererUrl(entry: string): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (!rendererUrl) {
    return ""
  }
  return new URL(entry, rendererUrl).toString()
}

export function createQuickPlayWindow(): BrowserWindow {
  const quickPlayWindow = new BrowserWindow({
    height: QUICK_PLAY_WINDOW_HEIGHT,
    title: "TinkerPet Quick Play",
    width: QUICK_PLAY_WINDOW_WIDTH,
    webPreferences: {
      preload: join(__dirname, "../preload/gamePreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void quickPlayWindow.loadURL(getDevRendererUrl(QUICK_PLAY_RENDERER_ENTRY))
  } else {
    void quickPlayWindow.loadFile(join(__dirname, "../renderer/quick-play.html"))
  }

  return quickPlayWindow
}
