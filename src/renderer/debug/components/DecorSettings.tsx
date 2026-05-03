import React from "react"
import {
  DECOR_ITEMS,
  DECOR_SLOT_KEYS,
  getDecorUnlockRequirement,
  type DecorSlot
} from "../../../shared/decor"
import type { DecorState } from "../../../shared/types"

interface DecorSettingsProps {
  decorState: DecorState | null
  onDecorUpdated: (decorState: DecorState) => void
}

function formatSlotLabel(slot: DecorSlot): string {
  if (slot === "background") {
    return "Background"
  }
  if (slot === "hanging") {
    return "Hanging"
  }
  return "Desk"
}

export function DecorSettings({
  decorState,
  onDecorUpdated
}: DecorSettingsProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  async function handleChange(slot: DecorSlot, itemId: string): Promise<void> {
    setIsSaving(true)
    setError(null)

    try {
      const nextState = await window.tinkerpetDebug.updateDecorSelection(slot, itemId)
      onDecorUpdated(nextState)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update decor.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel">
      <div>
        <h2>Room Decor</h2>
        <p className="panel-copy">Decor points: {decorState?.decorPoints ?? 0}</p>
      </div>
      <div className="decor-grid">
        {DECOR_SLOT_KEYS.map((slot) => (
          <label className="decor-row" htmlFor={`decor-${slot}`} key={slot}>
            <span>{formatSlotLabel(slot)}</span>
            <select
              disabled={isSaving || !decorState}
              id={`decor-${slot}`}
              onChange={(event) => {
                void handleChange(slot, event.target.value)
              }}
              value={decorState?.selected[slot] ?? "none"}
            >
              {DECOR_ITEMS[slot].map((itemId) => {
                const requiredPoints = getDecorUnlockRequirement(itemId)
                const unlocked = (decorState?.decorPoints ?? 0) >= requiredPoints
                const label =
                  requiredPoints > 0
                    ? `${itemId} (${requiredPoints} pts)`
                    : `${itemId}`

                return (
                  <option disabled={!unlocked} key={itemId} value={itemId}>
                    {label}
                  </option>
                )
              })}
            </select>
          </label>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  )
}

