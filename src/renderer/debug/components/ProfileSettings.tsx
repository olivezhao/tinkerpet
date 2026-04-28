import React from "react"
import type { PetProfile } from "../../../shared/types"

const MAX_PET_NAME_LENGTH = 20

interface ProfileSettingsProps {
  onProfileUpdated: (profile: PetProfile) => void
  profile: PetProfile | null
}

export function ProfileSettings({
  onProfileUpdated,
  profile
}: ProfileSettingsProps): React.ReactElement {
  const [draftName, setDraftName] = React.useState(profile?.petName ?? "")
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    setDraftName(profile?.petName ?? "")
  }, [profile?.petName])

  async function savePetName(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const normalizedName = draftName.trim()

    if (normalizedName.length === 0) {
      setError("Pet name is required.")
      setSavedMessage(null)
      return
    }

    if (normalizedName.length > MAX_PET_NAME_LENGTH) {
      setError(`Use ${MAX_PET_NAME_LENGTH} characters or fewer.`)
      setSavedMessage(null)
      return
    }

    setIsSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const nextProfile = await window.tinkerpetDebug.updatePetName(normalizedName)
      onProfileUpdated(nextProfile)
      setDraftName(nextProfile.petName)
      setSavedMessage("Saved.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel">
      <div>
        <h2>Pet Profile</h2>
        <p className="panel-copy">Name your desktop companion.</p>
      </div>
      <form className="profile-form" onSubmit={(event) => void savePetName(event)}>
        <label htmlFor="pet-name">Pet name</label>
        <div className="profile-form-row">
          <input
            id="pet-name"
            maxLength={MAX_PET_NAME_LENGTH}
            onChange={(event) => {
              setDraftName(event.target.value)
              setError(null)
              setSavedMessage(null)
            }}
            placeholder="Tinker"
            type="text"
            value={draftName}
          />
          <button disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
        <div className="profile-meta-row">
          <span>
            {draftName.trim().length}/{MAX_PET_NAME_LENGTH}
          </span>
          {profile ? <span>Current: {profile.petName}</span> : null}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {savedMessage ? <p className="form-success">{savedMessage}</p> : null}
      </form>
    </section>
  )
}
