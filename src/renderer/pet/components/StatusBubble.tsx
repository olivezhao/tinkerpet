import React from "react"

interface StatusBubbleProps {
  message: string
  selfCheckPassed: boolean
}

export function StatusBubble({
  message,
  selfCheckPassed,
}: StatusBubbleProps): React.ReactElement {
  return (
    <div className="state-badge">
      {message}
      {selfCheckPassed ? "" : " !"}
    </div>
  )
}
