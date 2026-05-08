import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { PetPersonality, PetProfile } from "../../shared/types"
import { DEFAULT_SKIN_ID, isSkinId } from "../../shared/skins"

const PROFILE_FILE_NAME = "tinkerpet-profile.json"
const DEFAULT_PET_NAME = "Tinker"
const MAX_PET_NAME_LENGTH = 20

let cachedProfile: PetProfile | null = null

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1
}

function getProfilePath(): string {
  return join(app.getPath("userData"), PROFILE_FILE_NAME)
}

function createDefaultProfile(): PetProfile {
  const now = Date.now()

  return {
    createdAt: now,
    level: calculateLevel(0),
    petName: DEFAULT_PET_NAME,
    personality: "encourage",
    skinId: DEFAULT_SKIN_ID,
    updatedAt: now,
    xp: 0
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function normalizePetName(value: string): string {
  return value.trim().slice(0, MAX_PET_NAME_LENGTH)
}

export function validatePetName(value: string): string | null {
  const normalizedName = normalizePetName(value)

  if (normalizedName.length === 0) {
    return "Pet name is required"
  }

  if (value.trim().length > MAX_PET_NAME_LENGTH) {
    return `Pet name must be ${MAX_PET_NAME_LENGTH} characters or fewer`
  }

  return null
}

function normalizePersonality(value: unknown): PetPersonality {
  if (value === "calm" || value === "encourage" || value === "tease") {
    return value
  }

  return "encourage"
}

function mergeProfile(value: unknown): PetProfile {
  const defaults = createDefaultProfile()

  if (!isRecord(value)) {
    return defaults
  }

  return {
    createdAt:
      typeof value.createdAt === "number" ? value.createdAt : defaults.createdAt,
    level:
      typeof value.xp === "number" ? calculateLevel(value.xp) : defaults.level,
    petName:
      typeof value.petName === "string" && validatePetName(value.petName) === null
        ? normalizePetName(value.petName)
        : defaults.petName,
    personality: normalizePersonality(value.personality),
    skinId: isSkinId(value.skinId) ? value.skinId : defaults.skinId,
    updatedAt:
      typeof value.updatedAt === "number" ? value.updatedAt : defaults.updatedAt,
    xp: typeof value.xp === "number" ? Math.max(0, value.xp) : defaults.xp
  }
}

function writeProfile(profile: PetProfile): void {
  const profilePath = getProfilePath()
  mkdirSync(dirname(profilePath), { recursive: true })
  writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8")
}

export function loadProfile(): PetProfile {
  if (cachedProfile) {
    return cachedProfile
  }

  const profilePath = getProfilePath()

  if (!existsSync(profilePath)) {
    cachedProfile = createDefaultProfile()
    writeProfile(cachedProfile)
    return cachedProfile
  }

  try {
    cachedProfile = mergeProfile(JSON.parse(readFileSync(profilePath, "utf8")))
  } catch {
    cachedProfile = createDefaultProfile()
  }

  writeProfile(cachedProfile)
  return cachedProfile
}

export function addProfileXp(xpDelta: number): PetProfile {
  const currentProfile = loadProfile()
  const nextXp = Math.max(0, currentProfile.xp + xpDelta)
  cachedProfile = {
    ...currentProfile,
    level: calculateLevel(nextXp),
    updatedAt: Date.now(),
    xp: nextXp
  }
  writeProfile(cachedProfile)
  return cachedProfile
}

export function updatePetName(petName: string): PetProfile {
  const error = validatePetName(petName)

  if (error) {
    throw new Error(error)
  }

  const currentProfile = loadProfile()
  cachedProfile = {
    ...currentProfile,
    level: calculateLevel(currentProfile.xp),
    petName: normalizePetName(petName),
    updatedAt: Date.now()
  }
  writeProfile(cachedProfile)
  return cachedProfile
}

export function updateProfileSkin(skinId: string): PetProfile {
  if (!isSkinId(skinId)) {
    throw new Error("Unsupported skin.")
  }

  const currentProfile = loadProfile()
  cachedProfile = {
    ...currentProfile,
    skinId,
    updatedAt: Date.now()
  }
  writeProfile(cachedProfile)
  return cachedProfile
}

export function updateProfilePersonality(personality: string): PetProfile {
  const nextPersonality = normalizePersonality(personality)
  const currentProfile = loadProfile()
  cachedProfile = {
    ...currentProfile,
    personality: nextPersonality,
    updatedAt: Date.now()
  }
  writeProfile(cachedProfile)
  return cachedProfile
}

export function resetProfile(): PetProfile {
  cachedProfile = createDefaultProfile()
  writeProfile(cachedProfile)
  return cachedProfile
}
