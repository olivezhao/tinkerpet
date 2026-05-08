import React from "react"

interface CompletionFxProps {
  kind: "envelope" | "paper-plane"
}

export function CompletionFx({ kind }: CompletionFxProps): React.ReactElement {
  return (
    <div className={`completion-fx completion-fx-${kind}`} aria-hidden="true">
      <span>{kind === "paper-plane" ? "✈" : "✉"}</span>
    </div>
  )
}
