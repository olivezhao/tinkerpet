import { DEFAULT_SKIN_ID, type SkinId } from "../../shared/skins"

interface SkinTheme {
  bodyColor: string
  eyeColor: string
  flashColor: string
  mouthColor: string
  shadowColor: string
  sleepColor: string
  toolColor: string
}

export const PET_SKIN_MANIFEST: Record<SkinId, SkinTheme> = {
  [DEFAULT_SKIN_ID]: {
    bodyColor: "#a7e3d4",
    eyeColor: "#202124",
    flashColor: "rgb(255 236 128 / 64%)",
    mouthColor: "#202124",
    shadowColor: "rgb(32 33 36 / 18%)",
    sleepColor: "#202124",
    toolColor: "#f7c948"
  },
  "night-bot": {
    bodyColor: "#9fb6ff",
    eyeColor: "#111827",
    flashColor: "rgb(166 193 255 / 62%)",
    mouthColor: "#111827",
    shadowColor: "rgb(17 24 39 / 20%)",
    sleepColor: "#111827",
    toolColor: "#8bc6ff"
  },
  "workshop-bot": {
    bodyColor: "#ffd7a1",
    eyeColor: "#2f241e",
    flashColor: "rgb(255 191 130 / 62%)",
    mouthColor: "#2f241e",
    shadowColor: "rgb(47 36 30 / 22%)",
    sleepColor: "#2f241e",
    toolColor: "#ff9f4a"
  }
}

export function resolveSkinTheme(skinId: string): SkinTheme {
  return PET_SKIN_MANIFEST[skinId as SkinId] ?? PET_SKIN_MANIFEST[DEFAULT_SKIN_ID]
}

