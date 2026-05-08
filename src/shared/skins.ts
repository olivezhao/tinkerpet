export const DEFAULT_SKIN_ID = "default-bot"

export const AVAILABLE_SKIN_IDS = [
  DEFAULT_SKIN_ID,
  "workshop-bot",
  "night-bot"
] as const

export type SkinId = (typeof AVAILABLE_SKIN_IDS)[number]

interface SkinMeta {
  label: string
  tone: string
}

export const SKIN_META: Record<SkinId, SkinMeta> = {
  [DEFAULT_SKIN_ID]: {
    label: "Classic Tinker",
    tone: "Teal Core"
  },
  "night-bot": {
    label: "Night Tinker",
    tone: "Blue Neon"
  },
  "workshop-bot": {
    label: "Workshop Tinker",
    tone: "Orange Tools"
  }
}

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && AVAILABLE_SKIN_IDS.includes(value as SkinId)
}
