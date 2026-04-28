const DEFAULT_BRIDGE_ORIGIN = "http://127.0.0.1:17321"
const BRIDGE_ORIGIN_KEY = "tinkerpetBridgeOrigin"
const DETECTOR_DEBUG_KEY = "tinkerpetDetectorDebug"
const REQUEST_TIMEOUT_MS = 800
const SOURCE_KEY_PREFIX = "tinkerpetSource:"

export async function getBridgeOrigin() {
  const result = await chrome.storage.local.get(BRIDGE_ORIGIN_KEY)
  const origin = result[BRIDGE_ORIGIN_KEY]

  return typeof origin === "string" && origin.trim().length > 0
    ? origin.trim()
    : DEFAULT_BRIDGE_ORIGIN
}

export async function setBridgeOrigin(origin) {
  await chrome.storage.local.set({
    [BRIDGE_ORIGIN_KEY]: origin
  })
}

export async function getHealth() {
  const origin = await getBridgeOrigin()
  const response = await fetch(`${origin}/health`, {
    method: "GET",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`Bridge health check failed: ${response.status}`)
  }

  return await response.json()
}

export async function getConnectionSnapshot() {
  try {
    const health = await getHealth()

    return {
      health,
      ok: true
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown bridge error",
      ok: false
    }
  }
}

export async function getDetectorDebugSnapshot() {
  const result = await chrome.storage.local.get(DETECTOR_DEBUG_KEY)
  const snapshot = result[DETECTOR_DEBUG_KEY]

  return snapshot && typeof snapshot === "object" ? snapshot : {}
}

export async function updateDetectorDebug(provider, nextStatus) {
  const snapshot = await getDetectorDebugSnapshot()

  await chrome.storage.local.set({
    [DETECTOR_DEBUG_KEY]: {
      ...snapshot,
      [provider]: {
        ...snapshot[provider],
        ...nextStatus,
        provider,
        updatedAt: Date.now()
      }
    }
  })
}

function getSourceKey(provider) {
  return `${SOURCE_KEY_PREFIX}${provider}`
}

export async function getStoredSource(provider) {
  const key = getSourceKey(provider)
  const result = await chrome.storage.local.get(key)
  const source = result[key]

  if (
    source &&
    typeof source.sourceId === "string" &&
    typeof source.token === "string"
  ) {
    return source
  }

  return null
}

export async function registerSource(provider) {
  const origin = await getBridgeOrigin()
  const response = await fetch(`${origin}/sources/register`, {
    body: JSON.stringify({
      name: `TinkerPet ${provider}`,
      provider,
      sourceType: "browser"
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`Source registration failed: ${response.status}`)
  }

  const payload = await response.json()
  const source = payload.source

  if (
    !source ||
    typeof source.sourceId !== "string" ||
    typeof source.token !== "string"
  ) {
    throw new Error("Source registration returned an invalid source")
  }

  await chrome.storage.local.set({
    [getSourceKey(provider)]: source
  })

  return source
}

export async function ensureSource(provider) {
  return (await getStoredSource(provider)) ?? (await registerSource(provider))
}

export async function postPetEvent(provider, event) {
  const origin = await getBridgeOrigin()
  const source = await ensureSource(provider)
  const response = await fetch(`${origin}/events`, {
    body: JSON.stringify(event),
    headers: {
      Authorization: `Bearer ${source.token}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`Event bridge rejected event: ${response.status}`)
  }

  return await response.json()
}

export async function heartbeatSource(provider) {
  const origin = await getBridgeOrigin()
  const source = await ensureSource(provider)

  await fetch(`${origin}/sources/heartbeat`, {
    body: JSON.stringify({
      sourceId: source.sourceId,
      token: source.token
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
}
