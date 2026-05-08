import type { PetState } from "../../shared/types"

export interface AnimationConfig {
  durationMs: number
  loop: boolean
  name: string
}

const REQUIRED_V02_ANIMATIONS = new Set([
  "fail-reboot",
  "idle-breathe",
  "idle-scan",
  "sleep-powerdown",
  "success-pump",
  "success-spark",
  "thinking-tick",
  "working-tinker"
])
const MOTION_VARIANTS: Record<PetState, AnimationConfig[]> = {
  failed: [
    {
      durationMs: 1100,
      loop: false,
      name: "fail-reboot"
    }
  ],
  finished: [
    {
      durationMs: 1000,
      loop: false,
      name: "success-spark"
    },
    {
      durationMs: 900,
      loop: false,
      name: "success-pump"
    }
  ],
  idle: [
    {
      durationMs: 2400,
      loop: true,
      name: "idle-breathe"
    },
    {
      durationMs: 2600,
      loop: true,
      name: "idle-scan"
    }
  ],
  sleeping: [
    {
      durationMs: 3600,
      loop: true,
      name: "sleep-powerdown"
    }
  ],
  waiting: [
    {
      durationMs: 1300,
      loop: true,
      name: "working-tinker"
    },
    {
      durationMs: 1500,
      loop: true,
      name: "thinking-tick"
    }
  ]
}

export const PET_ANIMATION_MANIFEST: Record<PetState, AnimationConfig> = {
  failed: MOTION_VARIANTS.failed[0],
  finished: MOTION_VARIANTS.finished[0],
  idle: MOTION_VARIANTS.idle[0],
  sleeping: MOTION_VARIANTS.sleeping[0],
  waiting: MOTION_VARIANTS.waiting[0]
}

export function resolveAnimationForState(
  state: PetState,
  variantIndex: number
): AnimationConfig {
  const candidates = MOTION_VARIANTS[state]
  if (candidates.length === 1) {
    return candidates[0]
  }

  const index = Math.abs(variantIndex) % candidates.length
  return candidates[index]
}

export function runAnimationManifestSelfCheck(): boolean {
  const animationNames = new Set(Object.values(MOTION_VARIANTS).flat().map((a) => a.name))

  return Array.from(REQUIRED_V02_ANIMATIONS).every((name) =>
    animationNames.has(name)
  )
}
