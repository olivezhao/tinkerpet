import React from "react"
import type { DecorState, PetPersonality } from "../../shared/types"
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
import {
  resolveBubbleTextByEvent,
  resolveBubbleTextByState,
  resolveLongWaitText
} from "../../shared/personality"

const SELF_CHECK_PASSED =
  runPetStateMachineSelfCheck() && runAnimationManifestSelfCheck()

export function PetApp(): React.ReactElement {
  const [machineState, setMachineState] = React.useState<PetMachineState>(
    INITIAL_PET_MACHINE_STATE
  )
  const [skinId, setSkinId] = React.useState("default-bot")
  const [personality, setPersonality] = React.useState<PetPersonality>("encourage")
  const [bubbleText, setBubbleText] = React.useState("我在这，随时开工。")
  const [decorState, setDecorState] = React.useState<DecorState>({
    decorPoints: 0,
    selected: {
      background: "none",
      desk: "none",
      hanging: "none"
    },
    unlockedItemIds: [],
    updatedAt: 0
  })

  React.useEffect(() => {
    let active = true

    void Promise.all([
      window.tinkerpet.getProfile(),
      window.tinkerpet.getDecorState()
    ])
      .then(([profile, nextDecorState]) => {
        if (active) {
          setSkinId(profile.skinId)
          setPersonality(profile.personality)
          setBubbleText(resolveBubbleTextByState(profile.personality, machineState.state))
          setDecorState(nextDecorState)
        }
      })
      .catch((error) => {
        console.error("TinkerPet failed to load profile in pet window:", error)
      })

    const unsubscribe = window.tinkerpet.onProfileUpdated((profile) => {
      setSkinId(profile.skinId)
      setPersonality(profile.personality)
      setBubbleText(resolveBubbleTextByState(profile.personality, machineState.state))
    })
    const unsubscribeDecor = window.tinkerpet.onDecorUpdated((nextDecorState) => {
      setDecorState(nextDecorState)
    })

    return () => {
      active = false
      unsubscribe()
      unsubscribeDecor()
    }
  }, [])

  React.useEffect(() => {
    if (!window.tinkerpet?.onPetEvent) {
      console.error("TinkerPet preload API is unavailable in the pet renderer.")
      return undefined
    }

    const unsubscribe = window.tinkerpet.onPetEvent((event) => {
      setBubbleText(resolveBubbleTextByEvent(personality, event.type))
      setMachineState((current) => transitionPetState(current, event))
    })

    return unsubscribe
  }, [personality])

  React.useEffect(() => {
    if (machineState.state !== "waiting") {
      setBubbleText(resolveBubbleTextByState(personality, machineState.state))
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setBubbleText(resolveLongWaitText(personality))
    }, 45_000)

    return () => window.clearTimeout(timeout)
  }, [machineState.state, personality])

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
      <PetSprite
        decorSelection={decorState.selected}
        skinId={skinId}
        state={machineState.state}
      />
      <StatusBubble
        message={bubbleText}
        selfCheckPassed={SELF_CHECK_PASSED}
      />
    </main>
  )
}
