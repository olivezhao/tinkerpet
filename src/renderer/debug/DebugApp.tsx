import React from "react"
import type { DebugSnapshot, DecorState, PetEvent, PetProfile } from "../../shared/types"
import { CurrentState } from "./components/CurrentState"
import { DataPrivacySettings } from "./components/DataPrivacySettings"
import { DecorSettings } from "./components/DecorSettings"
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
    personality: "encourage",
    skinId: "default-bot",
    updatedAt: 0,
    xp: 0
  },
  sources: [],
  state: "idle"
}

export function DebugApp(): React.ReactElement {
  const [snapshot, setSnapshot] = React.useState<DebugSnapshot>(EMPTY_SNAPSHOT)
  const [profile, setProfile] = React.useState<PetProfile | null>(null)
  const [decorState, setDecorState] = React.useState<DecorState | null>(null)
  const [activeTab, setActiveTab] = React.useState<
    "appearance" | "connections" | "general" | "personality" | "privacy"
  >("general")

  React.useEffect(() => {
    let active = true

    void Promise.all([
      window.tinkerpetDebug.getSnapshot(),
      window.tinkerpetDebug.getProfile(),
      window.tinkerpetDebug.getDecorState()
    ]).then(([nextSnapshot, nextProfile, nextDecorState]) => {
      if (!active) {
        return
      }

      setSnapshot(nextSnapshot)
      setProfile(nextProfile)
      setDecorState(nextDecorState)
    })

    const unsubscribe = window.tinkerpetDebug.onSnapshotUpdated(setSnapshot)
    const unsubscribeProfile = window.tinkerpetDebug.onProfileUpdated(setProfile)
    const unsubscribeDecor = window.tinkerpetDebug.onDecorUpdated(setDecorState)

    return () => {
      active = false
      unsubscribe()
      unsubscribeProfile()
      unsubscribeDecor()
    }
  }, [])

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      void window.tinkerpetDebug.getSnapshot().then((nextSnapshot) => {
        setSnapshot(nextSnapshot)
      })
    }, 10_000)

    return () => window.clearInterval(interval)
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

  function handleSnapshotUpdated(nextSnapshot: DebugSnapshot): void {
    setSnapshot(nextSnapshot)
    setProfile(nextSnapshot.profile)
  }

  return (
    <main className="debug-shell">
      <header>
        <p className="eyebrow">TinkerPet V0.3</p>
        <h1>{profile?.petName ?? "Tinker"} Settings</h1>
      </header>
      <nav className="settings-tabs" aria-label="Settings sections">
        <button
          className={activeTab === "general" ? "tab active" : "tab"}
          onClick={() => setActiveTab("general")}
          type="button"
        >
          General
        </button>
        <button
          className={activeTab === "appearance" ? "tab active" : "tab"}
          onClick={() => setActiveTab("appearance")}
          type="button"
        >
          Appearance
        </button>
        <button
          className={activeTab === "personality" ? "tab active" : "tab"}
          onClick={() => setActiveTab("personality")}
          type="button"
        >
          Personality
        </button>
        <button
          className={activeTab === "connections" ? "tab active" : "tab"}
          onClick={() => setActiveTab("connections")}
          type="button"
        >
          Connections
        </button>
        <button
          className={activeTab === "privacy" ? "tab active" : "tab"}
          onClick={() => setActiveTab("privacy")}
          type="button"
        >
          Data & Privacy
        </button>
      </nav>

      {activeTab === "general" ? (
        <>
          <ProfileSettings
            mode="general"
            onProfileUpdated={setProfile}
            profile={profile}
          />
          <CurrentState snapshot={snapshot} />
        </>
      ) : null}

      {activeTab === "appearance" ? (
        <>
          <ProfileSettings
            mode="appearance"
            onProfileUpdated={setProfile}
            profile={profile}
          />
          <DecorSettings decorState={decorState} onDecorUpdated={setDecorState} />
        </>
      ) : null}

      {activeTab === "personality" ? (
        <ProfileSettings
          mode="personality"
          onProfileUpdated={setProfile}
          profile={profile}
        />
      ) : null}

      {activeTab === "connections" ? (
        <>
          <section className="panel">
            <h2>Reconnect Guide</h2>
            <p className="panel-copy">
              If a source turns offline, open the source app and trigger a new task. Browser
              extensions and CLI wrappers will send heartbeat on next action.
            </p>
          </section>
          <SourceConnections sources={snapshot.sources} />
          <EventButtons onSendEvent={handleSendEvent} />
          <EventLog items={snapshot.eventLog} onClearLog={handleClearLog} />
        </>
      ) : null}

      {activeTab === "privacy" ? (
        <DataPrivacySettings onSnapshotUpdated={handleSnapshotUpdated} />
      ) : null}
    </main>
  )
}
