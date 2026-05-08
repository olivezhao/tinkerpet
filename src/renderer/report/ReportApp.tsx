import React from "react"
import type { DailyReportSummary, ShareCardResult } from "../../shared/types"

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-")
  if (!year || !month || !day) {
    return dateKey
  }
  return `${year}/${month}/${day}`
}

const EMPTY_REPORT: DailyReportSummary = {
  activeTaskCount: 0,
  completedCount: 0,
  date: "",
  failedCount: 0,
  generatedAt: 0,
  level: 1,
  petName: "Tinker",
  personality: "encourage",
  skinId: "default-bot",
  startedCount: 0,
  summaryText: "",
  topSource: "No active source",
  totalWaitMinutes: 0,
  totalXp: 0,
  todayXp: 0
}

export function ReportApp(): React.ReactElement {
  const [loading, setLoading] = React.useState(true)
  const [shareCard, setShareCard] = React.useState<ShareCardResult | null>(null)
  const [shareLoading, setShareLoading] = React.useState(false)
  const [report, setReport] = React.useState<DailyReportSummary>(EMPTY_REPORT)
  const [error, setError] = React.useState<string | null>(null)

  const refreshReport = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextReport = await window.tinkerpetReport.getDailyReport()
      setReport(nextReport)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load report")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refreshReport()
  }, [refreshReport])

  async function handleGenerateShareCard(): Promise<void> {
    setShareLoading(true)
    setError(null)

    try {
      const nextShareCard = await window.tinkerpetReport.generateShareCard()
      setShareCard(nextShareCard)
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to generate share card"
      )
    } finally {
      setShareLoading(false)
    }
  }

  async function handleRevealShareCard(): Promise<void> {
    if (!shareCard) {
      return
    }

    try {
      await window.tinkerpetReport.revealShareCard(shareCard.filePath)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to reveal file")
    }
  }

  return (
    <main className="report-shell">
      <header className="report-header">
        <div>
          <p className="eyebrow">Daily Report</p>
          <h1>{report.petName}</h1>
          <p className="subtitle">{formatDate(report.date)}</p>
        </div>
        <button disabled={loading} onClick={() => void refreshReport()} type="button">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="panel">
        <div className="button-row">
          <button
            disabled={shareLoading}
            onClick={() => void handleGenerateShareCard()}
            type="button"
          >
            {shareLoading ? "Generating..." : "Generate Share Card"}
          </button>
          <button
            className="secondary-button"
            disabled={!shareCard}
            onClick={() => void handleRevealShareCard()}
            type="button"
          >
            Reveal in Finder
          </button>
        </div>
        <p className="meta-copy">
          {shareCard ? `Latest file: ${shareCard.fileName}` : "No card generated yet."}
        </p>
      </section>

      <section className="report-grid">
        <article className="metric-card">
          <span>Today XP</span>
          <strong>{report.todayXp}</strong>
        </article>
        <article className="metric-card">
          <span>Total XP</span>
          <strong>{report.totalXp}</strong>
        </article>
        <article className="metric-card">
          <span>Level</span>
          <strong>{report.level}</strong>
        </article>
        <article className="metric-card">
          <span>Wait Minutes</span>
          <strong>{report.totalWaitMinutes}</strong>
        </article>
        <article className="metric-card">
          <span>Started</span>
          <strong>{report.startedCount}</strong>
        </article>
        <article className="metric-card">
          <span>Completed</span>
          <strong>{report.completedCount}</strong>
        </article>
        <article className="metric-card">
          <span>Failed</span>
          <strong>{report.failedCount}</strong>
        </article>
        <article className="metric-card">
          <span>Active</span>
          <strong>{report.activeTaskCount}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>Pet Identity</h2>
        <p>
          Skin: {report.skinId} · Personality: {report.personality}
        </p>
      </section>

      <section className="panel">
        <h2>Top Source</h2>
        <p>{report.topSource}</p>
      </section>

      <section className="panel">
        <h2>Summary</h2>
        <p>{report.summaryText}</p>
      </section>
    </main>
  )
}
