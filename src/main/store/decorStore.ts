import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { DecorState } from "../../shared/types"
import {
  DECOR_ITEMS,
  DECOR_SLOT_KEYS,
  getDecorUnlockRequirement,
  isDecorItemAllowed,
  isDecorItemUnlocked,
  isDecorSlot,
  sanitizeDecorSelection,
  type DecorSlot
} from "../../shared/decor"

const DECOR_STORE_FILE_NAME = "tinkerpet-decor.json"

let cachedDecorState: DecorState | null = null

function getDecorStorePath(): string {
  return join(app.getPath("userData"), DECOR_STORE_FILE_NAME)
}

function createDefaultDecorState(): DecorState {
  const now = Date.now()

  return {
    decorPoints: 0,
    selected: {
      background: "none",
      desk: "none",
      hanging: "none"
    },
    unlockedItemIds: [],
    updatedAt: now
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeDecorState(value: unknown): DecorState {
  const defaults = createDefaultDecorState()

  if (!isRecord(value)) {
    return defaults
  }

  const decorPoints =
    typeof value.decorPoints === "number"
      ? Math.max(0, value.decorPoints)
      : defaults.decorPoints
  const selected = isRecord(value.selected)
    ? sanitizeDecorSelection({
        background:
          typeof value.selected.background === "string"
            ? value.selected.background
            : undefined,
        desk: typeof value.selected.desk === "string" ? value.selected.desk : undefined,
        hanging:
          typeof value.selected.hanging === "string" ? value.selected.hanging : undefined
      })
    : defaults.selected

  return {
    decorPoints,
    selected,
    unlockedItemIds: Array.isArray(value.unlockedItemIds)
      ? value.unlockedItemIds.filter((item): item is string => typeof item === "string")
      : defaults.unlockedItemIds,
    updatedAt:
      typeof value.updatedAt === "number" ? value.updatedAt : defaults.updatedAt
  }
}

function writeDecorState(state: DecorState): void {
  const decorStorePath = getDecorStorePath()
  mkdirSync(dirname(decorStorePath), { recursive: true })
  writeFileSync(decorStorePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

export function loadDecorState(): DecorState {
  if (cachedDecorState) {
    return cachedDecorState
  }

  const decorStorePath = getDecorStorePath()

  if (!existsSync(decorStorePath)) {
    cachedDecorState = createDefaultDecorState()
    writeDecorState(cachedDecorState)
    return cachedDecorState
  }

  try {
    cachedDecorState = mergeDecorState(JSON.parse(readFileSync(decorStorePath, "utf8")))
  } catch {
    cachedDecorState = createDefaultDecorState()
  }

  writeDecorState(cachedDecorState)
  return cachedDecorState
}

function refreshUnlockedItemIds(state: DecorState): DecorState {
  const unlockedItemIds = DECOR_SLOT_KEYS.flatMap((slot) =>
    DECOR_ITEMS[slot].filter((itemId) =>
      isDecorItemUnlocked(itemId, state.decorPoints)
    )
  )

  return {
    ...state,
    unlockedItemIds
  }
}

function persistDecorState(nextState: DecorState): DecorState {
  const normalizedState = refreshUnlockedItemIds(nextState)
  cachedDecorState = normalizedState
  writeDecorState(normalizedState)
  return normalizedState
}

export function addDecorPoints(pointsDelta: number): DecorState {
  if (pointsDelta <= 0) {
    return loadDecorState()
  }

  const currentState = loadDecorState()
  return persistDecorState({
    ...currentState,
    decorPoints: currentState.decorPoints + pointsDelta,
    updatedAt: Date.now()
  })
}

export function updateDecorSelection(
  slot: DecorSlot,
  itemId: string
): DecorState {
  const currentState = loadDecorState()
  if (!isDecorSlot(slot)) {
    throw new Error("Unsupported decor slot.")
  }

  if (!isDecorItemAllowed(slot, itemId)) {
    throw new Error("Unsupported decor item.")
  }

  if (!isDecorItemUnlocked(itemId, currentState.decorPoints)) {
    throw new Error(`Decor item requires ${getDecorUnlockRequirement(itemId)} points.`)
  }

  return persistDecorState({
    ...currentState,
    selected: {
      ...currentState.selected,
      [slot]: itemId
    },
    updatedAt: Date.now()
  })
}

export function resetDecorState(): DecorState {
  const defaultState = createDefaultDecorState()
  return persistDecorState(defaultState)
}
