import React from "react"
import type { DebugSnapshot, PetEvent, PetProfile } from "../../shared/types"
import { CurrentState } from "./components/CurrentState"
import { EventButtons } from "./components/EventButtons"
import { EventLog } from "./components/EventLog"
import { ProfileSettings } from "./components/ProfileSettings"
import { SourceConnections } from "./components/SourceConnections"

const EMPTY_SNAPSHOT: DebugSnapshot = {
  activeTaskCount: 0,
  dailyStats: {
    activeTasks: {},
    completedCount: 0,
    date: "",
    failedCount: 0,
    firstUseXpAwarded: false,
    rewardedTaskKeys: [],
    startedCount: 0,
    totalWaitMs: 0,
    xpEarned: 0
  },
  eventLog: [],
  profile: {
    createdAt: 0,
    level: 1,
    petName: "Tinker",
    updatedAt: 0,
    xp: 0
  },
  sources: [],
  state: "idle"
}

export function DebugApp(): React.ReactElement {
  const [snapshot, setSnapshot] = React.useState<DebugSnapshot>(EMPTY_SNAPSHOT)
  const [profile, setProfile] = React.useState<PetProfile | null>(null)

  React.useEffect(() => {
    let active = true

    void Promise.all([
      window.tinkerpetDebug.getSnapshot(),
      window.tinkerpetDebug.getProfile()
    ]).then(([nextSnapshot, nextProfile]) => {
      if (!active) {
        return
      }

      setSnapshot(nextSnapshot)
      setProfile(nextProfile)
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
    setProfile(nextSnapshot.profile)
  }

  async function handleClearLog(): Promise<void> {
    const nextSnapshot = await window.tinkerpetDebug.clearEventLog()
    setSnapshot(nextSnapshot)
    setProfile(nextSnapshot.profile)
  }

  return (
    <main className="debug-shell">
      <header>
        <p className="eyebrow">TinkerPet V0.2</p>
        <h1>{profile?.petName ?? "Tinker"} Settings</h1>
      </header>
      <ProfileSettings onProfileUpdated={setProfile} profile={profile} />
      <SourceConnections sources={snapshot.sources} />
      <CurrentState snapshot={snapshot} />
      <EventButtons onSendEvent={handleSendEvent} />
      <EventLog items={snapshot.eventLog} onClearLog={handleClearLog} />
    </main>
  )
}
