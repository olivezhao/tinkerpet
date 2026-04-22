import { app, Menu, Tray, nativeImage, type BrowserWindow } from "electron"
import {
  resetPetWindowPosition,
  setPetAlwaysOnTop,
  setPetMousePassthrough
} from "../windows/petWindow"
import { updateConfig } from "../store/configStore"

interface TrayMenuOptions {
  getAlwaysOnTop: () => boolean
  getMousePassthrough: () => boolean
  openDebugWindow: () => BrowserWindow
  getPetWindow: () => BrowserWindow | null
  showPetWindow: () => BrowserWindow
}

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <path fill="black" d="M9 2c3.2 0 5.8 2.4 5.8 5.4 0 3.4-2.4 7.6-5.8 7.6S3.2 10.8 3.2 7.4C3.2 4.4 5.8 2 9 2Z"/>
      <circle cx="6.8" cy="7.4" r="1" fill="white"/>
      <circle cx="11.2" cy="7.4" r="1" fill="white"/>
      <path fill="white" d="M7.2 10.2h3.6c-.4.8-1 1.2-1.8 1.2s-1.4-.4-1.8-1.2Z"/>
    </svg>
  `
  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  )
  icon.setTemplateImage(true)
  return icon
}

function createContextMenu(options: TrayMenuOptions): Menu {
  const petWindow = options.getPetWindow()
  const isVisible = Boolean(petWindow?.isVisible())

  return Menu.buildFromTemplate([
    {
      label: isVisible ? "Hide Pet" : "Show Pet",
      click: () => {
        const currentWindow = options.getPetWindow()

        if (currentWindow?.isVisible()) {
          currentWindow.hide()
          updateTrayMenu(options)
          return
        }

        options.showPetWindow().show()
        updateTrayMenu(options)
      }
    },
    {
      label: "Open Debug Panel",
      click: () => {
        options.openDebugWindow().show()
      }
    },
    { type: "separator" },
    {
      label: "Toggle Always on Top",
      type: "checkbox",
      checked: options.getAlwaysOnTop(),
      click: () => {
        const nextAlwaysOnTop = !options.getAlwaysOnTop()
        const currentWindow = options.showPetWindow()
        setPetAlwaysOnTop(currentWindow, nextAlwaysOnTop)
        updateConfig((config) => ({
          ...config,
          window: {
            ...config.window,
            alwaysOnTop: nextAlwaysOnTop
          }
        }))
        updateTrayMenu(options)
      }
    },
    {
      label: "Toggle Mouse Passthrough",
      type: "checkbox",
      checked: options.getMousePassthrough(),
      click: () => {
        const nextMousePassthrough = !options.getMousePassthrough()
        const currentWindow = options.showPetWindow()
        setPetMousePassthrough(currentWindow, nextMousePassthrough)
        updateConfig((config) => ({
          ...config,
          window: {
            ...config.window,
            ignoreMouseEvents: nextMousePassthrough
          }
        }))
        updateTrayMenu(options)
      }
    },
    { type: "separator" },
    {
      label: "Reset Position",
      click: () => {
        const currentWindow = options.showPetWindow()
        resetPetWindowPosition(currentWindow)
        const [x, y] = currentWindow.getPosition()
        updateConfig((config) => ({
          ...config,
          window: {
            ...config.window,
            x,
            y
          }
        }))
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit()
      }
    }
  ])
}

function updateTrayMenu(options: TrayMenuOptions): void {
  tray?.setContextMenu(createContextMenu(options))
}

export function createTrayMenu(options: TrayMenuOptions): Tray {
  tray = new Tray(createTrayIcon())
  tray.setToolTip("TinkerPet")
  if (process.platform === "darwin") {
    tray.setTitle("TinkerPet")
  }
  updateTrayMenu(options)

  tray.on("click", () => {
    updateTrayMenu(options)
    tray?.popUpContextMenu()
  })

  tray.on("right-click", () => {
    updateTrayMenu(options)
    tray?.popUpContextMenu()
  })

  return tray
}
