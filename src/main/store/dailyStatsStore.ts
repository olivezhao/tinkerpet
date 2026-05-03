import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { DailyStats, DailyStatsActiveTask } from "../../shared/types"

const DAILY_STATS_FILE_NAME = "tinkerpet-daily-stats.json"

let cachedStatsByDate: Record<string, DailyStats> | null = null

function getDailyStatsPath(): string {
  return join(app.getPath("userData"), DAILY_STATS_FILE_NAME)
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function createEmptyDailyStats(date = getLocalDateKey()): DailyStats {
  return {
    activeTasks: {},
    completedCount: 0,
    date,
    failedCount: 0,
    firstUseXpAwarded: false,
    rewardedTaskKeys: [],
    startedCount: 0,
    totalWaitMs: 0,
    xpEarned: 0
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDailyStatsActiveTask(value: unknown): value is DailyStatsActiveTask {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.source === "string" &&
    typeof value.startedAt === "number" &&
    typeof value.type === "string" &&
    (value.title === undefined || typeof value.title === "string")
  )
}

function mergeDailyStats(value: unknown, date: string): DailyStats {
  const defaults = createEmptyDailyStats(date)

  if (!isRecord(value)) {
    return defaults
  }

  return {
    activeTasks: isRecord(value.activeTasks)
      ? Object.fromEntries(
          Object.entries(value.activeTasks).filter(
            (entry): entry is [string, DailyStatsActiveTask] =>
              isDailyStatsActiveTask(entry[1])
          )
        )
      : defaults.activeTasks,
    completedCount:
      typeof value.completedCount === "number"
        ? value.completedCount
        : defaults.completedCount,
    date: typeof value.date === "string" ? value.date : defaults.date,
    failedCount:
      typeof value.failedCount === "number"
        ? value.failedCount
        : defaults.failedCount,
    firstUseXpAwarded:
      typeof value.firstUseXpAwarded === "boolean"
        ? value.firstUseXpAwarded
        : defaults.firstUseXpAwarded,
    rewardedTaskKeys: Array.isArray(value.rewardedTaskKeys)
      ? value.rewardedTaskKeys.filter((item): item is string => typeof item === "string")
      : defaults.rewardedTaskKeys,
    startedCount:
      typeof value.startedCount === "number"
        ? value.startedCount
        : defaults.startedCount,
    totalWaitMs:
      typeof value.totalWaitMs === "number"
        ? value.totalWaitMs
        : defaults.totalWaitMs,
    xpEarned: typeof value.xpEarned === "number" ? value.xpEarned : defaults.xpEarned
  }
}

function writeStatsByDate(statsByDate: Record<string, DailyStats>): void {
  const statsPath = getDailyStatsPath()
  mkdirSync(dirname(statsPath), { recursive: true })
  writeFileSync(statsPath, `${JSON.stringify(statsByDate, null, 2)}\n`, "utf8")
}

export function loadDailyStatsByDate(): Record<string, DailyStats> {
  if (cachedStatsByDate) {
    return cachedStatsByDate
  }

  const statsPath = getDailyStatsPath()

  if (!existsSync(statsPath)) {
    cachedStatsByDate = {}
    writeStatsByDate(cachedStatsByDate)
    return cachedStatsByDate
  }

  try {
    const parsed = JSON.parse(readFileSync(statsPath, "utf8"))
    cachedStatsByDate = isRecord(parsed)
      ? Object.fromEntries(
          Object.entries(parsed).map(([date, stats]) => [
            date,
            mergeDailyStats(stats, date)
          ])
        )
      : {}
  } catch {
    cachedStatsByDate = {}
  }

  writeStatsByDate(cachedStatsByDate)
  return cachedStatsByDate
}

export function loadTodayStats(): DailyStats {
  const today = getLocalDateKey()
  const statsByDate = loadDailyStatsByDate()

  if (!statsByDate[today]) {
    statsByDate[today] = createEmptyDailyStats(today)
    writeStatsByDate(statsByDate)
  }

  return statsByDate[today]
}

export function saveTodayStats(nextStats: DailyStats): DailyStats {
  const statsByDate = loadDailyStatsByDate()
  statsByDate[nextStats.date] = nextStats
  cachedStatsByDate = statsByDate
  writeStatsByDate(statsByDate)
  return nextStats
}

export function resetDailyStatsStore(): void {
  cachedStatsByDate = {}
  writeStatsByDate(cachedStatsByDate)
}
