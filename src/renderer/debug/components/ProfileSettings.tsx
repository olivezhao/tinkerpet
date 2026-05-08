import React from "react"
import type { PetPersonality, PetProfile } from "../../../shared/types"
import { AVAILABLE_SKIN_IDS } from "../../../shared/skins"

const MAX_PET_NAME_LENGTH = 20

interface ProfileSettingsProps {
  mode?: "appearance" | "general" | "personality"
  onProfileUpdated: (profile: PetProfile) => void
  profile: PetProfile | null
}

export function ProfileSettings({
  mode = "general",
  onProfileUpdated,
  profile
}: ProfileSettingsProps): React.ReactElement {
  const [draftName, setDraftName] = React.useState(profile?.petName ?? "")
  const [draftPersonality, setDraftPersonality] = React.useState<PetPersonality>(
    profile?.personality ?? "encourage"
  )
  const [draftSkinId, setDraftSkinId] = React.useState(profile?.skinId ?? "default-bot")
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    setDraftName(profile?.petName ?? "")
    setDraftPersonality(profile?.personality ?? "encourage")
    setDraftSkinId(profile?.skinId ?? "default-bot")
  }, [profile?.petName, profile?.personality, profile?.skinId])

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

  async function saveSkin(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const nextProfile = await window.tinkerpetDebug.updateProfileSkin(draftSkinId)
      onProfileUpdated(nextProfile)
      setSavedMessage("Skin updated.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save skin.")
    } finally {
      setIsSaving(false)
    }
  }

  async function savePersonality(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const nextProfile =
        await window.tinkerpetDebug.updateProfilePersonality(draftPersonality)
      onProfileUpdated(nextProfile)
      setSavedMessage("Personality updated.")
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save personality."
      )
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
      {mode === "general" ? (
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
      ) : null}

      {mode === "appearance" ? (
        <form className="profile-form" onSubmit={(event) => void saveSkin(event)}>
          <label htmlFor="pet-skin">Pet skin</label>
          <div className="profile-form-row">
            <select
              id="pet-skin"
              onChange={(event) => {
                setDraftSkinId(event.target.value)
                setError(null)
                setSavedMessage(null)
              }}
              value={draftSkinId}
            >
              {AVAILABLE_SKIN_IDS.map((skinId) => (
                <option key={skinId} value={skinId}>
                  {skinId}
                </option>
              ))}
            </select>
            <button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Apply"}
            </button>
          </div>
          <div className="profile-meta-row">
            {profile ? <span>Current: {profile.skinId}</span> : null}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {savedMessage ? <p className="form-success">{savedMessage}</p> : null}
        </form>
      ) : null}

      {mode === "personality" ? (
        <form className="profile-form" onSubmit={(event) => void savePersonality(event)}>
          <label htmlFor="pet-personality">Personality</label>
          <div className="profile-form-row">
            <select
              id="pet-personality"
              onChange={(event) => {
                setDraftPersonality(event.target.value as PetPersonality)
                setError(null)
                setSavedMessage(null)
              }}
              value={draftPersonality}
            >
              <option value="encourage">encourage</option>
              <option value="tease">tease</option>
              <option value="calm">calm</option>
            </select>
            <button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Apply"}
            </button>
          </div>
          <div className="profile-meta-row">
            {profile ? <span>Current: {profile.personality}</span> : null}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {savedMessage ? <p className="form-success">{savedMessage}</p> : null}
        </form>
      ) : null}
    </section>
  )
}
