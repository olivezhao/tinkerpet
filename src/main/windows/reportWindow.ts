import { BrowserWindow } from "electron"
import { join } from "node:path"

const REPORT_WINDOW_WIDTH = 520
const REPORT_WINDOW_HEIGHT = 660
const REPORT_RENDERER_ENTRY = "/report.html"

function getDevRendererUrl(entry: string): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (!rendererUrl) {
    return ""
  }

  return new URL(entry, rendererUrl).toString()
}

export function createReportWindow(): BrowserWindow {
  const reportWindow = new BrowserWindow({
    height: REPORT_WINDOW_HEIGHT,
    title: "TinkerPet Daily Report",
    width: REPORT_WINDOW_WIDTH,
    webPreferences: {
      preload: join(__dirname, "../preload/reportPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  reportWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `TinkerPet report window failed to load ${validatedURL}: ${errorCode} ${errorDescription}`
      )
    }
  )

  if (process.env.ELECTRON_RENDERER_URL) {
    void reportWindow.loadURL(getDevRendererUrl(REPORT_RENDERER_ENTRY))
  } else {
    void reportWindow.loadFile(join(__dirname, "../renderer/report.html"))
  }

  return reportWindow
}
