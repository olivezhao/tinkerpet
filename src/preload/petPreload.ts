import { contextBridge, ipcRenderer } from "electron"
import type { DecorState, PetEvent, PetProfile } from "../shared/types"

const PET_EVENT_CHANNEL = "pet:event"
const DECOR_GET_CHANNEL = "decor:get"
const DECOR_UPDATED_CHANNEL = "decor:updated"
const PROFILE_GET_CHANNEL = "profile:get"
const PROFILE_UPDATED_CHANNEL = "profile:updated"

contextBridge.exposeInMainWorld("tinkerpet", {
  getDecorState: (): Promise<DecorState> => ipcRenderer.invoke(DECOR_GET_CHANNEL),
  getProfile: (): Promise<PetProfile> => ipcRenderer.invoke(PROFILE_GET_CHANNEL),
  onPetEvent: (callback: (event: PetEvent) => void) => {
    const listener = (_ipcEvent: Electron.IpcRendererEvent, event: PetEvent): void => {
      callback(event)
    }

    ipcRenderer.on(PET_EVENT_CHANNEL, listener)

    return () => {
      ipcRenderer.off(PET_EVENT_CHANNEL, listener)
    }
  },
  onProfileUpdated: (callback: (profile: PetProfile) => void) => {
    const listener = (
      _ipcEvent: Electron.IpcRendererEvent,
      profile: PetProfile
    ): void => {
      callback(profile)
    }

    ipcRenderer.on(PROFILE_UPDATED_CHANNEL, listener)

    return () => {
      ipcRenderer.off(PROFILE_UPDATED_CHANNEL, listener)
    }
  },
  onDecorUpdated: (callback: (decorState: DecorState) => void) => {
    const listener = (
      _ipcEvent: Electron.IpcRendererEvent,
      decorState: DecorState
    ): void => {
      callback(decorState)
    }

    ipcRenderer.on(DECOR_UPDATED_CHANNEL, listener)

    return () => {
      ipcRenderer.off(DECOR_UPDATED_CHANNEL, listener)
    }
  },
  version: "0.1.0"
})
