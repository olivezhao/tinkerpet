import { DEFAULT_SKIN_ID, type SkinId } from "../../shared/skins"

export interface SkinTheme {
  borderColor: string
  bodyColor: string
  coreColor: string
  eyeColor: string
  flashColor: string
  jointColor: string
  headColor: string
  mouthColor: string
  shadowColor: string
  sleepColor: string
  toolBayColor: string
  toolColor: string
  torsoColor: string
}

export const PET_SKIN_MANIFEST: Record<SkinId, SkinTheme> = {
  [DEFAULT_SKIN_ID]: {
    borderColor: "#202124",
    bodyColor: "#a7e3d4",
    coreColor: "#f7e17f",
    eyeColor: "#202124",
    flashColor: "rgb(255 236 128 / 64%)",
    headColor: "#c7efe4",
    jointColor: "#93d8c7",
    mouthColor: "#202124",
    shadowColor: "rgb(32 33 36 / 18%)",
    sleepColor: "#202124",
    toolBayColor: "#f9cf7a",
    toolColor: "#f7c948"
    ,
    torsoColor: "#a7e3d4"
  },
  "night-bot": {
    borderColor: "#0f172a",
    bodyColor: "#9fb6ff",
    coreColor: "#8bc6ff",
    eyeColor: "#0f172a",
    flashColor: "rgb(166 193 255 / 62%)",
    headColor: "#c8d5ff",
    jointColor: "#7f98e8",
    mouthColor: "#0f172a",
    shadowColor: "rgb(17 24 39 / 20%)",
    sleepColor: "#0f172a",
    toolBayColor: "#95c8ff",
    toolColor: "#7fb5ff",
    torsoColor: "#90a8f7"
  },
  "workshop-bot": {
    borderColor: "#2f241e",
    bodyColor: "#ffd7a1",
    coreColor: "#ffc06f",
    eyeColor: "#2f241e",
    flashColor: "rgb(255 191 130 / 62%)",
    headColor: "#ffe8c5",
    jointColor: "#f3b76f",
    mouthColor: "#2f241e",
    shadowColor: "rgb(47 36 30 / 22%)",
    sleepColor: "#2f241e",
    toolBayColor: "#ffb368",
    toolColor: "#ff9f4a",
    torsoColor: "#ffc988"
  }
}

export function resolveSkinTheme(skinId: string): SkinTheme {
  return PET_SKIN_MANIFEST[skinId as SkinId] ?? PET_SKIN_MANIFEST[DEFAULT_SKIN_ID]
}
