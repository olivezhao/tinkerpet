export const DEFAULT_SKIN_ID = "default-bot"

export const AVAILABLE_SKIN_IDS = [
  DEFAULT_SKIN_ID,
  "workshop-bot",
  "night-bot"
] as const

export type SkinId = (typeof AVAILABLE_SKIN_IDS)[number]

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && AVAILABLE_SKIN_IDS.includes(value as SkinId)
}

