import { contextBridge, ipcRenderer } from "electron"
import type { DebugSnapshot, PetEvent } from "../shared/types"

const DEBUG_EVENT_LOG_CLEAR_CHANNEL = "debug:event-log-clear"
const DEBUG_EVENT_SEND_CHANNEL = "debug:event-send"
const DEBUG_SNAPSHOT_GET_CHANNEL = "debug:snapshot-get"
const DEBUG_SNAPSHOT_UPDATED_CHANNEL = "debug:snapshot-updated"

contextBridge.exposeInMainWorld("tinkerpetDebug", {
  clearEventLog: (): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_EVENT_LOG_CLEAR_CHANNEL),
  getSnapshot: (): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_SNAPSHOT_GET_CHANNEL),
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
  sendDebugEvent: (event: PetEvent): Promise<DebugSnapshot> =>
    ipcRenderer.invoke(DEBUG_EVENT_SEND_CHANNEL, event)
})
