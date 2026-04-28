import React from "react"
import type { DebugSnapshot } from "../../../shared/types"

interface CurrentStateProps {
  snapshot: DebugSnapshot
}

export function CurrentState({ snapshot }: CurrentStateProps): React.ReactElement {
  const totalWaitMinutes = Math.round(snapshot.dailyStats.totalWaitMs / 60000)

  return (
    <section className="panel">
      <h2>Current State & Growth</h2>
      <div className="state-grid">
        <div>
          <span>State</span>
          <strong>{snapshot.state}</strong>
        </div>
        <div>
          <span>Active Tasks</span>
          <strong>{snapshot.activeTaskCount}</strong>
        </div>
        <div>
          <span>Level</span>
          <strong>{snapshot.profile.level}</strong>
        </div>
        <div>
          <span>Total XP</span>
          <strong>{snapshot.profile.xp}</strong>
        </div>
        <div>
          <span>Today XP</span>
          <strong>{snapshot.dailyStats.xpEarned}</strong>
        </div>
        <div>
          <span>Today Completed</span>
          <strong>{snapshot.dailyStats.completedCount}</strong>
        </div>
        <div>
          <span>Today Failed</span>
          <strong>{snapshot.dailyStats.failedCount}</strong>
        </div>
        <div>
          <span>Wait Minutes</span>
          <strong>{totalWaitMinutes}</strong>
        </div>
      </div>
    </section>
  )
}
