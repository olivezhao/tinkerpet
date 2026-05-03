import React from "react"
import type { PublicSourceRecord } from "../../../shared/types"

interface SourceConnectionsProps {
  sources: PublicSourceRecord[]
}

function formatLastSeenAt(lastSeenAt: number): string {
  if (!lastSeenAt) {
    return "Never"
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(lastSeenAt))
}

function formatHealthLabel(health: "online" | "offline"): string {
  return health === "online" ? "online" : "offline"
}

function resolveReconnectHint(health: "online" | "offline"): string {
  return health === "online"
    ? "Heartbeat normal"
    : "Offline. Open source app and trigger a task or heartbeat."
}

export function SourceConnections({
  sources
}: SourceConnectionsProps): React.ReactElement {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2>Connected Sources</h2>
        <span className="source-count">{sources.length}</span>
      </div>

      {sources.length === 0 ? (
        <p className="empty-log">No registered sources yet.</p>
      ) : (
        <ol className="source-list">
          {sources.map((source) => (
            <li key={source.sourceId}>
              <div>
                <strong>{source.name}</strong>
                <span>
                  {source.sourceType}
                  {source.provider ? ` · ${source.provider}` : ""}
                </span>
                <span>{resolveReconnectHint(source.health)}</span>
              </div>
              <div className="source-meta">
                <span className={`source-status source-status-${source.health}`}>
                  {formatHealthLabel(source.health)}
                </span>
                <time dateTime={new Date(source.lastSeenAt).toISOString()}>
                  {formatLastSeenAt(source.lastSeenAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
