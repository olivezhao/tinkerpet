import React from "react"
import type { DebugSnapshot } from "../../../shared/types"
import {
  getMotionTuningConfig,
  resetMotionTuningConfig,
  updateMotionTuningConfig,
  type MotionTuningConfig
} from "../../../shared/motionPresets"

interface CurrentStateProps {
  snapshot: DebugSnapshot
}

export function CurrentState({ snapshot }: CurrentStateProps): React.ReactElement {
  const totalWaitMinutes = Math.round(snapshot.dailyStats.totalWaitMs / 60000)
  const [tuning, setTuning] = React.useState<MotionTuningConfig>(getMotionTuningConfig())

  function updateField<K extends keyof MotionTuningConfig>(
    key: K,
    value: MotionTuningConfig[K]
  ): void {
    const next = updateMotionTuningConfig({ [key]: value } as Partial<MotionTuningConfig>)
    setTuning(next)
  }

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
      <div className="motion-config-grid" aria-label="V0.6 motion tuning">
        <div>
          <span>Motion Cooldown</span>
          <strong>{Math.round(tuning.globalMotionCooldownMs / 1000)}s</strong>
        </div>
        <div>
          <span>Rest Window</span>
          <strong>
            {Math.round(tuning.restingWindowMinMs / 1000)}-
            {Math.round(tuning.restingWindowMaxMs / 1000)}s
          </strong>
        </div>
        <div>
          <span>Jog Chance</span>
          <strong>{Math.round(tuning.jogBurstProbability * 100)}%</strong>
        </div>
        <div>
          <span>Long Wait Gate</span>
          <strong>{Math.round(tuning.longWaitThresholdMs / 1000)}s</strong>
        </div>
      </div>
      <div className="motion-controls-grid" aria-label="V0.6 motion controls">
        <label>
          <span>Jog Chance (%)</span>
          <input
            max={60}
            min={5}
            onChange={(event) => {
              updateField("jogBurstProbability", Number(event.target.value) / 100)
            }}
            type="range"
            value={Math.round(tuning.jogBurstProbability * 100)}
          />
        </label>
        <label>
          <span>Motion Cooldown (ms)</span>
          <input
            max={8000}
            min={1000}
            onChange={(event) => {
              updateField("globalMotionCooldownMs", Number(event.target.value))
            }}
            step={250}
            type="range"
            value={tuning.globalMotionCooldownMs}
          />
        </label>
        <label>
          <span>Long Wait Threshold (s)</span>
          <input
            max={180}
            min={20}
            onChange={(event) => {
              updateField("longWaitThresholdMs", Number(event.target.value) * 1000)
            }}
            step={5}
            type="range"
            value={Math.round(tuning.longWaitThresholdMs / 1000)}
          />
        </label>
        <label>
          <span>Long Wait Scale (%)</span>
          <input
            max={95}
            min={40}
            onChange={(event) => {
              updateField("longWaitFrequencyScale", Number(event.target.value) / 100)
            }}
            step={5}
            type="range"
            value={Math.round(tuning.longWaitFrequencyScale * 100)}
          />
        </label>
      </div>
      <div className="motion-controls-row">
        <button
          onClick={() => {
            const next = resetMotionTuningConfig()
            setTuning(next)
          }}
          type="button"
        >
          Reset Motion Tuning
        </button>
      </div>
    </section>
  )
}
