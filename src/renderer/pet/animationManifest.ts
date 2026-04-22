import type { PetState } from "../../shared/types"

export interface AnimationConfig {
  durationMs: number
  loop: boolean
  name: string
}

export const PET_ANIMATION_MANIFEST: Record<PetState, AnimationConfig> = {
  failed: {
    durationMs: 900,
    loop: false,
    name: "failed-drop"
  },
  finished: {
    durationMs: 900,
    loop: false,
    name: "finished-hop"
  },
  idle: {
    durationMs: 2400,
    loop: true,
    name: "idle-breathe"
  },
  sleeping: {
    durationMs: 3600,
    loop: true,
    name: "sleeping-dim"
  },
  waiting: {
    durationMs: 1200,
    loop: true,
    name: "waiting-wiggle"
  }
}

