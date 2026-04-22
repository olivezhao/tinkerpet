import React from "react"
import type { DebugSnapshot } from "../../../shared/types"

interface CurrentStateProps {
  snapshot: DebugSnapshot
}

export function CurrentState({ snapshot }: CurrentStateProps): React.ReactElement {
  return (
    <section className="panel">
      <h2>Current State</h2>
      <div className="state-grid">
        <div>
          <span>State</span>
          <strong>{snapshot.state}</strong>
        </div>
        <div>
          <span>Active Tasks</span>
          <strong>{snapshot.activeTaskCount}</strong>
        </div>
      </div>
    </section>
  )
}
