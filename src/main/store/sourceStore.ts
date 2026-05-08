import { app } from "electron"
import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type {
  EventProvider,
  EventSourceType,
  PublicSourceRecord,
  SourceHealth,
  SourceRecord
} from "../../shared/types"

const SOURCE_STORE_FILE_NAME = "tinkerpet-sources.json"
export const SOURCE_HEARTBEAT_TIMEOUT_MS = 60 * 1000
const EVENT_SOURCE_TYPES: EventSourceType[] = ["browser", "cli", "debug", "ide"]
const EVENT_PROVIDERS: EventProvider[] = [
  "chatgpt",
  "claude",
  "cursor",
  "deepseek",
  "gemini",
  "pet-run",
  "vscode"
]

let cachedSources: SourceRecord[] | null = null

export interface RegisterSourceInput {
  name: string
  provider?: EventProvider
  sourceType: EventSourceType
}

export interface HeartbeatSourceInput {
  sourceId: string
  token: string
}

function getSourceStorePath(): string {
  return join(app.getPath("userData"), SOURCE_STORE_FILE_NAME)
}

function createSourceId(): string {
  return `src_${randomBytes(8).toString("hex")}`
}

function createSourceToken(): string {
  return randomBytes(24).toString("hex")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toSourceHealth(lastSeenAt: number, now = Date.now()): SourceHealth {
  return now - lastSeenAt > SOURCE_HEARTBEAT_TIMEOUT_MS ? "offline" : "online"
}

function isEventSourceType(value: unknown): value is EventSourceType {
  return typeof value === "string" && EVENT_SOURCE_TYPES.includes(value as EventSourceType)
}

function isEventProvider(value: unknown): value is EventProvider {
  return typeof value === "string" && EVENT_PROVIDERS.includes(value as EventProvider)
}

function withStatus(source: SourceRecord, now = Date.now()): SourceRecord {
  const health = toSourceHealth(source.lastSeenAt, now)
  return {
    ...source,
    health,
    status: health === "online" ? "connected" : "stale"
  }
}

function mergeSourceRecord(value: unknown): SourceRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.createdAt !== "number" ||
    typeof value.lastSeenAt !== "number" ||
    typeof value.name !== "string" ||
    typeof value.sourceId !== "string" ||
    !isEventSourceType(value.sourceType) ||
    typeof value.status !== "string" ||
    typeof value.token !== "string" ||
    (value.provider !== undefined && !isEventProvider(value.provider))
  ) {
    return null
  }

  return withStatus({
    createdAt: value.createdAt,
    health:
      value.health === "online" || value.health === "offline"
        ? value.health
        : toSourceHealth(value.lastSeenAt),
    lastSeenAt: value.lastSeenAt,
    name: value.name,
    provider: value.provider,
    sourceId: value.sourceId,
    sourceType: value.sourceType,
    status: value.status === "connected" || value.status === "stale" ? value.status : "stale",
    token: value.token
  })
}

function writeSources(sources: SourceRecord[]): void {
  const sourceStorePath = getSourceStorePath()
  mkdirSync(dirname(sourceStorePath), { recursive: true })
  writeFileSync(sourceStorePath, `${JSON.stringify(sources, null, 2)}\n`, "utf8")
}

export function toPublicSource(source: SourceRecord): PublicSourceRecord {
  return {
    createdAt: source.createdAt,
    health: source.health,
    lastSeenAt: source.lastSeenAt,
    name: source.name,
    provider: source.provider,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    status: source.status
  }
}

export function loadSources(): SourceRecord[] {
  if (cachedSources) {
    return cachedSources.map((source) => withStatus(source))
  }

  const sourceStorePath = getSourceStorePath()

  if (!existsSync(sourceStorePath)) {
    cachedSources = []
    writeSources(cachedSources)
    return cachedSources
  }

  try {
    const parsed = JSON.parse(readFileSync(sourceStorePath, "utf8"))
    cachedSources = Array.isArray(parsed)
      ? parsed
          .map((item) => mergeSourceRecord(item))
          .filter((item): item is SourceRecord => item !== null)
      : []
  } catch {
    cachedSources = []
  }

  cachedSources = cachedSources.map((source) => withStatus(source))
  writeSources(cachedSources)
  return cachedSources
}

export function registerSource(input: RegisterSourceInput): SourceRecord {
  const now = Date.now()
  const sources = loadSources()
  const existingSource = sources.find(
    (source) =>
      source.name === input.name &&
      source.sourceType === input.sourceType &&
      source.provider === input.provider
  )

  if (existingSource) {
    const nextSource = withStatus({
      ...existingSource,
      lastSeenAt: now
    })
    cachedSources = sources.map((source) =>
      source.sourceId === nextSource.sourceId ? nextSource : source
    )
    writeSources(cachedSources)
    return nextSource
  }

  const nextSource: SourceRecord = {
    createdAt: now,
    health: "online",
    lastSeenAt: now,
    name: input.name,
    provider: input.provider,
    sourceId: createSourceId(),
    sourceType: input.sourceType,
    status: "connected",
    token: createSourceToken()
  }

  cachedSources = [nextSource, ...sources]
  writeSources(cachedSources)
  return nextSource
}

export function heartbeatSource(input: HeartbeatSourceInput): SourceRecord {
  const sources = loadSources()
  const source = sources.find((item) => item.sourceId === input.sourceId)

  if (!source || source.token !== input.token) {
    throw new Error("SOURCE_NOT_FOUND")
  }

  const nextSource = withStatus({
    ...source,
    lastSeenAt: Date.now()
  })

  cachedSources = sources.map((item) =>
    item.sourceId === nextSource.sourceId ? nextSource : item
  )
  writeSources(cachedSources)
  return nextSource
}

export function isSourceTokenValid(token: string): boolean {
  return loadSources().some((source) => source.token === token)
}

export function resetSources(): void {
  cachedSources = []
  writeSources(cachedSources)
}
