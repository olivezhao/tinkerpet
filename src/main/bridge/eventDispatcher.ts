import type { BrowserWindow } from "electron"
import type { PetEvent } from "../../shared/types"
import {
  broadcastSnapshot,
  dispatchPetEventWithResult,
  type DispatchPetEventResult
} from "../ipc/handlers"

export interface EventDispatcherOptions {
  getDebugWindow: () => BrowserWindow | null
  getPetWindow: () => BrowserWindow | null
  showPetWindow: () => BrowserWindow
}

export function dispatchBridgeEvent(
  options: EventDispatcherOptions,
  event: PetEvent
): DispatchPetEventResult {
  return dispatchPetEventWithResult(options, event)
}

export function broadcastBridgeSnapshot(options: EventDispatcherOptions): void {
  broadcastSnapshot(options)
}
