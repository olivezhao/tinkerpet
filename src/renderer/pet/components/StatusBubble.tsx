import React from "react"
import type { PetState } from "../../../shared/types"

interface StatusBubbleProps {
  selfCheckPassed: boolean
  state: PetState
}

export function StatusBubble({
  selfCheckPassed,
  state
}: StatusBubbleProps): React.ReactElement {
  return (
    <div className="state-badge">
      {state}
      {selfCheckPassed ? "" : " !"}
    </div>
  )
}

