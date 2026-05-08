import type { PetState } from "../../shared/types"
import {
  getMotionTuningConfig,
  type MotionId
} from "../../shared/motionPresets"
import {
  INITIAL_SHOWCASE_POOL_STATE,
  pickShowcaseMotion,
  type ShowcasePoolState
} from "./showcasePool"

export interface MotionScheduleState {
  currentMotionId: MotionId
  idleJogAt: number
  interactionCooldownUntil: number
  lastGlobalMotionAt: number
  lastWaitingStartedAt: number
  pausedUntil: number
  pool: ShowcasePoolState
}

export const INITIAL_MOTION_SCHEDULE_STATE: MotionScheduleState = {
  currentMotionId: "walk-loop",
  idleJogAt: 0,
  interactionCooldownUntil: 0,
  lastGlobalMotionAt: 0,
  lastWaitingStartedAt: 0,
  pausedUntil: 0,
  pool: INITIAL_SHOWCASE_POOL_STATE
}

function randomRange(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min))
}

function startGlobalCooldown(now: number): number {
  const tuning = getMotionTuningConfig()
  return now + tuning.globalMotionCooldownMs
}

function nextIdleJogAt(now: number): number {
  const tuning = getMotionTuningConfig()
  return now + randomRange(
    tuning.jogBurstTriggerMinIntervalMs,
    tuning.jogBurstTriggerMaxIntervalMs
  )
}

function nextPauseWindow(now: number, isWaiting: boolean): number {
  const tuning = getMotionTuningConfig()
  if (isWaiting) {
    return now + randomRange(2000, 5000)
  }
  return now + randomRange(
    tuning.restingWindowMinMs,
    tuning.restingWindowMaxMs
  )
}

export function initializeMotionSchedule(now = Date.now()): MotionScheduleState {
  return {
    ...INITIAL_MOTION_SCHEDULE_STATE,
    idleJogAt: nextIdleJogAt(now),
    pausedUntil: now
  }
}

export function pickInteractionMotion(now: number, state: MotionScheduleState): {
  motionId: MotionId | null
  nextState: MotionScheduleState
} {
  if (now < state.interactionCooldownUntil) {
    return { motionId: null, nextState: state }
  }

  const motionId: MotionId = Math.random() > 0.5 ? "interaction-nod" : "interaction-wave"
  const tuning = getMotionTuningConfig()
  const cooldown = randomRange(
    tuning.interactionCooldownMinMs,
    tuning.interactionCooldownMaxMs
  )
  return {
    motionId,
    nextState: {
      ...state,
      currentMotionId: motionId,
      interactionCooldownUntil: now + cooldown,
      lastGlobalMotionAt: startGlobalCooldown(now),
      pausedUntil: nextPauseWindow(now, false)
    }
  }
}

export function resolveMotionByState(
  petState: PetState,
  now: number,
  state: MotionScheduleState
): MotionScheduleState {
  if (petState === "finished") {
    return {
      ...state,
      currentMotionId: "finished-signal",
      lastGlobalMotionAt: startGlobalCooldown(now),
      lastWaitingStartedAt: 0,
      pausedUntil: nextPauseWindow(now, false)
    }
  }

  if (petState === "failed") {
    return {
      ...state,
      currentMotionId: "failed-reset",
      lastGlobalMotionAt: startGlobalCooldown(now),
      lastWaitingStartedAt: 0,
      pausedUntil: nextPauseWindow(now, false)
    }
  }

  if (petState === "sleeping") {
    return {
      ...state,
      currentMotionId: "sleep-slow",
      lastWaitingStartedAt: 0,
      pausedUntil: now
    }
  }

  if (petState === "waiting") {
    const tuning = getMotionTuningConfig()
    const waitingStartedAt =
      state.lastWaitingStartedAt > 0 ? state.lastWaitingStartedAt : now
    const waitDuration = now - waitingStartedAt
    if (now < state.pausedUntil) {
      return state
    }

    const picked = pickShowcaseMotion(state.pool)
    const pauseUntil = nextPauseWindow(now, true)
    const longWaitPauseUntil =
      waitDuration > tuning.longWaitThresholdMs
        ? now + Math.round((pauseUntil - now) / tuning.longWaitFrequencyScale)
        : pauseUntil
    return {
      ...state,
      currentMotionId: picked.motionId,
      lastGlobalMotionAt: startGlobalCooldown(now),
      lastWaitingStartedAt: waitingStartedAt,
      pausedUntil: longWaitPauseUntil,
      pool: picked.nextPoolState
    }
  }

  if (state.currentMotionId !== "walk-loop" && now >= state.lastGlobalMotionAt) {
    return {
      ...state,
      currentMotionId: "walk-loop",
      lastWaitingStartedAt: 0
    }
  }

  if (
    now >= state.idleJogAt &&
    Math.random() < getMotionTuningConfig().jogBurstProbability &&
    now >= state.lastGlobalMotionAt
  ) {
    return {
      ...state,
      currentMotionId: "jog-burst",
      idleJogAt: nextIdleJogAt(now),
      lastGlobalMotionAt: startGlobalCooldown(now),
      pausedUntil: now + randomRange(2000, 4000)
    }
  }

  if (state.currentMotionId !== "walk-loop" && now >= state.pausedUntil) {
    return {
      ...state,
      currentMotionId: "walk-loop",
      lastWaitingStartedAt: 0,
      idleJogAt: state.idleJogAt > now ? state.idleJogAt : nextIdleJogAt(now)
    }
  }

  return state
}

export function runMotionSchedulerSelfCheck(): boolean {
  const now = Date.now()
  const initialized = initializeMotionSchedule(now)
  if (initialized.currentMotionId !== "walk-loop") {
    return false
  }

  const finished = resolveMotionByState("finished", now + 100, initialized)
  if (finished.currentMotionId !== "finished-signal") {
    return false
  }

  const failed = resolveMotionByState("failed", now + 200, initialized)
  if (failed.currentMotionId !== "failed-reset") {
    return false
  }

  const sleeping = resolveMotionByState("sleeping", now + 300, initialized)
  if (sleeping.currentMotionId !== "sleep-slow") {
    return false
  }

  return true
}
