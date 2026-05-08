import React from "react"
import type { MotionId } from "../../shared/motionPresets"
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
import { runAssetManifestSelfCheck } from "./assetManifestValidator"
import { PetSprite } from "./components/PetSprite"
import { StatusBubble } from "./components/StatusBubble"
import { CompletionFx } from "./components/CompletionFx"
import { resolveExpressionPreset } from "./expressionManifest"
import {
  resolveBubbleTextByEvent,
  resolveBubbleTextByState,
  resolveLongWaitText
} from "../../shared/personality"
import {
  initializeMotionSchedule,
  pickInteractionMotion,
  resolveMotionByState,
  runMotionSchedulerSelfCheck
} from "./motionScheduler"
import { runMotionPresetsSelfCheck } from "../../shared/motionPresets"
import { runShowcasePoolSelfCheck } from "./showcasePool"

const SELF_CHECK_PASSED =
  runPetStateMachineSelfCheck() &&
  runAnimationManifestSelfCheck() &&
  runAssetManifestValidator() &&
  runMotionSchedulerSelfCheck() &&
  runMotionPresetsSelfCheck() &&
  runShowcasePoolSelfCheck()

function runAssetManifestValidator(): boolean {
  return runAssetManifestSelfCheck()
}

export function PetApp(): React.ReactElement {
  const [machineState, setMachineState] = React.useState<PetMachineState>(
    INITIAL_PET_MACHINE_STATE
  )
  const [skinId, setSkinId] = React.useState("default-bot")
  const [motionId, setMotionId] = React.useState<MotionId>("walk-loop")
  const [personality, setPersonality] = React.useState<PetPersonality>("encourage")
  const [bubbleText, setBubbleText] = React.useState("我在这，随时开工。")
  const [completionFxKind, setCompletionFxKind] = React.useState<"envelope" | "paper-plane" | null>(
    null
  )
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
  const expression = React.useMemo(
    () => resolveExpressionPreset(personality, machineState.state),
    [personality, machineState.state]
  )
  const schedulerRef = React.useRef(initializeMotionSchedule())

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
    const now = Date.now()
    const next = resolveMotionByState(machineState.state, now, schedulerRef.current)
    schedulerRef.current = next
    setMotionId(next.currentMotionId)
  }, [machineState.state])

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now()
      const next = resolveMotionByState(machineState.state, now, schedulerRef.current)
      if (next.currentMotionId !== schedulerRef.current.currentMotionId) {
        setMotionId(next.currentMotionId)
      }
      schedulerRef.current = next
    }, 1000)

    return () => window.clearInterval(timer)
  }, [machineState.state])

  React.useEffect(() => {
    if (machineState.state !== "finished" && machineState.state !== "failed") {
      return undefined
    }

    let fxTimer: number | null = null
    if (machineState.state === "finished") {
      setCompletionFxKind(Math.random() > 0.5 ? "paper-plane" : "envelope")
      fxTimer = window.setTimeout(() => {
        setCompletionFxKind(null)
      }, 1100)
    }

    const timeoutMs = machineState.state === "finished" ? 2000 : 3000
    const timeout = window.setTimeout(() => {
      setMachineState(resolveTransientPetState)
    }, timeoutMs)

    return () => {
      if (fxTimer !== null) {
        window.clearTimeout(fxTimer)
      }
      window.clearTimeout(timeout)
    }
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

  function handlePetClick(event: React.MouseEvent<HTMLElement>): void {
    const target = event.target
    if (target instanceof HTMLCanvasElement || target instanceof SVGElement) {
      return
    }

    const interaction = pickInteractionMotion(Date.now(), schedulerRef.current)
    schedulerRef.current = interaction.nextState
    if (interaction.motionId) {
      setMotionId(interaction.motionId)
    }

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
        expression={expression}
        motionId={motionId}
        skinId={skinId}
        state={machineState.state}
      />
      {completionFxKind ? <CompletionFx kind={completionFxKind} /> : null}
      <StatusBubble
        message={bubbleText}
        selfCheckPassed={SELF_CHECK_PASSED}
      />
    </main>
  )
}
