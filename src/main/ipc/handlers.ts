import { BrowserWindow, ipcMain } from "electron"
import type { DebugSnapshot, EventLogItem, PetEvent, PetState } from "../../shared/types"
import {
  appendEventLog as persistEventLogItem,
  clearEventLog,
  loadEventLog
} from "../store/eventLogStore"
import { IPC_CHANNELS } from "./channels"

interface IpcHandlerOptions {
  getDebugWindow: () => BrowserWindow | null
  getPetWindow: () => BrowserWindow | null
  showPetWindow: () => BrowserWindow
}

let activeTaskCount = 0
let currentState: PetState = "idle"
let eventSequence = 0
let idleTimer: NodeJS.Timeout | null = null
let transientTimer: NodeJS.Timeout | null = null
let eventLog: EventLogItem[] = loadEventLog()

function isStartedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_STARTED")
}

function isFinishedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FINISHED")
}

function isFailedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FAILED")
}

function normalizeEvent(event: PetEvent): PetEvent {
  return {
    ...event,
    timestamp: event.timestamp ?? Date.now()
  }
}

function updateMainSnapshot(event: PetEvent): void {
  if (isStartedEvent(event)) {
    activeTaskCount += 1
    currentState = "waiting"
    return
  }

  if (isFinishedEvent(event)) {
    activeTaskCount = Math.max(0, activeTaskCount - 1)
    currentState = "finished"
    return
  }

  if (isFailedEvent(event)) {
    activeTaskCount = Math.max(0, activeTaskCount - 1)
    currentState = "failed"
  }
}

function createEventLogItem(event: PetEvent): EventLogItem {
  eventSequence += 1

  return {
    event,
    eventId: `evt_${eventSequence.toString().padStart(4, "0")}`,
    receivedAt: Date.now(),
    source: event.source
  }
}

export function getNextEventId(): string {
  return `evt_${(eventSequence + 1).toString().padStart(4, "0")}`
}

function appendEventLog(event: PetEvent): void {
  eventLog = persistEventLogItem(createEventLogItem(event))
}

function clearIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function clearTransientTimer(): void {
  if (transientTimer) {
    clearTimeout(transientTimer)
    transientTimer = null
  }
}

function getSnapshot(): DebugSnapshot {
  return {
    activeTaskCount,
    eventLog: [...eventLog],
    state: currentState
  }
}

function broadcastSnapshot(options: IpcHandlerOptions): void {
  const debugWindow = options.getDebugWindow()

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.webContents.send(IPC_CHANNELS.DEBUG_SNAPSHOT_UPDATED, getSnapshot())
  }
}

function scheduleIdleTimer(options: IpcHandlerOptions): void {
  clearIdleTimer()

  if (currentState !== "idle" || activeTaskCount > 0) {
    return
  }

  idleTimer = setTimeout(() => {
    currentState = "sleeping"
    broadcastSnapshot(options)
  }, 10 * 60 * 1000)
}

function scheduleTransientResolution(
  options: IpcHandlerOptions,
  state: PetState
): void {
  clearTransientTimer()

  if (state !== "finished" && state !== "failed") {
    scheduleIdleTimer(options)
    return
  }

  transientTimer = setTimeout(
    () => {
      currentState = activeTaskCount > 0 ? "waiting" : "idle"
      broadcastSnapshot(options)
      scheduleIdleTimer(options)
    },
    state === "finished" ? 2000 : 3000
  )
}

export function dispatchPetEvent(
  options: IpcHandlerOptions,
  event: PetEvent
): DebugSnapshot {
  const normalizedEvent = normalizeEvent(event)
  const petWindow = options.showPetWindow()

  clearIdleTimer()
  clearTransientTimer()
  updateMainSnapshot(normalizedEvent)
  appendEventLog(normalizedEvent)
  petWindow.webContents.send(IPC_CHANNELS.PET_EVENT, normalizedEvent)
  broadcastSnapshot(options)
  scheduleTransientResolution(options, currentState)

  return getSnapshot()
}

export function registerIpcHandlers(options: IpcHandlerOptions): void {
  ipcMain.handle(IPC_CHANNELS.DEBUG_EVENT_SEND, (_event, petEvent: PetEvent) =>
    dispatchPetEvent(options, petEvent)
  )

  ipcMain.handle(IPC_CHANNELS.DEBUG_EVENT_LOG_CLEAR, () => {
    eventLog = clearEventLog()
    broadcastSnapshot(options)
    return getSnapshot()
  })

  ipcMain.handle(IPC_CHANNELS.DEBUG_SNAPSHOT_GET, () => getSnapshot())
}
