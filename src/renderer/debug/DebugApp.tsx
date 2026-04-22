import React from "react"
import type { DebugSnapshot, PetEvent } from "../../shared/types"
import { CurrentState } from "./components/CurrentState"
import { EventButtons } from "./components/EventButtons"
import { EventLog } from "./components/EventLog"

const EMPTY_SNAPSHOT: DebugSnapshot = {
  activeTaskCount: 0,
  eventLog: [],
  state: "idle"
}

export function DebugApp(): React.ReactElement {
  const [snapshot, setSnapshot] = React.useState<DebugSnapshot>(EMPTY_SNAPSHOT)

  React.useEffect(() => {
    let active = true

    void window.tinkerpetDebug.getSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot)
      }
    })

    const unsubscribe = window.tinkerpetDebug.onSnapshotUpdated(setSnapshot)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function handleSendEvent(event: PetEvent): Promise<void> {
    const nextSnapshot = await window.tinkerpetDebug.sendDebugEvent(event)
    setSnapshot(nextSnapshot)
  }

  async function handleClearLog(): Promise<void> {
    const nextSnapshot = await window.tinkerpetDebug.clearEventLog()
    setSnapshot(nextSnapshot)
  }

  return (
    <main className="debug-shell">
      <header>
        <p className="eyebrow">TinkerPet V0.1</p>
        <h1>Debug Panel</h1>
      </header>
      <CurrentState snapshot={snapshot} />
      <EventButtons onSendEvent={handleSendEvent} />
      <EventLog items={snapshot.eventLog} onClearLog={handleClearLog} />
    </main>
  )
}
