import type { BrowserWindow } from "electron"
import type { PetEvent } from "../../shared/types"
import { dispatchPetEvent, getNextEventId } from "../ipc/handlers"

export interface EventDispatcherOptions {
  getDebugWindow: () => BrowserWindow | null
  getPetWindow: () => BrowserWindow | null
  showPetWindow: () => BrowserWindow
}

export function dispatchBridgeEvent(
  options: EventDispatcherOptions,
  event: PetEvent
): string {
  const eventId = getNextEventId()
  dispatchPetEvent(options, event)
  return eventId
}
