import { BrowserWindow } from "electron"
import { join } from "node:path"

const DATA_PANEL_WINDOW_WIDTH = 760
const DATA_PANEL_WINDOW_HEIGHT = 640
const DATA_PANEL_RENDERER_ENTRY = "/data-panel.html"

function getDevRendererUrl(entry: string): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (!rendererUrl) {
    return ""
  }

  return new URL(entry, rendererUrl).toString()
}

export function createDataPanelWindow(): BrowserWindow {
  const dataPanelWindow = new BrowserWindow({
    height: DATA_PANEL_WINDOW_HEIGHT,
    title: "TinkerPet Data Panel",
    width: DATA_PANEL_WINDOW_WIDTH,
    webPreferences: {
      preload: join(__dirname, "../preload/dataPanelPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void dataPanelWindow.loadURL(getDevRendererUrl(DATA_PANEL_RENDERER_ENTRY))
  } else {
    void dataPanelWindow.loadFile(join(__dirname, "../renderer/data-panel.html"))
  }

  return dataPanelWindow
}

