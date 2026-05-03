import React from "react"
import type { SevenDayStats } from "../../shared/types"

const EMPTY_STATS: SevenDayStats = {
  days: [],
  generatedAt: 0,
  levelSeries: [],
  sourceDistribution: {}
}

function renderSourceRows(sourceDistribution: Record<string, number>): React.ReactNode {
  const entries = Object.entries(sourceDistribution).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) {
    return <p className="muted">No source data yet.</p>
  }

  return (
    <ul className="list">
      {entries.map(([source, count]) => (
        <li key={source}>
          <span>{source}</span>
          <strong>{count}</strong>
        </li>
      ))}
    </ul>
  )
}

export function DataPanelApp(): React.ReactElement {
  const [stats, setStats] = React.useState<SevenDayStats>(EMPTY_STATS)
  const [view, setView] = React.useState<"seven_days" | "today">("seven_days")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextStats = await window.tinkerpetDataPanel.getSevenDayStats()
      setStats(nextStats)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const visibleDays = React.useMemo(() => {
    if (view === "today") {
      return stats.days.slice(-1)
    }

    return stats.days
  }, [stats.days, view])

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Data Panel</h1>
          <p>{view === "today" ? "Today overview" : "Last 7 days overview"}</p>
        </div>
        <div className="header-actions">
          <div className="segmented">
            <button
              className={view === "today" ? "active" : ""}
              onClick={() => setView("today")}
              type="button"
            >
              Today
            </button>
            <button
              className={view === "seven_days" ? "active" : ""}
              onClick={() => setView("seven_days")}
              type="button"
            >
              7 Days
            </button>
          </div>
          <button disabled={loading} onClick={() => void refresh()} type="button">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <h2>7-Day Timeline</h2>
        <div className="table">
          <div className="row head">
            <span>Date</span>
            <span>Sessions</span>
            <span>Done</span>
            <span>Failed</span>
            <span>Wait(min)</span>
            <span>XP</span>
          </div>
          {visibleDays.map((day) => (
            <div className="row" key={day.date}>
              <span>{day.date}</span>
              <span>{day.waitingSessions}</span>
              <span>{day.finishedTasks}</span>
              <span>{day.failedTasks}</span>
              <span>{day.durationMinutes}</span>
              <span>{day.xpGained}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Source Distribution</h2>
          {renderSourceRows(stats.sourceDistribution)}
        </article>
        <article className="panel">
          <h2>Level Series</h2>
          <ul className="list">
            {stats.levelSeries.map((item) => (
              <li key={item.date}>
                <span>{item.date}</span>
                <strong>{item.level}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
