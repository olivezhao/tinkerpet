import type { PetEvent, PetState } from "../../shared/types"

export interface PetMachineState {
  activeTaskCount: number
  state: PetState
}

export const INITIAL_PET_MACHINE_STATE: PetMachineState = {
  activeTaskCount: 0,
  state: "idle"
}

function isStartedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_STARTED")
}

function isFinishedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FINISHED")
}

function isFailedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FAILED")
}

export function transitionPetState(
  current: PetMachineState,
  event: PetEvent
): PetMachineState {
  if (isStartedEvent(event)) {
    return {
      activeTaskCount: current.activeTaskCount + 1,
      state: "waiting"
    }
  }

  if (isFinishedEvent(event)) {
    return {
      activeTaskCount: Math.max(0, current.activeTaskCount - 1),
      state: "finished"
    }
  }

  if (isFailedEvent(event)) {
    return {
      activeTaskCount: Math.max(0, current.activeTaskCount - 1),
      state: "failed"
    }
  }

  return current
}

export function resolveTransientPetState(current: PetMachineState): PetMachineState {
  if (current.state !== "finished" && current.state !== "failed") {
    return current
  }

  return {
    ...current,
    state: current.activeTaskCount > 0 ? "waiting" : "idle"
  }
}

export function resolveIdleTimeoutState(current: PetMachineState): PetMachineState {
  if (current.state !== "idle" || current.activeTaskCount > 0) {
    return current
  }

  return {
    ...current,
    state: "sleeping"
  }
}

export function runPetStateMachineSelfCheck(): boolean {
  const waiting = transitionPetState(INITIAL_PET_MACHINE_STATE, {
    type: "WORKFLOW_TASK_STARTED",
    source: "self-check"
  })
  const finished = transitionPetState(waiting, {
    type: "WORKFLOW_TASK_FINISHED",
    source: "self-check"
  })
  const failed = transitionPetState(INITIAL_PET_MACHINE_STATE, {
    type: "AI_TASK_FAILED",
    source: "self-check"
  })
  const resolved = resolveTransientPetState(finished)

  return (
    waiting.state === "waiting" &&
    waiting.activeTaskCount === 1 &&
    finished.state === "finished" &&
    finished.activeTaskCount === 0 &&
    failed.state === "failed" &&
    failed.activeTaskCount === 0 &&
    resolved.state === "idle" &&
    resolved.activeTaskCount === 0
  )
}

