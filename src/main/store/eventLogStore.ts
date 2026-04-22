import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { EventLogItem } from "../../shared/types"

const EVENT_LOG_FILE_NAME = "tinkerpet-event-log.json"
const MAX_EVENT_LOG_ITEMS = 200

let cachedEventLog: EventLogItem[] | null = null

function getEventLogPath(): string {
  return join(app.getPath("userData"), EVENT_LOG_FILE_NAME)
}

function writeEventLog(items: EventLogItem[]): void {
  const eventLogPath = getEventLogPath()
  mkdirSync(dirname(eventLogPath), { recursive: true })
  writeFileSync(eventLogPath, `${JSON.stringify(items, null, 2)}\n`, "utf8")
}

function isEventLogItem(value: unknown): value is EventLogItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const item = value as Partial<EventLogItem>
  return (
    typeof item.eventId === "string" &&
    typeof item.receivedAt === "number" &&
    typeof item.source === "string" &&
    typeof item.event === "object" &&
    item.event !== null
  )
}

export function loadEventLog(): EventLogItem[] {
  if (cachedEventLog) {
    return cachedEventLog
  }

  const eventLogPath = getEventLogPath()

  if (!existsSync(eventLogPath)) {
    cachedEventLog = []
    writeEventLog(cachedEventLog)
    return cachedEventLog
  }

  try {
    const parsed = JSON.parse(readFileSync(eventLogPath, "utf8"))
    cachedEventLog = Array.isArray(parsed)
      ? parsed.filter(isEventLogItem).slice(0, MAX_EVENT_LOG_ITEMS)
      : []
  } catch {
    cachedEventLog = []
  }

  writeEventLog(cachedEventLog)
  return cachedEventLog
}

export function appendEventLog(item: EventLogItem): EventLogItem[] {
  const nextItems = [item, ...loadEventLog()].slice(0, MAX_EVENT_LOG_ITEMS)
  cachedEventLog = nextItems
  writeEventLog(nextItems)
  return nextItems
}

export function clearEventLog(): EventLogItem[] {
  cachedEventLog = []
  writeEventLog(cachedEventLog)
  return cachedEventLog
}
