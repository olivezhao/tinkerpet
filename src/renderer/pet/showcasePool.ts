import type { MotionId } from "../../shared/motionPresets"

const SHOWCASE_MOTIONS: MotionId[] = ["showcase-a", "showcase-b", "showcase-c", "showcase-d"]

export interface ShowcasePoolState {
  recent: MotionId[]
}

export const INITIAL_SHOWCASE_POOL_STATE: ShowcasePoolState = {
  recent: []
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function pickShowcaseMotion(poolState: ShowcasePoolState): {
  motionId: MotionId
  nextPoolState: ShowcasePoolState
} {
  const excluded = new Set(poolState.recent.slice(-2))
  const candidates = SHOWCASE_MOTIONS.filter((motion) => !excluded.has(motion))
  const motionId = pickRandom(candidates.length > 0 ? candidates : SHOWCASE_MOTIONS)

  const nextRecent = [...poolState.recent, motionId].slice(-2)
  return {
    motionId,
    nextPoolState: {
      recent: nextRecent
    }
  }
}

export function runShowcasePoolSelfCheck(): boolean {
  let state = INITIAL_SHOWCASE_POOL_STATE
  const picked: MotionId[] = []
  for (let i = 0; i < 12; i += 1) {
    const result = pickShowcaseMotion(state)
    picked.push(result.motionId)
    state = result.nextPoolState
  }

  return picked.every((motion) => SHOWCASE_MOTIONS.includes(motion))
}
