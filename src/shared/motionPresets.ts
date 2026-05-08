export type MotionId =
  | "walk-loop"
  | "jog-burst"
  | "showcase-a"
  | "showcase-b"
  | "showcase-c"
  | "showcase-d"
  | "finished-signal"
  | "failed-reset"
  | "interaction-nod"
  | "interaction-wave"
  | "sleep-slow"

export interface MotionPreset {
  cooldownMs?: number
  durationMs: number
  id: MotionId
  interruptible: boolean
  loop: boolean
  weight?: number
}

export interface MotionTuningConfig {
  globalMotionCooldownMs: number
  interactionCooldownMaxMs: number
  interactionCooldownMinMs: number
  jogBurstMaxDurationMs: number
  jogBurstMinDurationMs: number
  jogBurstProbability: number
  jogBurstTriggerMaxIntervalMs: number
  jogBurstTriggerMinIntervalMs: number
  longWaitFrequencyScale: number
  longWaitThresholdMs: number
  restingWindowMaxMs: number
  restingWindowMinMs: number
  showcaseSegmentMaxMs: number
  showcaseSegmentMinMs: number
}

export const V06_MOTION_TUNING: MotionTuningConfig = {
  globalMotionCooldownMs: 3000,
  interactionCooldownMaxMs: 8000,
  interactionCooldownMinMs: 5000,
  jogBurstMaxDurationMs: 4000,
  jogBurstMinDurationMs: 2000,
  jogBurstProbability: 0.18,
  jogBurstTriggerMaxIntervalMs: 50000,
  jogBurstTriggerMinIntervalMs: 25000,
  longWaitFrequencyScale: 0.75,
  longWaitThresholdMs: 60000,
  restingWindowMaxMs: 20000,
  restingWindowMinMs: 8000,
  showcaseSegmentMaxMs: 6000,
  showcaseSegmentMinMs: 3000
}

let runtimeMotionTuning: MotionTuningConfig = { ...V06_MOTION_TUNING }

export function getMotionTuningConfig(): MotionTuningConfig {
  return runtimeMotionTuning
}

export function updateMotionTuningConfig(
  patch: Partial<MotionTuningConfig>
): MotionTuningConfig {
  runtimeMotionTuning = {
    ...runtimeMotionTuning,
    ...patch
  }
  return runtimeMotionTuning
}

export function resetMotionTuningConfig(): MotionTuningConfig {
  runtimeMotionTuning = { ...V06_MOTION_TUNING }
  return runtimeMotionTuning
}

export const V06_MOTION_PRESETS: Record<MotionId, MotionPreset> = {
  "failed-reset": {
    cooldownMs: 1800,
    durationMs: 1700,
    id: "failed-reset",
    interruptible: false,
    loop: false
  },
  "finished-signal": {
    cooldownMs: 1600,
    durationMs: 1500,
    id: "finished-signal",
    interruptible: false,
    loop: false
  },
  "interaction-nod": {
    cooldownMs: 5000,
    durationMs: 1200,
    id: "interaction-nod",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "interaction-wave": {
    cooldownMs: 6000,
    durationMs: 1300,
    id: "interaction-wave",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "jog-burst": {
    cooldownMs: 12000,
    durationMs: 3000,
    id: "jog-burst",
    interruptible: true,
    loop: false
  },
  "showcase-a": {
    durationMs: 4200,
    id: "showcase-a",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "showcase-b": {
    durationMs: 4600,
    id: "showcase-b",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "showcase-c": {
    durationMs: 3800,
    id: "showcase-c",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "showcase-d": {
    durationMs: 5000,
    id: "showcase-d",
    interruptible: true,
    loop: false,
    weight: 1
  },
  "sleep-slow": {
    durationMs: 3800,
    id: "sleep-slow",
    interruptible: true,
    loop: true
  },
  "walk-loop": {
    durationMs: 3200,
    id: "walk-loop",
    interruptible: true,
    loop: true
  }
}

export function runMotionPresetsSelfCheck(): boolean {
  const allIds = Object.keys(V06_MOTION_PRESETS)
  if (allIds.length !== 11) {
    return false
  }

  for (const preset of Object.values(V06_MOTION_PRESETS)) {
    if (preset.durationMs <= 0) {
      return false
    }
  }

  return (
    V06_MOTION_TUNING.interactionCooldownMinMs <
      V06_MOTION_TUNING.interactionCooldownMaxMs &&
    V06_MOTION_TUNING.jogBurstProbability > 0 &&
    V06_MOTION_TUNING.jogBurstProbability < 1
  )
}
