import React from "react"
import type { DecorSelection, PetState } from "../../../shared/types"
import type { MotionId } from "../../../shared/motionPresets"
import { resolveAnimationForMotionId } from "../animationManifest"
import type { ExpressionPreset } from "../expressionManifest"
import { resolveSkinTheme } from "../skinManifest"
import robotSprite from "../assets/prototype/tinker-front.png"
import { ThreePetCanvas } from "./ThreePetCanvas"

interface PetSpriteProps {
  decorSelection: DecorSelection
  expression: ExpressionPreset
  motionId: MotionId
  skinId: string
  state: PetState
}

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

function resolveInitialRenderMode(): "2d" | "3d" {
  return canUseWebGL() ? "3d" : "2d"
}

export function PetSprite({
  decorSelection,
  expression,
  motionId,
  skinId,
  state
}: PetSpriteProps): React.ReactElement {
  const animation = resolveAnimationForMotionId(motionId)
  const theme = resolveSkinTheme(skinId)
  const [renderMode, setRenderMode] = React.useState<"2d" | "3d">(resolveInitialRenderMode)

  return (
    <section
      className="pet-placeholder"
      aria-label={`TinkerPet is ${state}`}
      data-animation={animation.name}
      data-render-mode={renderMode}
      data-skin={skinId}
      data-loop={animation.loop}
      style={
        {
          "--animation-duration": `${animation.durationMs}ms`,
          "--pet-border-color": theme.borderColor,
          "--pet-body-color": theme.bodyColor,
          "--pet-core-color": theme.coreColor,
          "--pet-eye-color": theme.eyeColor,
          "--pet-flash-color": theme.flashColor,
          "--pet-head-color": theme.headColor,
          "--pet-joint-color": theme.jointColor,
          "--pet-mouth-color": theme.mouthColor,
          "--pet-shadow-color": theme.shadowColor,
          "--pet-sleep-color": theme.sleepColor,
          "--pet-tool-bay-color": theme.toolBayColor,
          "--pet-tool-color": theme.toolColor,
          "--pet-torso-color": theme.torsoColor
        } as React.CSSProperties
      }
    >
      <div
        className="room-decor room-background"
        data-item={decorSelection.background ?? "none"}
      />
      <div className="room-decor room-desk" data-item={decorSelection.desk ?? "none"} />
      <div
        className="room-decor room-hanging"
        data-item={decorSelection.hanging ?? "none"}
      />
      <div className="pet-sleep-z">z</div>
      <div className="pet-flash" />
      <div className="pet-body">
        {renderMode === "3d" ? (
          <ThreePetCanvas
            animationName={animation.name}
            expression={expression}
            motionId={motionId}
            onInitError={() => setRenderMode("2d")}
            skin={theme}
          />
        ) : (
          <>
            <img className="pet-character-image" src={robotSprite} alt="" aria-hidden="true" />
            <div className={`pet-expression-overlay pet-head-${expression.head}`}>
              <div className="pet-face">
                <span className={`pet-eye-${expression.eye}`} />
                <span className={`pet-eye-${expression.eye}`} />
              </div>
              <div className={`pet-mouth pet-mouth-${expression.mouth}`} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
