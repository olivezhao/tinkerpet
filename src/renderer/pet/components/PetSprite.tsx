import React from "react"
import type { DecorSelection, PetState } from "../../../shared/types"
import { PET_ANIMATION_MANIFEST } from "../animationManifest"
import { resolveSkinTheme } from "../skinManifest"

interface PetSpriteProps {
  decorSelection: DecorSelection
  skinId: string
  state: PetState
}

export function PetSprite({
  decorSelection,
  skinId,
  state
}: PetSpriteProps): React.ReactElement {
  const animation = PET_ANIMATION_MANIFEST[state]
  const theme = resolveSkinTheme(skinId)

  return (
    <section
      className="pet-placeholder"
      aria-label={`TinkerPet is ${state}`}
      data-animation={animation.name}
      data-skin={skinId}
      data-loop={animation.loop}
      style={
        {
          "--animation-duration": `${animation.durationMs}ms`,
          "--pet-body-color": theme.bodyColor,
          "--pet-eye-color": theme.eyeColor,
          "--pet-flash-color": theme.flashColor,
          "--pet-mouth-color": theme.mouthColor,
          "--pet-shadow-color": theme.shadowColor,
          "--pet-sleep-color": theme.sleepColor,
          "--pet-tool-color": theme.toolColor
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
      <div className="pet-shadow" />
      <div className="pet-body">
        <div className="pet-face">
          <span />
          <span />
        </div>
        <div className="pet-mouth" />
        <div className="pet-tool" />
      </div>
    </section>
  )
}
