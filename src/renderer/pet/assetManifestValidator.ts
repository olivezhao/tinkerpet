import motionManifest from "./assets/motions/manifest.json"
import expressionManifest from "./assets/expressions/manifest.json"
import skinManifest from "./assets/skins/manifest.json"
import { AVAILABLE_SKIN_IDS, DEFAULT_SKIN_ID } from "../../shared/skins"
import { PET_ANIMATION_MANIFEST } from "./animationManifest"

function hasAllSkinIds(): boolean {
  const configuredIds = new Set(
    Array.isArray(skinManifest.skins) ? skinManifest.skins.map((item) => item.id) : []
  )

  return AVAILABLE_SKIN_IDS.every((skinId) => configuredIds.has(skinId))
}

function hasRequiredStateMappings(): boolean {
  const requiredStates = motionManifest.requiredStates

  if (!requiredStates || typeof requiredStates !== "object") {
    return false
  }

  const states = ["idle", "waiting", "finished", "failed", "sleeping"] as const
  return states.every((state) => Array.isArray(requiredStates[state]))
}

function hasAnimationCoverage(): boolean {
  const names = new Set(
    Object.values(PET_ANIMATION_MANIFEST).map((animation) => animation.name)
  )
  const requiredStates = motionManifest.requiredStates
  const stateKeys = Object.keys(requiredStates)

  return stateKeys.every((key) => {
    const candidates = requiredStates[key as keyof typeof requiredStates]
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return false
    }
    return candidates.some((name) => names.has(name))
  })
}

function hasExpressionPresets(): boolean {
  const presets = expressionManifest.presets
  if (!presets || typeof presets !== "object") {
    return false
  }

  return (
    Array.isArray(presets.encourage) &&
    Array.isArray(presets.tease) &&
    Array.isArray(presets.calm)
  )
}

export function runAssetManifestSelfCheck(): boolean {
  const checks = [
    hasAllSkinIds(),
    hasRequiredStateMappings(),
    hasAnimationCoverage(),
    hasExpressionPresets(),
    skinManifest.defaultSkinId === DEFAULT_SKIN_ID
  ]

  const passed = checks.every(Boolean)
  if (!passed) {
    console.warn(
      "TinkerPet asset manifest check failed. Falling back to built-in defaults."
    )
  }

  return passed
}

