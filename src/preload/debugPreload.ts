import { contextBridge, ipcRenderer } from "electron"
import type { DebugSnapshot, DecorState, PetEvent, PetProfile } from "../shared/types"

const DEBUG_EVENT_LOG_CLEAR_CHANNEL = "debug:event-log-clear"
const DEBUG_LOCAL_DATA_CLEAR_CHANNEL = "debug:local-data-clear"
const DEBUG_EVENT_SEND_CHANNEL = "debug:event-send"
const DEBUG_SNAPSHOT_GET_CHANNEL = "debug:snapshot-get"
const DEBUG_SNAPSHOT_UPDATED_CHANNEL = "debug:snapshot-updated"
const DECOR_GET_CHANNEL = "decor:get"
const DECOR_UPDATED_CHANNEL = "decor:updated"
const DECOR_UPDATE_SELECTION_CHANNEL = "decor:update-selection"
const PROFILE_GET_CHANNEL = "profile:get"
const PROFILE_UPDATED_CHANNEL = "profile:updated"
const PROFILE_UPDATE_NAME_CHANNEL = "profile:update-name"
const PROFILE_UPDATE_PERSONALITY_CHANNEL = "profile:update-personality"
const PROFILE_UPDATE_SKIN_CHANNEL = "profile:update-skin"
const APP_OPEN_QUICK_PLAY_CHANNEL = "app:open-quick-play"

contextBridge.exposeInMainWorld("tinkerpetDebug", {
  clearEventLog: (): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_EVENT_LOG_CLEAR_CHANNEL),
  clearLocalData: (): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_LOCAL_DATA_CLEAR_CHANNEL),
  getDecorState: (): Promise<DecorState> => ipcRenderer.invoke(DECOR_GET_CHANNEL),
  getSnapshot: (): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_SNAPSHOT_GET_CHANNEL),
  getProfile: (): Promise<PetProfile> => ipcRenderer.invoke(PROFILE_GET_CHANNEL),
  onSnapshotUpdated: (callback: (snapshot: DebugSnapshot) => void) => {
    const listener = (
      _ipcEvent: Electron.IpcRendererEvent,
      snapshot: DebugSnapshot
    ): void => {
      callback(snapshot)
    }

    ipcRenderer.on(DEBUG_SNAPSHOT_UPDATED_CHANNEL, listener)

    return () => {
      ipcRenderer.off(DEBUG_SNAPSHOT_UPDATED_CHANNEL, listener)
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
  sendDebugEvent: (event: PetEvent): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_EVENT_SEND_CHANNEL, event),
  updatePetName: (petName: string): Promise<PetProfile> =>
    ipcRenderer.invoke(PROFILE_UPDATE_NAME_CHANNEL, petName),
  updateProfilePersonality: (personality: string): Promise<PetProfile> =>
    ipcRenderer.invoke(PROFILE_UPDATE_PERSONALITY_CHANNEL, personality),
  updateProfileSkin: (skinId: string): Promise<PetProfile> =>
    ipcRenderer.invoke(PROFILE_UPDATE_SKIN_CHANNEL, skinId),
  openQuickPlay: (): Promise<boolean> => ipcRenderer.invoke(APP_OPEN_QUICK_PLAY_CHANNEL),
  updateDecorSelection: (slot: string, itemId: string): Promise<DecorState> =>
    ipcRenderer.invoke(DECOR_UPDATE_SELECTION_CHANNEL, slot, itemId)
})
