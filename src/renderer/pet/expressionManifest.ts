import type { PetPersonality, PetState } from "../../shared/types"

export interface ExpressionPreset {
  eye: "bright" | "focused" | "tilt" | "warn"
  head: "nod" | "still" | "tilt"
  mouth: "line" | "smile" | "smirk"
}

const PERSONALITY_BASE: Record<PetPersonality, ExpressionPreset> = {
  calm: {
    eye: "focused",
    head: "still",
    mouth: "line"
  },
  encourage: {
    eye: "bright",
    head: "nod",
    mouth: "smile"
  },
  tease: {
    eye: "tilt",
    head: "tilt",
    mouth: "smirk"
  }
}

export function resolveExpressionPreset(
  personality: PetPersonality,
  state: PetState
): ExpressionPreset {
  const base = PERSONALITY_BASE[personality]

  if (state === "failed") {
    return { ...base, eye: "warn", mouth: "line" }
  }

  if (state === "sleeping") {
    return { ...base, eye: "focused", mouth: "line", head: "still" }
  }

  if (state === "finished") {
    return { ...base, eye: "bright", mouth: "smile", head: "nod" }
  }

  return base
}

