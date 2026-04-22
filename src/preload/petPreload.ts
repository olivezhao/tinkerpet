import { contextBridge, ipcRenderer } from "electron"
import type { PetEvent } from "../shared/types"

const PET_EVENT_CHANNEL = "pet:event"

contextBridge.exposeInMainWorld("tinkerpet", {
  onPetEvent: (callback: (event: PetEvent) => void) => {
    const listener = (_ipcEvent: Electron.IpcRendererEvent, event: PetEvent): void => {
      callback(event)
    }

    ipcRenderer.on(PET_EVENT_CHANNEL, listener)

    return () => {
      ipcRenderer.off(PET_EVENT_CHANNEL, listener)
    }
  },
  version: "0.1.0"
})
