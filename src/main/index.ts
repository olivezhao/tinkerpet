import { app, BrowserWindow } from "electron"
import type { Server } from "node:http"
import { startHttpEventBridge } from "./bridge/httpServer"
import { registerIpcHandlers } from "./ipc/handlers"
import { loadConfig, updateConfig } from "./store/configStore"
import { createTrayMenu } from "./tray/trayMenu"
import { createDebugWindow } from "./windows/debugWindow"
import { createPetWindow } from "./windows/petWindow"
import { createDataPanelWindow } from "./windows/dataPanelWindow"
import { createReportWindow } from "./windows/reportWindow"
import { createQuickPlayWindow } from "./windows/quickPlayWindow"

let petWindow: BrowserWindow | null = null
let debugWindow: BrowserWindow | null = null
let dataPanelWindow: BrowserWindow | null = null
let reportWindow: BrowserWindow | null = null
let quickPlayWindow: BrowserWindow | null = null
let bridgeServer: Server | null = null

function showPetWindow(): BrowserWindow {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show()
    petWindow.focus()
    return petWindow
  }

  petWindow = createPetWindow(loadConfig())
  petWindow.on("moved", () => {
    const [x, y] = petWindow?.getPosition() ?? []

    if (typeof x !== "number" || typeof y !== "number") {
      return
    }

    updateConfig((config) => ({
      ...config,
      window: {
        ...config.window,
        x,
        y
      }
    }))
  })
  return petWindow
}

function getPetWindow(): BrowserWindow | null {
  if (!petWindow || petWindow.isDestroyed()) {
    return null
  }

  return petWindow
}

function openDebugWindow(): BrowserWindow {
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.show()
    debugWindow.focus()
    return debugWindow
  }

  debugWindow = createDebugWindow()
  debugWindow.on("closed", () => {
    debugWindow = null
  })

  return debugWindow
}

function getDebugWindow(): BrowserWindow | null {
  if (!debugWindow || debugWindow.isDestroyed()) {
    return null
  }

  return debugWindow
}

function openReportWindow(): BrowserWindow {
  if (reportWindow && !reportWindow.isDestroyed()) {
    reportWindow.show()
    reportWindow.focus()
    return reportWindow
  }

  reportWindow = createReportWindow()
  reportWindow.on("closed", () => {
    reportWindow = null
  })

  return reportWindow
}

function openDataPanelWindow(): BrowserWindow {
  if (dataPanelWindow && !dataPanelWindow.isDestroyed()) {
    dataPanelWindow.show()
    dataPanelWindow.focus()
    return dataPanelWindow
  }

  dataPanelWindow = createDataPanelWindow()
  dataPanelWindow.on("closed", () => {
    dataPanelWindow = null
  })

  return dataPanelWindow
}

function openQuickPlayWindow(): BrowserWindow {
  if (quickPlayWindow && !quickPlayWindow.isDestroyed()) {
    quickPlayWindow.show()
    quickPlayWindow.focus()
    return quickPlayWindow
  }

  quickPlayWindow = createQuickPlayWindow()
  quickPlayWindow.on("closed", () => {
    quickPlayWindow = null
  })

  return quickPlayWindow
}

void app.whenReady().then(() => {
  loadConfig()

  if (process.platform === "darwin") {
    app.dock?.hide()
  }

  showPetWindow()
  registerIpcHandlers({
    getDebugWindow,
    getPetWindow,
    openQuickPlayWindow,
    showPetWindow
  })
  bridgeServer = startHttpEventBridge({
    getBridgePort: () => loadConfig().bridge.port,
    getBridgeToken: () => loadConfig().bridge.token,
    getDebugWindow,
    getPetWindow,
    showPetWindow
  })
  createTrayMenu({
    getAlwaysOnTop: () => loadConfig().window.alwaysOnTop,
    getMousePassthrough: () => loadConfig().window.ignoreMouseEvents,
    openDataPanelWindow,
    openDebugWindow,
    openQuickPlayWindow,
    openReportWindow,
    getPetWindow,
    showPetWindow
  })

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showPetWindow()
    }
  })
})

app.on("before-quit", () => {
  bridgeServer?.close()
  bridgeServer = null
})

app.on("window-all-closed", () => {
  app.quit()
})
