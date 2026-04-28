import React from "react"
import {
  INITIAL_PET_MACHINE_STATE,
  resolveIdleTimeoutState,
  resolveTransientPetState,
  runPetStateMachineSelfCheck,
  transitionPetState,
  type PetMachineState
} from "./petStateMachine"
import { runAnimationManifestSelfCheck } from "./animationManifest"
import { PetSprite } from "./components/PetSprite"
import { StatusBubble } from "./components/StatusBubble"

const SELF_CHECK_PASSED =
  runPetStateMachineSelfCheck() && runAnimationManifestSelfCheck()

export function PetApp(): React.ReactElement {
  const [machineState, setMachineState] = React.useState<PetMachineState>(
    INITIAL_PET_MACHINE_STATE
  )

  React.useEffect(() => {
    if (!window.tinkerpet?.onPetEvent) {
      console.error("TinkerPet preload API is unavailable in the pet renderer.")
      return undefined
    }

    const unsubscribe = window.tinkerpet.onPetEvent((event) => {
      setMachineState((current) => transitionPetState(current, event))
    })

    return unsubscribe
  }, [])

  React.useEffect(() => {
    if (machineState.state !== "finished" && machineState.state !== "failed") {
      return undefined
    }

    const timeoutMs = machineState.state === "finished" ? 2000 : 3000
    const timeout = window.setTimeout(() => {
      setMachineState(resolveTransientPetState)
    }, timeoutMs)

    return () => window.clearTimeout(timeout)
  }, [machineState.state])

  React.useEffect(() => {
    if (machineState.state !== "idle") {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setMachineState(resolveIdleTimeoutState)
    }, 10 * 60 * 1000)

    return () => window.clearTimeout(timeout)
  }, [machineState.state])

  function handlePetClick(): void {
    setMachineState((current) =>
      transitionPetState(current, {
        type:
          current.state === "waiting"
            ? "WORKFLOW_TASK_FINISHED"
            : "WORKFLOW_TASK_STARTED",
        source: "pet-click"
      })
    )
  }

  return (
    <main
      className="pet-window"
      aria-label="TinkerPet desktop pet"
      data-state={machineState.state}
      onClick={handlePetClick}
    >
      <PetSprite state={machineState.state} />
      <StatusBubble
        selfCheckPassed={SELF_CHECK_PASSED}
        state={machineState.state}
      />
    </main>
  )
}
