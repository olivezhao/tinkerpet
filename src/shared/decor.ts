import type { DecorSelection } from "./types"

export const DECOR_SLOT_KEYS = ["desk", "background", "hanging"] as const

export type DecorSlot = (typeof DECOR_SLOT_KEYS)[number]

export const DECOR_ITEMS: Record<DecorSlot, string[]> = {
  background: ["none", "grid-wall", "night-wall"],
  desk: ["none", "mini-lamp", "toolbox"],
  hanging: ["none", "star-mobile", "gear-hook"]
}

const DECOR_UNLOCK_REQUIREMENT: Record<string, number> = {
  "gear-hook": 4,
  "night-wall": 6,
  "toolbox": 2
}

export function isDecorSlot(value: unknown): value is DecorSlot {
  return typeof value === "string" && DECOR_SLOT_KEYS.includes(value as DecorSlot)
}

export function isDecorItemAllowed(slot: DecorSlot, itemId: string): boolean {
  return DECOR_ITEMS[slot].includes(itemId)
}

export function getDecorUnlockRequirement(itemId: string): number {
  return DECOR_UNLOCK_REQUIREMENT[itemId] ?? 0
}

export function isDecorItemUnlocked(itemId: string, decorPoints: number): boolean {
  return decorPoints >= getDecorUnlockRequirement(itemId)
}

export function sanitizeDecorSelection(selection: DecorSelection): DecorSelection {
  const nextSelection: DecorSelection = {}

  for (const slot of DECOR_SLOT_KEYS) {
    const itemId = selection[slot]
    if (typeof itemId === "string" && isDecorItemAllowed(slot, itemId)) {
      nextSelection[slot] = itemId
    } else {
      nextSelection[slot] = "none"
    }
  }

  return nextSelection
}

