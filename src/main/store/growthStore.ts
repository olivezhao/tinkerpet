import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { GrowthState } from "../../shared/types"

const GROWTH_STORE_FILE_NAME = "tinkerpet-growth.json"

let cachedGrowthState: GrowthState | null = null

function getGrowthStorePath(): string {
  return join(app.getPath("userData"), GROWTH_STORE_FILE_NAME)
}

function createDefaultGrowthState(): GrowthState {
  const now = Date.now()

  return {
    lastAwardedAt: 0,
    totalXpGained: 0,
    updatedAt: now
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeGrowthState(value: unknown): GrowthState {
  const defaults = createDefaultGrowthState()

  if (!isRecord(value)) {
    return defaults
  }

  return {
    lastAwardedAt:
      typeof value.lastAwardedAt === "number" ? value.lastAwardedAt : defaults.lastAwardedAt,
    totalXpGained:
      typeof value.totalXpGained === "number"
        ? Math.max(0, value.totalXpGained)
        : defaults.totalXpGained,
    updatedAt:
      typeof value.updatedAt === "number" ? value.updatedAt : defaults.updatedAt
  }
}

function writeGrowthState(state: GrowthState): void {
  const growthStorePath = getGrowthStorePath()
  mkdirSync(dirname(growthStorePath), { recursive: true })
  writeFileSync(growthStorePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

export function loadGrowthState(): GrowthState {
  if (cachedGrowthState) {
    return cachedGrowthState
  }

  const growthStorePath = getGrowthStorePath()

  if (!existsSync(growthStorePath)) {
    cachedGrowthState = createDefaultGrowthState()
    writeGrowthState(cachedGrowthState)
    return cachedGrowthState
  }

  try {
    cachedGrowthState = mergeGrowthState(
      JSON.parse(readFileSync(growthStorePath, "utf8"))
    )
  } catch {
    cachedGrowthState = createDefaultGrowthState()
  }

  writeGrowthState(cachedGrowthState)
  return cachedGrowthState
}

export function resetGrowthState(): GrowthState {
  cachedGrowthState = createDefaultGrowthState()
  writeGrowthState(cachedGrowthState)
  return cachedGrowthState
}
