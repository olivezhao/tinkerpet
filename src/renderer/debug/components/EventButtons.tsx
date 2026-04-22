import React from "react"
import type { PetEvent } from "../../../shared/types"

interface EventButtonsProps {
  onSendEvent: (event: PetEvent) => Promise<void>
}

const DEBUG_EVENTS: Array<{ event: PetEvent; label: string }> = [
  {
    event: { source: "debug-panel", title: "AI task", type: "AI_TASK_STARTED" },
    label: "AI Start"
  },
  {
    event: { source: "debug-panel", title: "AI task", type: "AI_TASK_FINISHED" },
    label: "AI Finish"
  },
  {
    event: {
      reason: "Debug failure",
      source: "debug-panel",
      title: "AI task",
      type: "AI_TASK_FAILED"
    },
    label: "AI Fail"
  },
  {
    event: {
      source: "debug-panel",
      taskId: "workflow-debug",
      title: "Workflow task",
      type: "WORKFLOW_TASK_STARTED"
    },
    label: "Workflow Start"
  },
  {
    event: {
      source: "debug-panel",
      taskId: "workflow-debug",
      title: "Workflow task",
      type: "WORKFLOW_TASK_FINISHED"
    },
    label: "Workflow Finish"
  },
  {
    event: {
      reason: "Debug failure",
      source: "debug-panel",
      taskId: "workflow-debug",
      title: "Workflow task",
      type: "WORKFLOW_TASK_FAILED"
    },
    label: "Workflow Fail"
  }
]

export function EventButtons({ onSendEvent }: EventButtonsProps): React.ReactElement {
  const [pendingLabel, setPendingLabel] = React.useState<string | null>(null)

  async function sendEvent(label: string, event: PetEvent): Promise<void> {
    setPendingLabel(label)

    try {
      await onSendEvent(event)
    } finally {
      setPendingLabel(null)
    }
  }

  return (
    <section className="panel">
      <h2>Manual Events</h2>
      <div className="button-grid">
        {DEBUG_EVENTS.map(({ event, label }) => (
          <button
            disabled={pendingLabel !== null}
            key={label}
            onClick={() => void sendEvent(label, event)}
            type="button"
          >
            {pendingLabel === label ? "Sending..." : label}
          </button>
        ))}
      </div>
    </section>
  )
}
