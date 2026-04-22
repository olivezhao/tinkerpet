import { BrowserWindow, screen } from "electron"
import { join } from "node:path"
import type { AppConfig } from "../../shared/types"

const PET_WINDOW_SIZE = 220
const PET_WINDOW_MARGIN = 24
const PET_RENDERER_ENTRY = "/index.html"

function getDevRendererUrl(entry: string): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (!rendererUrl) {
    return ""
  }

  return new URL(entry, rendererUrl).toString()
}

export function getPetWindowPosition(): { x: number; y: number } {
  const { workArea } = screen.getPrimaryDisplay()

  return {
    x: workArea.x + workArea.width - PET_WINDOW_SIZE - PET_WINDOW_MARGIN,
    y: workArea.y + workArea.height - PET_WINDOW_SIZE - PET_WINDOW_MARGIN
  }
}

export function createPetWindow(config: AppConfig): BrowserWindow {
  const defaultPosition = getPetWindowPosition()

  const petWindow = new BrowserWindow({
    backgroundColor: "#00000000",
    width: config.window.width,
    height: config.window.height,
    title: "TinkerPet",
    x: config.window.x ?? defaultPosition.x,
    y: config.window.y ?? defaultPosition.y,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: config.window.alwaysOnTop,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/petPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  petWindow.setAlwaysOnTop(config.window.alwaysOnTop, "floating")
  petWindow.setIgnoreMouseEvents(config.window.ignoreMouseEvents, { forward: true })
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })

  petWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `TinkerPet pet window failed to load ${validatedURL}: ${errorCode} ${errorDescription}`
      )
    }
  )
  petWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("TinkerPet pet renderer process gone:", details)
  })
  petWindow.webContents.on("console-message", (details) => {
    console.info(
      `TinkerPet pet renderer: ${details.message} (${details.sourceId}:${details.lineNumber})`
    )
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void petWindow
      .loadURL(getDevRendererUrl(PET_RENDERER_ENTRY))
      .then(() => {
        if (!petWindow.isDestroyed()) {
          petWindow.showInactive()
        }
      })
      .catch((error: unknown) => {
        console.error("TinkerPet pet window load failed:", error)
      })
  } else {
    void petWindow
      .loadFile(join(__dirname, "../renderer/index.html"))
      .then(() => {
        if (!petWindow.isDestroyed()) {
          petWindow.showInactive()
        }
      })
      .catch((error: unknown) => {
        console.error("TinkerPet pet window load failed:", error)
      })
  }

  return petWindow
}

export function resetPetWindowPosition(petWindow: BrowserWindow): void {
  const position = getPetWindowPosition()
  petWindow.setPosition(position.x, position.y)
}

export function setPetAlwaysOnTop(
  petWindow: BrowserWindow,
  alwaysOnTop: boolean
): void {
  petWindow.setAlwaysOnTop(alwaysOnTop, "floating")
}

export function setPetMousePassthrough(
  petWindow: BrowserWindow,
  ignoreMouseEvents: boolean
): void {
  petWindow.setIgnoreMouseEvents(ignoreMouseEvents, { forward: true })
}
