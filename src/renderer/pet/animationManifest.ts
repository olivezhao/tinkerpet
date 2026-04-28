import type { PetState } from "../../shared/types"

export interface AnimationConfig {
  durationMs: number
  loop: boolean
  name: string
}

const REQUIRED_V02_ANIMATIONS = new Set([
  "fail-reboot",
  "idle-breathe",
  "sleep-powerdown",
  "success-spark",
  "working-tinker"
])

export const PET_ANIMATION_MANIFEST: Record<PetState, AnimationConfig> = {
  failed: {
    durationMs: 1100,
    loop: false,
    name: "fail-reboot"
  },
  finished: {
    durationMs: 1000,
    loop: false,
    name: "success-spark"
  },
  idle: {
    durationMs: 2400,
    loop: true,
    name: "idle-breathe"
  },
  sleeping: {
    durationMs: 3600,
    loop: true,
    name: "sleep-powerdown"
  },
  waiting: {
    durationMs: 1300,
    loop: true,
    name: "working-tinker"
  }
}

export function runAnimationManifestSelfCheck(): boolean {
  const animationNames = new Set(
    Object.values(PET_ANIMATION_MANIFEST).map((animation) => animation.name)
  )

  return Array.from(REQUIRED_V02_ANIMATIONS).every((name) =>
    animationNames.has(name)
  )
}
