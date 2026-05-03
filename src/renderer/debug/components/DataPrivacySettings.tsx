import React from "react"
import type { DebugSnapshot } from "../../../shared/types"

interface DataPrivacySettingsProps {
  onSnapshotUpdated: (snapshot: DebugSnapshot) => void
}

export function DataPrivacySettings({
  onSnapshotUpdated
}: DataPrivacySettingsProps): React.ReactElement {
  const [isClearing, setIsClearing] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function handleClearAllData(): Promise<void> {
    const confirmed = window.confirm(
      "Clear all local data? This will reset profile, stats, sources and logs."
    )

    if (!confirmed) {
      return
    }

    setIsClearing(true)
    setMessage(null)
    setError(null)

    try {
      const nextSnapshot = await window.tinkerpetDebug.clearLocalData()
      onSnapshotUpdated(nextSnapshot)
      setMessage("Local data cleared.")
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Failed to clear data.")
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <section className="panel">
      <div>
        <h2>Data & Privacy</h2>
        <p className="panel-copy">All data is stored locally on this machine.</p>
      </div>
      <button disabled={isClearing} onClick={() => void handleClearAllData()} type="button">
        {isClearing ? "Clearing..." : "Clear Local Data"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
    </section>
  )
}

