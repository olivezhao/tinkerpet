import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { GomokuHistoryItem } from "../../shared/gameTypes"

const GAME_HISTORY_FILE_NAME = "tinkerpet-game-history.json"
const MAX_GAME_HISTORY_ITEMS = 10

let cachedHistory: GomokuHistoryItem[] | null = null

function getGameHistoryPath(): string {
  return join(app.getPath("userData"), GAME_HISTORY_FILE_NAME)
}

function writeHistory(items: GomokuHistoryItem[]): void {
  const filePath = getGameHistoryPath()
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8")
}

function isHistoryItem(value: unknown): value is GomokuHistoryItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const item = value as Partial<GomokuHistoryItem>
  return (
    typeof item.id === "string" &&
    typeof item.startedAt === "number" &&
    typeof item.endedAt === "number" &&
    typeof item.durationMs === "number" &&
    typeof item.totalMoves === "number" &&
    (item.difficulty === "easy" || item.difficulty === "normal" || item.difficulty === "hard") &&
    (item.result === "win" || item.result === "lose" || item.result === "draw")
  )
}

export function loadGameHistory(): GomokuHistoryItem[] {
  if (cachedHistory) {
    return cachedHistory
  }

  const filePath = getGameHistoryPath()

  if (!existsSync(filePath)) {
    cachedHistory = []
    writeHistory(cachedHistory)
    return cachedHistory
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"))
    cachedHistory = Array.isArray(parsed)
      ? parsed.filter(isHistoryItem).slice(0, MAX_GAME_HISTORY_ITEMS)
      : []
  } catch {
    cachedHistory = []
  }

  writeHistory(cachedHistory)
  return cachedHistory
}

export function appendGameHistory(item: GomokuHistoryItem): GomokuHistoryItem[] {
  const next = [item, ...loadGameHistory()].slice(0, MAX_GAME_HISTORY_ITEMS)
  cachedHistory = next
  writeHistory(next)
  return next
}

export function clearGameHistory(): GomokuHistoryItem[] {
  cachedHistory = []
  writeHistory(cachedHistory)
  return cachedHistory
}
