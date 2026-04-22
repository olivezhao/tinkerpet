import React from "react"
import type { PetState } from "../../../shared/types"
import { PET_ANIMATION_MANIFEST } from "../animationManifest"

interface PetSpriteProps {
  state: PetState
}

export function PetSprite({ state }: PetSpriteProps): React.ReactElement {
  const animation = PET_ANIMATION_MANIFEST[state]

  return (
    <section
      className="pet-placeholder"
      aria-label={`TinkerPet is ${state}`}
      data-animation={animation.name}
      data-loop={animation.loop}
      style={{ "--animation-duration": `${animation.durationMs}ms` } as React.CSSProperties}
    >
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
