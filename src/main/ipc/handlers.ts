import { BrowserWindow, ipcMain, shell } from "electron"
import type {
  DebugSnapshot,
  EventLogItem,
  PetEvent,
  PetState
} from "../../shared/types"
import { applyGrowthForEvent } from "../growth/growthEngine"
import {
  appendEventLog as persistEventLogItem,
  clearEventLog,
  loadEventLog,
  resetEventLogStore
} from "../store/eventLogStore"
import { loadTodayStats, resetDailyStatsStore } from "../store/dailyStatsStore"
import {
  loadProfile,
  resetProfile,
  updatePetName,
  updateProfilePersonality,
  updateProfileSkin
} from "../store/profileStore"
import { loadSources, resetSources, toPublicSource } from "../store/sourceStore"
import { IPC_CHANNELS } from "./channels"
import { generateDailyReportSummary } from "../report/dailyReportGenerator"
import { generateShareCard } from "../share/shareCardGenerator"
import {
  loadDecorState,
  resetDecorState,
  updateDecorSelection
} from "../store/decorStore"
import type { DecorSlot } from "../../shared/decor"
import { generateSevenDayStats } from "../stats/sevenDayStats"
import { resetGrowthState } from "../store/growthStore"

interface IpcHandlerOptions {
  getDebugWindow: () => BrowserWindow | null
  getPetWindow: () => BrowserWindow | null
  showPetWindow: () => BrowserWindow
}

export interface DispatchPetEventResult {
  deduped: boolean
  eventId?: string
  snapshot: DebugSnapshot
}

let activeTaskCount = 0
let currentState: PetState = "idle"
let eventSequence = 0
let idleTimer: NodeJS.Timeout | null = null
let transientTimer: NodeJS.Timeout | null = null
let eventLog: EventLogItem[] = loadEventLog()
const processedEventKeys = new Set<string>()
const DEDUP_KEY_TTL_MS = 10 * 60 * 1000
const DEDUP_KEY_MAX_SIZE = 5000
const dedupKeySeenAt = new Map<string, number>()

function isStartedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_STARTED")
}

function isFinishedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FINISHED")
}

function isFailedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FAILED")
}

function isDebugEvent(event: PetEvent): boolean {
  return event.source.toLowerCase().includes("debug")
}

function getDedupEventKey(event: PetEvent): string {
  const provider = event.provider ?? "unknown-provider"
  const sourceType = event.sourceType ?? "unknown-source-type"

  if (event.taskId) {
    return [
      sourceType,
      event.source,
      provider,
      event.taskId,
      event.type
    ].join(":")
  }

  const normalizedTitle = (event.title ?? event.statusText ?? "untitled")
    .trim()
    .toLowerCase()
  const timestamp = event.timestamp ?? Date.now()
  const timeBucket = Math.floor(timestamp / 5000)

  return [
    sourceType,
    event.source,
    provider,
    normalizedTitle,
    event.type,
    timeBucket
  ].join(":")
}

function isDuplicateEvent(event: PetEvent): boolean {
  if (isDebugEvent(event)) {
    return false
  }

  const now = Date.now()
  for (const [key, seenAt] of dedupKeySeenAt.entries()) {
    if (now - seenAt > DEDUP_KEY_TTL_MS) {
      dedupKeySeenAt.delete(key)
      processedEventKeys.delete(key)
    }
  }

  if (processedEventKeys.size > DEDUP_KEY_MAX_SIZE) {
    const overflow = processedEventKeys.size - DEDUP_KEY_MAX_SIZE
    let removed = 0
    for (const key of dedupKeySeenAt.keys()) {
      dedupKeySeenAt.delete(key)
      processedEventKeys.delete(key)
      removed += 1
      if (removed >= overflow) {
        break
      }
    }
  }

  const eventKey = getDedupEventKey(event)

  if (processedEventKeys.has(eventKey)) {
    dedupKeySeenAt.set(eventKey, now)
    return true
  }

  processedEventKeys.add(eventKey)
  dedupKeySeenAt.set(eventKey, now)
  return false
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

function appendEventLog(event: PetEvent): EventLogItem {
  const logItem = createEventLogItem(event)
  eventLog = persistEventLogItem(logItem)
  return logItem
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
    dailyStats: loadTodayStats(),
    eventLog: [...eventLog],
    profile: loadProfile(),
    sources: loadSources().map(toPublicSource),
    state: currentState
  }
}

function broadcastProfile(options: IpcHandlerOptions): void {
  const profile = loadProfile()
  const petWindow = options.getPetWindow()
  const debugWindow = options.getDebugWindow()

  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send(IPC_CHANNELS.PROFILE_UPDATED, profile)
  }

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.webContents.send(IPC_CHANNELS.PROFILE_UPDATED, profile)
  }
}

function broadcastDecor(options: IpcHandlerOptions): void {
  const decorState = loadDecorState()
  const petWindow = options.getPetWindow()
  const debugWindow = options.getDebugWindow()

  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send(IPC_CHANNELS.DECOR_UPDATED, decorState)
  }

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.webContents.send(IPC_CHANNELS.DECOR_UPDATED, decorState)
  }
}

export function broadcastSnapshot(options: IpcHandlerOptions): void {
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

export function dispatchPetEventWithResult(
  options: IpcHandlerOptions,
  event: PetEvent
): DispatchPetEventResult {
  const normalizedEvent = normalizeEvent(event)

  if (isDuplicateEvent(normalizedEvent)) {
    return {
      deduped: true,
      snapshot: getSnapshot()
    }
  }

  const petWindow = options.showPetWindow()

  clearIdleTimer()
  clearTransientTimer()
  updateMainSnapshot(normalizedEvent)
  const logItem = appendEventLog(normalizedEvent)
  applyGrowthForEvent(normalizedEvent)
  petWindow.webContents.send(IPC_CHANNELS.PET_EVENT, normalizedEvent)
  broadcastSnapshot(options)
  broadcastDecor(options)
  scheduleTransientResolution(options, currentState)

  return {
    deduped: false,
    eventId: logItem.eventId,
    snapshot: getSnapshot()
  }
}

export function dispatchPetEvent(
  options: IpcHandlerOptions,
  event: PetEvent
): DebugSnapshot {
  return dispatchPetEventWithResult(options, event).snapshot
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

  ipcMain.handle(IPC_CHANNELS.DEBUG_LOCAL_DATA_CLEAR, () => {
    resetEventLogStore()
    resetDailyStatsStore()
    resetDecorState()
    resetGrowthState()
    resetSources()
    resetProfile()

    eventLog = loadEventLog()
    activeTaskCount = 0
    currentState = "idle"
    eventSequence = 0
    processedEventKeys.clear()
    dedupKeySeenAt.clear()
    clearIdleTimer()
    clearTransientTimer()

    broadcastSnapshot(options)
    broadcastProfile(options)
    broadcastDecor(options)
    return getSnapshot()
  })

  ipcMain.handle(IPC_CHANNELS.DEBUG_SNAPSHOT_GET, () => getSnapshot())

  ipcMain.handle(IPC_CHANNELS.DECOR_GET, () => loadDecorState())

  ipcMain.handle(
    IPC_CHANNELS.DECOR_UPDATE_SELECTION,
    (_event, slot: DecorSlot, itemId: string) => {
      const decorState = updateDecorSelection(slot, itemId)
      broadcastDecor(options)
      return decorState
    }
  )

  ipcMain.handle(IPC_CHANNELS.PROFILE_GET, () => loadProfile())

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE_NAME,
    (_event, petName: string) => {
      const profile = updatePetName(petName)
      broadcastSnapshot(options)
      broadcastProfile(options)
      return profile
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE_PERSONALITY,
    (_event, personality: string) => {
      const profile = updateProfilePersonality(personality)
      broadcastSnapshot(options)
      broadcastProfile(options)
      return profile
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE_SKIN,
    (_event, skinId: string) => {
      const profile = updateProfileSkin(skinId)
      broadcastSnapshot(options)
      broadcastProfile(options)
      return profile
    }
  )

  ipcMain.handle(IPC_CHANNELS.REPORT_GET, () => generateDailyReportSummary())
  ipcMain.handle(IPC_CHANNELS.STATS_SEVEN_DAYS_GET, () => generateSevenDayStats())

  ipcMain.handle(IPC_CHANNELS.SHARE_CARD_GENERATE, () => {
    const report = generateDailyReportSummary()
    return generateShareCard(report)
  })

  ipcMain.handle(IPC_CHANNELS.SHARE_CARD_REVEAL, (_event, filePath: string) => {
    if (typeof filePath !== "string" || filePath.length === 0) {
      throw new Error("Invalid share card path")
    }

    return shell.showItemInFolder(filePath)
  })
}
