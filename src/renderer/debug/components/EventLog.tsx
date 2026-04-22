import React from "react"
import type { EventLogItem } from "../../../shared/types"

interface EventLogProps {
  items: EventLogItem[]
  onClearLog: () => Promise<void>
}

export function EventLog({ items, onClearLog }: EventLogProps): React.ReactElement {
  const [isClearing, setIsClearing] = React.useState(false)

  async function clearLog(): Promise<void> {
    setIsClearing(true)

    try {
      await onClearLog()
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <section className="panel event-log-panel">
      <div className="panel-title-row">
        <h2>Event Log</h2>
        <button
          className="secondary-button"
          disabled={isClearing || items.length === 0}
          onClick={() => void clearLog()}
          type="button"
        >
          {isClearing ? "Clearing..." : "Clear Log"}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="empty-log">No events yet.</p>
      ) : (
        <ol className="event-log">
          {items.map((item) => (
            <li key={item.eventId}>
              <div>
                <strong>{item.event.type}</strong>
                <span>{item.event.title ?? item.source}</span>
              </div>
              <time>{new Date(item.receivedAt).toLocaleTimeString()}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
