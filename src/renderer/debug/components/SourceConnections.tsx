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
              </div>
              <div className="source-meta">
                <span className={`source-status source-status-${source.status}`}>
                  {source.status}
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
